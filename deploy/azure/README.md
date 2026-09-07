# Azure deploy

Kodem runs on **Azure Container Apps**, with images in **Azure Container Registry** and
data in **Azure Database for PostgreSQL Flexible Server**. There are no servers to patch,
no nginx, and no certbot: Container Apps terminates TLS and handles ingress.

## Environments and domains

There are two environments. Each one is a separate resource group with its own registry,
database and container apps.

| Environment | GitHub Environment | Resource group | App | API |
|-------------|--------------------|----------------|-----|-----|
| `dev` | `development` | `kodem-dev-rg` | `app.dev.kodem.co.il` | `api.dev.kodem.co.il` |
| `prod` | `production` | `kodem-prod-rg` | `app.kodem.co.il` | `api.kodem.co.il` |

`dev` and `prod` name the environment everywhere it matters — Azure resources, parameter
files, image tags. The GitHub Environments keep the names they were created with, because
GitHub has no way to rename one, and `deploy-dev.yml` and `deploy-prod.yml` map between
the two with the `github_environment` input. Creating GitHub Environments called `dev`
and `prod` instead is a matter of changing that input and re-running the bootstrap script
so the federated credential matches.

The hostnames live in `main.parameters.dev.json` and `main.parameters.prod.json`. Setting
the `APP_CUSTOM_DOMAIN` or `API_CUSTOM_DOMAIN` variable on a GitHub Environment overrides
the matching one.

## What gets created

`main.bicep` deploys everything except the resource group, the registry and the managed
identity, which the bootstrap script creates first so that CI has somewhere to push
images to and an identity that can already pull them.

| Resource | Name | Notes |
|----------|------|-------|
| Container Apps environment | `kodem-<env>-env` | Logs to the Log Analytics workspace |
| Container app | `kodem-app` | External ingress on port 3000, bound to the app domain |
| Container app | `kodem-api` | External ingress on port 3333, bound to the api domain |
| Container app | `kodem-worker` | No ingress, pinned to one replica |
| PostgreSQL flexible server | `kodem-<env>-pg-<hash>` | Public endpoint, TLS required, Azure services allowed |
| Log Analytics workspace | `kodem-<env>-logs` | |
| Managed certificate | one per custom domain | Free, issued by Container Apps, renewed automatically |
| User-assigned identity | `kodem-<env>-identity` | Created by the bootstrap script, granted `AcrPull` |

The app domain remains the entrypoint for the browser: Next.js rewrites `/api/*` to
`http://kodem-api` over the environment's internal network, so a page load never leaves
the environment to reach the api. The api domain publishes the same api to callers that
are not the web app — integrations, webhooks, and anything talking to it directly.

Container app names deliberately have no environment suffix. They double as internal DNS
names, and the app image bakes `API_ORIGIN=http://kodem-api` at build time, so the same
image has to work in every environment. That internal hop is plain HTTP, which is why
`kodem-api` keeps `allowInsecure` on: turning it off makes the environment's proxy answer
that hop with a redirect to a hostname no certificate covers. The cost is that the api
domain answers on plain HTTP too instead of redirecting, so point clients at `https://`
explicitly.

OAuth callbacks stay on the app domain (`https://app.kodem.co.il/api/auth/...`). The
session cookies are host-only, so moving the callbacks to the api domain would leave the
browser holding cookies it never sends back to the app.

Database migrations run from the api container's entrypoint (`prisma migrate deploy`)
on every start. Prisma takes an advisory lock, so concurrent replicas are safe.

## One-time bootstrap

Run once per environment, with the Azure CLI logged in to the target subscription. There
are two equivalent scripts, `bootstrap-azure.sh` for bash and `bootstrap-azure.ps1` for
PowerShell; both derive the same registry name, so switching between them is safe.

```bash
az login
az account set --subscription <subscription-id>

ENVIRONMENT=dev GITHUB_REPO=<owner>/<repo> bash deploy/azure/bootstrap-azure.sh
ENVIRONMENT=prod GITHUB_REPO=<owner>/<repo> bash deploy/azure/bootstrap-azure.sh
```

Override `LOCATION`, `RESOURCE_GROUP` or `ACR_NAME` as environment variables if the
defaults (`northeurope`, `kodem-<env>-rg`, a derived globally unique registry name) don't
suit. The script is idempotent.

Before creating anything it checks that the region can host all three components for this
subscription — Container Apps, the container registry and a PostgreSQL flexible server —
and stops with the regions nearby that can if it cannot. `SKIP_REGION_CHECK=1`
(`-SkipRegionCheck`) bypasses it. The default is North Europe rather than West Europe
because West Europe has been capacity constrained for years and subscriptions are
routinely barred from creating flexible servers there.

Changing `LOCATION` for an environment that already exists means recreating it, since a
resource group cannot move; the script stops and prints the `az group delete` command
rather than half-moving anything.

On Windows, use the PowerShell port instead — it needs no bash and creates exactly the
same resources under the same names, so the two scripts are interchangeable:

```powershell
./deploy/azure/bootstrap-azure.ps1 -Environment dev  -GithubRepo <owner>/<repo>
./deploy/azure/bootstrap-azure.ps1 -Environment prod -GithubRepo <owner>/<repo>
```

Its optional parameters mirror the shell script's environment variables: `-Location`,
`-ResourceGroup`, `-AcrName`, `-GithubEnvironment`, `-AppRegistrationName`,
`-ManagedIdentityName`, `-SkipRegionCheck`.

It creates the resource group, the registry, the pull identity, and an Entra ID
application with a federated credential so GitHub Actions authenticates over OIDC — there
are no Azure passwords or publish profiles stored in GitHub. It then prints the exact
variables and secrets to add to the matching GitHub Environment (`development` for dev,
`production` for prod).

The federated credential is scoped to the GitHub Environment name. Set
`GITHUB_ENVIRONMENT` when running the script if that name ever changes, and pass the same
value as `github_environment` in the caller workflow — OIDC login fails until the subject
on both sides agrees.

### GitHub Environment configuration

Variables:

| Name | Purpose |
|------|---------|
| `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | OIDC login |
| `AZURE_RESOURCE_GROUP` | Deployment target |
| `AZURE_CONTAINER_REGISTRY` | Registry name, without `.azurecr.io` |
| `APP_CUSTOM_DOMAIN`, `API_CUSTOM_DOMAIN` | Optional, override the hostnames in the parameter file |
| `POSTGRES_LOCATION` | Optional, puts the database in another region than the rest — see below |
| `POSTGRES_VERSION` | Optional, overrides the PostgreSQL major version (`16`) |
| `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_FACEBOOK_CLIENT_ID` | Optional |

Secrets:

| Name | Purpose |
|------|---------|
| `POSTGRES_ADMIN_PASSWORD` | Flexible server administrator password |
| `JWT_SECRET` | API token signing key |
| `OAUTH_GOOGLE_CLIENT_SECRET`, `OAUTH_GITHUB_CLIENT_SECRET`, `OAUTH_FACEBOOK_CLIENT_SECRET` | Optional |

OAuth values left unset fall back to placeholders so the api still boots. Secrets cannot
be named with a `GITHUB_` prefix, which is why the OAuth ones use `OAUTH_`.

## Deploying

| Trigger | Workflow | Environment |
|---------|----------|-------------|
| Push to `dev` | `deploy-dev.yml` | `dev`, image tag `dev` |
| Tag `v-*` on `main` | `deploy-prod.yml` | `prod`, image tag `v-x.y.z` |
| Manual run | either, from the Actions tab | as above |

A production release is a tag on `main`, which needs nothing but git:

```bash
git checkout main && git pull
git tag v-1.0.0
git push origin v-1.0.0
```

Both workflows can also be started by hand from **Actions → Deploy Dev / Deploy
Production → Run workflow**, picking the branch or tag to deploy; the production one then
asks for the image tag to build. GitHub only shows that button for a workflow that is on
the repository's default branch, and it runs the workflow file as it exists at whichever
ref is picked, so both branches have to be up to date before a manual run does what the
current code says.

A tag push is refused unless it points at a commit on `main`. A manual run is not, since
it is a deliberate act by someone who already has access to the production environment,
and it is the only way to bring an environment up before its code has reached `main`.

Both call `deploy.yml`, which lints, builds and pushes the three images to
ACR, applies the Bicep template, and then polls `/api/health` on the app and on the api
until they pass. A custom domain that does not answer yet is reported as a warning rather
than a failed deploy, since the revision itself is fine.

Because the whole environment is described by the template, the first run provisions it
and every later run is an in-place update.

## Custom domains

Container Apps issues a free managed certificate per hostname and validates ownership
against DNS records that name the container app. Those records cannot exist before the
app does, so a new environment reaches its domains on the second deploy:

1. Deploy. The domains are skipped, because their `asuid` records do not resolve yet, and
   the job summary prints the CNAME and `asuid` TXT records to create for both hostnames.
   The environment is live on the generated `*.azurecontainerapps.io` FQDNs meanwhile.
2. Create those records at the DNS provider. Point the CNAME straight at the Container
   Apps FQDN — an intermediate CNAME (Cloudflare proxying, a traffic manager) blocks
   certificate issuance and every later renewal. The TXT record has to stay in place for
   as long as the domain is bound, not just at issuance.
3. Deploy again. The apps register the hostnames, the certificates are issued, and
   Container Apps binds each one to the matching hostname.

Nothing has to be passed for that first pass: the deploy looks up `asuid.<hostname>` and
leaves a domain off when it does not resolve, because asking for a hostname that cannot
be validated fails the whole deployment. A hostname already bound to an app stays bound
whatever the lookup says, so a resolver hiccup cannot take a live domain down.

The hostnames are bound with `bindingType: 'Auto'`, which is what lets one deploy both
register a hostname and issue its certificate: Azure will not issue a certificate for a
hostname that is not registered on an app yet, and the older `SniEnabled` binding will
not register a hostname without being handed a certificate id. `Auto` registers the
hostname with no certificate and picks up the matching certificate once it exists.

The `custom_domains` input on a manual run turns the domains off outright, which is a way
back to the generated FQDNs if a certificate goes wrong. The template owns the ingress
configuration, so running with it unchecked unbinds domains that are already live.

## PostgreSQL is not available in this region

Subscriptions are not allowed to provision flexible servers in every region, and the one
they are pointed at can also run out of capacity for a compute tier. The deployment then
fails with

```
ParameterOutOfRange: The value of the 'Version' should be in: []
```

which is Azure saying it has no server versions to offer for that subscription, region and
SKU, not that the version is wrong. Nothing in the template can be corrected to fix it.

The bootstrap script asks this before it creates anything and prints the regions that do
work, because it runs under your credentials. The deploy job cannot: the CI principal is
only a Contributor on the resource group, and the capability API answers at subscription
scope. It settles for recognising the ARM message and saying what it means. Either way the
question is the same one command:

```bash
az postgres flexible-server list-skus --location <region> -o table
```

An empty answer means the region is unavailable. Either ask Azure support to enable
flexible servers for the subscription there, or set the `POSTGRES_LOCATION` variable on
the GitHub Environment to a region that does answer. The container apps reach the database
over its public endpoint, so a different region costs latency per query rather than
connectivity — keep it in the same geography.

A non-empty answer that does not include `Standard_B1ms` means the tier is the problem
rather than the region; pick a SKU from that output and change `postgresSkuName` in
`main.parameters.<env>.json`.

## Operations

```bash
# Live logs
az containerapp logs show -n kodem-api -g kodem-dev-rg --follow

# Revisions and rollback (no rebuild, no secrets needed)
az containerapp revision list -n kodem-app -g kodem-dev-rg -o table
az containerapp ingress traffic set -n kodem-app -g kodem-dev-rg --revision-weight <previous-revision>=100

# Shell into a running replica
az containerapp exec -n kodem-api -g kodem-dev-rg --command sh

# Custom domain bindings — a bound domain has a certificateId next to its name
az containerapp show -n kodem-api -g kodem-dev-rg \
  --query properties.configuration.ingress.customDomains -o json
az containerapp env certificate list -n kodem-dev-env -g kodem-dev-rg -o table

# Connect to the database (add your IP to the firewall first)
az postgres flexible-server firewall-rule create -g kodem-dev-rg -n <server> \
  --rule-name my-ip --start-ip-address <ip> --end-ip-address <ip>
```

Rolling traffic back to an older revision is the fast path for an incident. Re-running the
deploy workflow at an older tag is the durable fix, since the next deploy overwrites
traffic weights.

## Costs

The dev defaults are the cheapest usable tier: a `Standard_B1ms` burstable PostgreSQL
server, a Basic registry, and consumption-plan container apps. The apps keep at least one
replica each, so they do not scale to zero and do not cold start. Drop `apiMinReplicas`
and `appMinReplicas` to `0` in `main.parameters.dev.json` to trade latency for cost.
