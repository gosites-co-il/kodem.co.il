#!/usr/bin/env bash
# One-time Azure bootstrap for a Kodem deploy environment.
#
# Creates the resource group and container registry that the Bicep deployment
# expects to already exist, plus the Entra ID application GitHub Actions uses to
# authenticate over OIDC. Everything else (Container Apps, PostgreSQL, logging) is
# created by deploy/azure/main.bicep on the first deploy.
#
# Run once per environment, from the repo root:
#   ENVIRONMENT=dev GITHUB_REPO=gosites-co-il/kodem bash deploy/azure/bootstrap-azure.sh
#
# Re-running is safe: every step is idempotent.

set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-dev}"
# North Europe rather than West Europe: West Europe has been capacity constrained for
# years and subscriptions are routinely barred from provisioning PostgreSQL flexible
# servers there, which fails the deployment rather than this script. The check below
# confirms whichever region is chosen can host all three components.
LOCATION="${LOCATION:-northeurope}"
GITHUB_REPO="${GITHUB_REPO:-}"
SKIP_REGION_CHECK="${SKIP_REGION_CHECK:-}"

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
  echo "ENVIRONMENT must be 'dev' or 'prod' (got '$ENVIRONMENT')." >&2
  exit 1
fi

if [[ -z "$GITHUB_REPO" ]]; then
  echo "GITHUB_REPO must be set to '<owner>/<repo>'." >&2
  exit 1
fi

# GitHub Environments cannot be renamed, so the deploy environments stay 'dev' and
# 'prod' everywhere except in GitHub, where they keep the names they were created with.
# The federated credential is scoped to the GitHub name, so both have to agree with
# what deploy-dev.yml and deploy-prod.yml pass as github_environment.
if [[ "$ENVIRONMENT" == "prod" ]]; then
  GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-production}"
else
  GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-development}"
fi

RESOURCE_GROUP="${RESOURCE_GROUP:-kodem-${ENVIRONMENT}-rg}"
APP_REGISTRATION_NAME="${APP_REGISTRATION_NAME:-kodem-${ENVIRONMENT}-github-actions}"
MANAGED_IDENTITY_NAME="${MANAGED_IDENTITY_NAME:-kodem-${ENVIRONMENT}-identity}"

command -v az >/dev/null || { echo "Azure CLI is required: https://aka.ms/azure-cli" >&2; exit 1; }

SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
TENANT_ID="$(az account show --query tenantId -o tsv)"
echo "==> Subscription $SUBSCRIPTION_ID (tenant $TENANT_ID)"

# ACR names are globally unique, alphanumeric only, so derive a stable suffix from
# the subscription and resource group rather than asking for one.
DEFAULT_ACR_NAME="kodem${ENVIRONMENT}$(echo -n "${SUBSCRIPTION_ID}${RESOURCE_GROUP}" | sha256sum | cut -c1-8)"
ACR_NAME="${ACR_NAME:-$DEFAULT_ACR_NAME}"

echo "==> Registering resource providers..."
for provider in Microsoft.App Microsoft.ContainerRegistry Microsoft.DBforPostgreSQL Microsoft.ManagedIdentity Microsoft.OperationalInsights; do
  az provider register --namespace "$provider" --only-show-errors >/dev/null
done

# A resource group cannot move, so a different LOCATION means starting the environment
# over rather than updating it. Say so before anything else acts on the new region.
EXISTING_RG_LOCATION="$(az group show --name "$RESOURCE_GROUP" --query location -o tsv 2>/dev/null || true)"
if [[ -n "$EXISTING_RG_LOCATION" && "$EXISTING_RG_LOCATION" != "$LOCATION" ]]; then
  cat >&2 <<EOF
$RESOURCE_GROUP already exists in $EXISTING_RG_LOCATION and resource groups cannot move.

To keep it where it is:
  LOCATION=$EXISTING_RG_LOCATION ENVIRONMENT=$ENVIRONMENT GITHUB_REPO=$GITHUB_REPO bash deploy/azure/bootstrap-azure.sh

To move the environment to $LOCATION, delete it first and re-run. This destroys the
registry, the container apps and the database, so only do it to an environment whose
data you are willing to lose:
  az group delete --name $RESOURCE_GROUP --yes
EOF
  exit 1
fi

# Subscriptions are not offered every service in every region, and a deployment only
# finds out a minute and a half in — for PostgreSQL, as the unhelpful
# "The value of the 'Version' should be in: []". Ask before creating anything.
postgres_available() {
  local skus
  skus="$(az postgres flexible-server list-skus --location "$1" -o json --only-show-errors 2>/dev/null || true)"
  skus="${skus//[[:space:]]/}"
  [[ -n "$skus" && "$skus" != "[]" ]]
}

# Provider metadata lists regions as display names ("North Europe"), so compare them
# the way ARM does: case-insensitively and ignoring spaces.
normalize_region() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d ' '
}

provider_serves_region() {
  local namespace="$1" resource_type="$2" region locations loc
  region="$(normalize_region "$3")"
  locations="$(az provider show --namespace "$namespace" \
    --query "resourceTypes[?resourceType=='$resource_type'].locations[]" -o tsv 2>/dev/null || true)"
  # An unreadable provider list is not evidence of anything; do not block on it.
  [[ -n "$locations" ]] || return 0
  while read -r loc; do
    if [[ "$(normalize_region "$loc")" == "$region" ]]; then
      return 0
    fi
  done <<<"$locations"
  return 1
}

missing_components() {
  local region="$1" missing=""
  provider_serves_region Microsoft.App managedEnvironments "$region" || missing="Container Apps"
  provider_serves_region Microsoft.ContainerRegistry registries "$region" || missing="${missing:+$missing, }container registry"
  postgres_available "$region" || missing="${missing:+$missing, }PostgreSQL"
  echo "$missing"
}

if [[ -z "$SKIP_REGION_CHECK" ]]; then
  echo "==> Checking that $LOCATION can host Container Apps, the registry and PostgreSQL..."
  MISSING="$(missing_components "$LOCATION")"
  if [[ -n "$MISSING" ]]; then
    echo "!!  This subscription cannot provision $MISSING in $LOCATION."
    GEOGRAPHY="$(az account list-locations --query "[?name=='$LOCATION'].metadata.geographyGroup | [0]" -o tsv 2>/dev/null || true)"
    ALTERNATIVES=""
    ALTERNATIVE_COUNT=0
    if [[ -n "$GEOGRAPHY" ]]; then
      echo "!!  Looking for regions in $GEOGRAPHY that can host all three..."
      while read -r candidate; do
        if [[ -z "$candidate" || "$candidate" == "$LOCATION" ]]; then
          continue
        fi
        if [[ -z "$(missing_components "$candidate")" ]]; then
          echo "!!    $candidate"
          ALTERNATIVES="${ALTERNATIVES:-$candidate}"
          ALTERNATIVE_COUNT=$((ALTERNATIVE_COUNT + 1))
        fi
        if [[ "$ALTERNATIVE_COUNT" -ge 5 ]]; then
          break
        fi
      done < <(az account list-locations \
        --query "[?metadata.geographyGroup=='$GEOGRAPHY' && metadata.regionType=='Physical'].name" \
        -o tsv 2>/dev/null || true)
      if [[ "$ALTERNATIVE_COUNT" -eq 0 ]]; then
        echo "!!    none found"
      fi
    fi
    echo "" >&2
    echo "Nothing has been created. Re-run in a region that works:" >&2
    echo "  LOCATION=${ALTERNATIVES:-<region>} ENVIRONMENT=$ENVIRONMENT GITHUB_REPO=$GITHUB_REPO bash deploy/azure/bootstrap-azure.sh" >&2
    if [[ "$MISSING" == "PostgreSQL" ]]; then
      echo "" >&2
      echo "Or keep $LOCATION and put only the database elsewhere: re-run with" >&2
      echo "SKIP_REGION_CHECK=1 and set POSTGRES_LOCATION=${ALTERNATIVES:-<region>} on the" >&2
      echo "GitHub Environment." >&2
    fi
    exit 1
  fi
fi

echo "==> Creating resource group $RESOURCE_GROUP in $LOCATION..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --only-show-errors >/dev/null

echo "==> Creating container registry $ACR_NAME..."
if ! az acr show --name "$ACR_NAME" --only-show-errors >/dev/null 2>&1; then
  az acr create \
    --name "$ACR_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --sku Basic \
    --admin-enabled false \
    --only-show-errors >/dev/null
fi
ACR_ID="$(az acr show --name "$ACR_NAME" --query id -o tsv)"

# The container apps pull images as this identity. It is created here rather than in
# the Bicep template so that the deploy principal never needs permission to hand out
# role assignments, and so the AcrPull grant has long since propagated by the time the
# first revision tries to pull.
echo "==> Creating user-assigned identity $MANAGED_IDENTITY_NAME..."
az identity create \
  --name "$MANAGED_IDENTITY_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --only-show-errors >/dev/null
IDENTITY_PRINCIPAL_ID="$(az identity show --name "$MANAGED_IDENTITY_NAME" --resource-group "$RESOURCE_GROUP" --query principalId -o tsv)"

echo "==> Creating Entra ID application $APP_REGISTRATION_NAME..."
CLIENT_ID="$(az ad app list --display-name "$APP_REGISTRATION_NAME" --query '[0].appId' -o tsv)"
if [[ -z "$CLIENT_ID" ]]; then
  CLIENT_ID="$(az ad app create --display-name "$APP_REGISTRATION_NAME" --query appId -o tsv)"
fi

if ! az ad sp show --id "$CLIENT_ID" --only-show-errors >/dev/null 2>&1; then
  az ad sp create --id "$CLIENT_ID" --only-show-errors >/dev/null
fi
PRINCIPAL_ID="$(az ad sp show --id "$CLIENT_ID" --query id -o tsv)"

# Every deploy job pins `environment:`, so GitHub always presents the environment
# subject regardless of whether the run came from a branch push or a tag.
FEDERATED_NAME="github-${GITHUB_ENVIRONMENT}"
echo "==> Adding federated credential for repo:${GITHUB_REPO}:environment:${GITHUB_ENVIRONMENT}..."
if ! az ad app federated-credential show --id "$CLIENT_ID" --federated-credential-id "$FEDERATED_NAME" --only-show-errors >/dev/null 2>&1; then
  az ad app federated-credential create --id "$CLIENT_ID" --only-show-errors --parameters "{
    \"name\": \"${FEDERATED_NAME}\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GITHUB_REPO}:environment:${GITHUB_ENVIRONMENT}\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" >/dev/null
fi

# A freshly created service principal takes a little while to become visible to ARM,
# so the first assignment after `az ad sp create` can fail with "principal not found".
assign_role() {
  local principal="$1" role="$2" scope="$3" attempt
  if [[ -n "$(az role assignment list --assignee "$principal" --role "$role" --scope "$scope" --query '[0].id' -o tsv)" ]]; then
    echo "    $role on $scope (already assigned)"
    return
  fi
  for attempt in 1 2 3 4 5; do
    if az role assignment create --assignee-object-id "$principal" --assignee-principal-type ServicePrincipal \
      --role "$role" --scope "$scope" --only-show-errors >/dev/null 2>&1; then
      echo "    $role on $scope"
      return
    fi
    sleep $((attempt * 5))
  done
  echo "Failed to assign '$role' on $scope." >&2
  exit 1
}

RESOURCE_GROUP_ID="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}"
echo "==> Assigning roles..."
assign_role "$PRINCIPAL_ID" Contributor "$RESOURCE_GROUP_ID"
assign_role "$PRINCIPAL_ID" AcrPush "$ACR_ID"
assign_role "$IDENTITY_PRINCIPAL_ID" AcrPull "$ACR_ID"

SUGGESTED_JWT_SECRET="$(openssl rand -hex 32)"
SUGGESTED_PG_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' )Aa1"

if [[ "$ENVIRONMENT" == "prod" ]]; then
  DEFAULT_APP_DOMAIN="app.kodem.co.il"
  DEFAULT_API_DOMAIN="api.kodem.co.il"
  FIRST_DEPLOY_DESCRIPTION="tag a commit on main:

  git checkout main && git pull
  git tag v-0.1.0
  git push origin v-0.1.0

or start 'Deploy Production' from the Actions tab and give it an image tag."
else
  DEFAULT_APP_DOMAIN="app.dev.kodem.co.il"
  DEFAULT_API_DOMAIN="api.dev.kodem.co.il"
  FIRST_DEPLOY_DESCRIPTION="push to the dev branch, or start 'Deploy Dev' from the
Actions tab."
fi

cat <<EOF

Bootstrap complete.

Configure GitHub Environment '${GITHUB_ENVIRONMENT}'
(Settings > Environments > ${GITHUB_ENVIRONMENT}) as follows.

Variables:
  AZURE_CLIENT_ID            ${CLIENT_ID}
  AZURE_TENANT_ID            ${TENANT_ID}
  AZURE_SUBSCRIPTION_ID      ${SUBSCRIPTION_ID}
  AZURE_RESOURCE_GROUP       ${RESOURCE_GROUP}
  AZURE_CONTAINER_REGISTRY   ${ACR_NAME}
  APP_CUSTOM_DOMAIN          (optional override, defaults to ${DEFAULT_APP_DOMAIN} from main.parameters.${ENVIRONMENT}.json)
  API_CUSTOM_DOMAIN          (optional override, defaults to ${DEFAULT_API_DOMAIN} from main.parameters.${ENVIRONMENT}.json)
  POSTGRES_LOCATION          (optional override, defaults to ${LOCATION})
  POSTGRES_VERSION           (optional override, defaults to 16)
  OAUTH_GOOGLE_CLIENT_ID     (optional)
  OAUTH_GITHUB_CLIENT_ID     (optional)
  OAUTH_FACEBOOK_CLIENT_ID   (optional)

Secrets:
  POSTGRES_ADMIN_PASSWORD    ${SUGGESTED_PG_PASSWORD}
  JWT_SECRET                 ${SUGGESTED_JWT_SECRET}
  OAUTH_GOOGLE_CLIENT_SECRET     (optional)
  OAUTH_GITHUB_CLIENT_SECRET     (optional)
  OAUTH_FACEBOOK_CLIENT_SECRET   (optional)

The two suggested values above are freshly generated; store them somewhere safe.
Changing POSTGRES_ADMIN_PASSWORD later resets the database administrator password.

Then deploy: ${FIRST_DEPLOY_DESCRIPTION}

That provisions Container Apps, PostgreSQL and logging and rolls out the first images.
The custom domains are skipped on this first pass, because the DNS records they are
validated against have to point at container apps that do not exist yet. The job summary
prints the CNAME and asuid TXT records for ${DEFAULT_APP_DOMAIN} and
${DEFAULT_API_DOMAIN}; create those records, then deploy again to bind the domains and
their managed certificates.
EOF
