<#
.SYNOPSIS
    One-time Azure bootstrap for a Kodem deploy environment.

.DESCRIPTION
    PowerShell port of bootstrap-azure.sh, for Windows machines without bash. The two
    scripts create the same resources under the same names, so either can be used and
    re-running either one is safe.

    Creates the resource group, container registry and pull identity that the Bicep
    deployment expects to already exist, plus the Entra ID application GitHub Actions
    uses to authenticate over OIDC. Everything else (Container Apps, PostgreSQL,
    logging) is created by deploy/azure/main.bicep on the first deploy.

.EXAMPLE
    ./deploy/azure/bootstrap-azure.ps1 -Environment dev -GithubRepo owner/repo
#>

[CmdletBinding()]
param(
    [ValidateSet('dev', 'prod')]
    [string]$Environment = 'dev',

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[^/]+/[^/]+$')]
    [string]$GithubRepo,

    [string]$Location = 'westeurope',

    # GitHub Environments cannot be renamed, so the deploy environments stay 'dev' and
    # 'prod' everywhere except in GitHub, where they keep the names they were created
    # with. The federated credential is scoped to the GitHub name, so this has to agree
    # with what deploy-dev.yml and deploy-prod.yml pass as github_environment.
    [string]$GithubEnvironment,

    [string]$ResourceGroup,
    [string]$AcrName,
    [string]$AppRegistrationName,
    [string]$ManagedIdentityName
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

# Both helpers read their arguments from the automatic $args rather than a param block,
# so that az switches like -o are passed through instead of being bound as PowerShell
# parameters.
#
# They also drop $ErrorActionPreference to 'Continue' for the duration of the call and
# judge the result by the exit code alone. az reports ordinary answers like "resource
# not found" on stderr, and Windows PowerShell turns anything a native command writes
# to stderr into a terminating error while the preference is 'Stop'.
function Invoke-Az {
    $ErrorActionPreference = 'Continue'
    $output = & az @args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "az $($args -join ' ') failed:`n$($output | Out-String)"
    }
    return ($output | Out-String).Trim()
}

# For the existence checks, where a non-zero exit is the answer rather than a failure.
function Invoke-AzOrNull {
    $ErrorActionPreference = 'Continue'
    $output = & az @args 2>&1
    if ($LASTEXITCODE -ne 0) { return $null }
    return ($output | Out-String).Trim()
}

function Get-RandomByteArray {
    param([int]$Count)

    $bytes = [byte[]]::new($Count)
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return $bytes
}

function ConvertTo-HexString {
    param([byte[]]$Bytes)

    return (($Bytes | ForEach-Object { $_.ToString('x2') }) -join '')
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host 'Azure CLI is required: https://aka.ms/azure-cli' -ForegroundColor Red
    exit 1
}

if (-not $GithubEnvironment) {
    $GithubEnvironment = if ($Environment -eq 'prod') { 'production' } else { 'development' }
}
if (-not $ResourceGroup) { $ResourceGroup = "kodem-$Environment-rg" }
if (-not $AppRegistrationName) { $AppRegistrationName = "kodem-$Environment-github-actions" }
if (-not $ManagedIdentityName) { $ManagedIdentityName = "kodem-$Environment-identity" }

$subscriptionId = Invoke-Az account show --query id -o tsv
$tenantId = Invoke-Az account show --query tenantId -o tsv
Write-Host "==> Subscription $subscriptionId (tenant $tenantId)"

# ACR names are globally unique, alphanumeric only, so derive a stable suffix from the
# subscription and resource group rather than asking for one. Same derivation as the
# bash script, so both produce the same registry name.
if (-not $AcrName) {
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $digest = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes("$subscriptionId$ResourceGroup"))
    $AcrName = "kodem$Environment$((ConvertTo-HexString $digest).Substring(0, 8))"
}

Write-Host '==> Registering resource providers...'
foreach ($provider in @(
        'Microsoft.App',
        'Microsoft.ContainerRegistry',
        'Microsoft.DBforPostgreSQL',
        'Microsoft.ManagedIdentity',
        'Microsoft.OperationalInsights')) {
    Invoke-Az provider register --namespace $provider --only-show-errors | Out-Null
}

# A subscription is not allowed to provision PostgreSQL flexible servers in every
# region. A deployment only finds that out a minute and a half in, and reports it as
# "The value of the 'Version' should be in: []", so ask the capability API here.
function Test-PostgresAvailable {
    param([string]$Region)

    $skus = Invoke-AzOrNull postgres flexible-server list-skus --location $Region -o json --only-show-errors
    if (-not $skus) { return $false }
    return ($skus -replace '\s', '') -ne '[]'
}

Write-Host "==> Checking PostgreSQL availability in $Location..."
$postgresLocationHint = "(optional override, defaults to $Location)"
if (-not (Test-PostgresAvailable $Location)) {
    Write-Host "!!  This subscription cannot provision PostgreSQL flexible servers in $Location."
    $geography = Invoke-AzOrNull account list-locations `
        --query "[?name=='$Location'].metadata.geographyGroup | [0]" -o tsv
    $alternatives = @()
    if ($geography) {
        Write-Host "!!  Looking for regions in $geography that it can use..."
        $candidates = (Invoke-AzOrNull account list-locations `
                --query "[?metadata.geographyGroup=='$geography' && metadata.regionType=='Physical'].name" `
                -o tsv) -split '\r?\n'
        foreach ($candidate in $candidates) {
            if (-not $candidate -or $candidate -eq $Location) { continue }
            if (Test-PostgresAvailable $candidate) {
                Write-Host "!!    $candidate"
                $alternatives += $candidate
            }
            if ($alternatives.Count -ge 5) { break }
        }
        if ($alternatives.Count -eq 0) { Write-Host '!!    none found' }
    }
    $suggestion = if ($alternatives.Count -gt 0) { $alternatives[0] } else { '<a region this subscription can use>' }
    $postgresLocationHint = "$suggestion  <- required, $Location cannot host the database"
    Write-Host '!!  Set POSTGRES_LOCATION as printed below to keep the rest of the stack in'
    Write-Host "!!  $Location, or re-run with -Location <region> to move everything."
}

Write-Host "==> Creating resource group $ResourceGroup in $Location..."
Invoke-Az group create --name $ResourceGroup --location $Location --only-show-errors | Out-Null

Write-Host "==> Creating container registry $AcrName..."
if (-not (Invoke-AzOrNull acr show --name $AcrName --only-show-errors)) {
    Invoke-Az acr create --name $AcrName --resource-group $ResourceGroup `
        --sku Basic --admin-enabled false --only-show-errors | Out-Null
}
$acrId = Invoke-Az acr show --name $AcrName --query id -o tsv

# The container apps pull images as this identity. It is created here rather than in
# the Bicep template so that the deploy principal never needs permission to hand out
# role assignments, and so the AcrPull grant has long since propagated by the time the
# first revision tries to pull.
Write-Host "==> Creating user-assigned identity $ManagedIdentityName..."
Invoke-Az identity create --name $ManagedIdentityName --resource-group $ResourceGroup `
    --location $Location --only-show-errors | Out-Null
$identityPrincipalId = Invoke-Az identity show --name $ManagedIdentityName `
    --resource-group $ResourceGroup --query principalId -o tsv

Write-Host "==> Creating Entra ID application $AppRegistrationName..."
$clientId = Invoke-Az ad app list --display-name $AppRegistrationName --query '[0].appId' -o tsv
if (-not $clientId) {
    $clientId = Invoke-Az ad app create --display-name $AppRegistrationName --query appId -o tsv
}

if (-not (Invoke-AzOrNull ad sp show --id $clientId --only-show-errors)) {
    Invoke-Az ad sp create --id $clientId --only-show-errors | Out-Null
}
$principalId = Invoke-Az ad sp show --id $clientId --query id -o tsv

# Every deploy job pins `environment:`, so GitHub always presents the environment
# subject regardless of whether the run came from a branch push or a tag.
$federatedName = "github-$GithubEnvironment"
Write-Host "==> Adding federated credential for repo:${GithubRepo}:environment:${GithubEnvironment}..."
if (-not (Invoke-AzOrNull ad app federated-credential show --id $clientId `
            --federated-credential-id $federatedName --only-show-errors)) {
    # Passed as a file because quoting inline JSON for a native command differs between
    # Windows PowerShell and PowerShell 7.
    $credentialFile = Join-Path ([System.IO.Path]::GetTempPath()) "kodem-federated-$([guid]::NewGuid()).json"
    $credential = [ordered]@{
        name      = $federatedName
        issuer    = 'https://token.actions.githubusercontent.com'
        subject   = "repo:${GithubRepo}:environment:${GithubEnvironment}"
        audiences = @('api://AzureADTokenExchange')
    }
    try {
        [System.IO.File]::WriteAllText($credentialFile, ($credential | ConvertTo-Json -Compress))
        Invoke-Az ad app federated-credential create --id $clientId `
            --parameters $credentialFile --only-show-errors | Out-Null
    }
    finally {
        Remove-Item $credentialFile -ErrorAction SilentlyContinue
    }
}

# A freshly created service principal takes a little while to become visible to ARM,
# so the first assignment after `az ad sp create` can fail with "principal not found".
function Grant-Role {
    param([string]$Principal, [string]$Role, [string]$Scope)

    if (Invoke-AzOrNull role assignment list --assignee $Principal --role $Role `
            --scope $Scope --query '[0].id' -o tsv) {
        Write-Host "    $Role on $Scope (already assigned)"
        return
    }
    foreach ($attempt in 1..5) {
        $assigned = Invoke-AzOrNull role assignment create --assignee-object-id $Principal `
            --assignee-principal-type ServicePrincipal --role $Role --scope $Scope --only-show-errors
        if ($null -ne $assigned) {
            Write-Host "    $Role on $Scope"
            return
        }
        Start-Sleep -Seconds ($attempt * 5)
    }
    throw "Failed to assign '$Role' on $Scope."
}

$resourceGroupId = "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup"
Write-Host '==> Assigning roles...'
Grant-Role -Principal $principalId -Role Contributor -Scope $resourceGroupId
Grant-Role -Principal $principalId -Role AcrPush -Scope $acrId
Grant-Role -Principal $identityPrincipalId -Role AcrPull -Scope $acrId

$suggestedJwtSecret = ConvertTo-HexString (Get-RandomByteArray 32)
$suggestedPgPassword = ([Convert]::ToBase64String((Get-RandomByteArray 24)) -replace '[/+=]', '') + 'Aa1'

if ($Environment -eq 'prod') {
    $defaultAppDomain = 'app.kodem.co.il'
    $defaultApiDomain = 'api.kodem.co.il'
    $firstDeployCommand = 'gh workflow run deploy-prod.yml -f image_tag=v-0.1.0 -f custom_domains=false'
}
else {
    $defaultAppDomain = 'app.dev.kodem.co.il'
    $defaultApiDomain = 'api.dev.kodem.co.il'
    $firstDeployCommand = 'gh workflow run deploy-dev.yml -f custom_domains=false'
}

Write-Host @"

Bootstrap complete.

Configure GitHub Environment '$GithubEnvironment'
(Settings > Environments > $GithubEnvironment) as follows.

Variables:
  AZURE_CLIENT_ID            $clientId
  AZURE_TENANT_ID            $tenantId
  AZURE_SUBSCRIPTION_ID      $subscriptionId
  AZURE_RESOURCE_GROUP       $ResourceGroup
  AZURE_CONTAINER_REGISTRY   $AcrName
  APP_CUSTOM_DOMAIN          (optional override, defaults to $defaultAppDomain from main.parameters.$Environment.json)
  API_CUSTOM_DOMAIN          (optional override, defaults to $defaultApiDomain from main.parameters.$Environment.json)
  POSTGRES_LOCATION          $postgresLocationHint
  POSTGRES_VERSION           (optional override, defaults to 16)
  OAUTH_GOOGLE_CLIENT_ID     (optional)
  OAUTH_GITHUB_CLIENT_ID     (optional)
  OAUTH_FACEBOOK_CLIENT_ID   (optional)

Secrets:
  POSTGRES_ADMIN_PASSWORD    $suggestedPgPassword
  JWT_SECRET                 $suggestedJwtSecret
  OAUTH_GOOGLE_CLIENT_SECRET     (optional)
  OAUTH_GITHUB_CLIENT_SECRET     (optional)
  OAUTH_FACEBOOK_CLIENT_SECRET   (optional)

The two suggested values above are freshly generated; store them somewhere safe.
Changing POSTGRES_ADMIN_PASSWORD later resets the database administrator password.

Then run the deploy workflow with custom domains turned off, since the DNS records
have to point at container apps that do not exist yet:

  $firstDeployCommand

It provisions Container Apps, PostgreSQL and logging, rolls out the first images, and
prints the CNAME and asuid TXT records for $defaultAppDomain and
$defaultApiDomain in the job summary. Create those records, then deploy again
normally to bind the domains and their managed certificates.
"@
