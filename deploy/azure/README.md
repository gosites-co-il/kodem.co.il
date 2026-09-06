# Azure deploy

Kodem runs on **Azure Container Apps**, with images in **Azure Container Registry** and
data in **Azure Database for PostgreSQL Flexible Server**. There are no servers to patch,
no nginx, and no certbot: Container Apps terminates TLS and handles ingress.

## Environments and domains

There are two environments. Each one is a separate resource group with its own registry,
database and container apps, and each maps to a GitHub Environment of the same name.

| Environment | GitHub Environment | Resource group | App | API |
|-------------|--------------------|----------------|-----|-----|
| `dev` | `dev` | `kodem-dev-rg` | `app.dev.kodem.co.il` | `api.dev.kodem.co.il` |
| `prod` | `prod` | `kodem-prod-rg` | `app.kodem.co.il` | `api.kodem.co.il` |

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
`kodem-api` keeps `allowInsecure` on even though it is externally reachable.

OAuth callbacks stay on the app domain (`https://app.kodem.co.il/api/auth/...`). The
session cookies are host-only, so moving the callbacks to the api domain would leave the
browser holding cookies it never sends back to the app.

Database migrations run from the api container's entrypoint (`prisma migrate deploy`)
on every start. Prisma takes an advisory lock, so concurrent replicas are safe.

## One-time bootstrap

Run once per environment, with the Azure CLI logged in to the target subscription:

```bash
az login
az account set --subscription <subscription-id>

ENVIRONMENT=dev GITHUB_REPO=<owner>/<repo> bash deploy/azure/bootstrap-azure.sh
ENVIRONMENT=prod GITHUB_REPO=<owner>/<repo> bash deploy/azure/bootstrap-azure.sh
```

Override `LOCATION`, `RESOURCE_GROUP` or `ACR_NAME` as environment variables if the
defaults (`westeurope`, `kodem-<env>-rg`, a derived globally unique registry name) don't
suit. The script is idempotent.

It creates the resource group, the registry, the pull identity, and an Entra ID
application with a federated credential so GitHub Actions authenticates over OIDC — there
are no Azure passwords or publish profiles stored in GitHub. It then prints the exact
variables and secrets to add to the GitHub Environment of the same name (`dev` or
`prod`).

If GitHub Environments named `development` and `production` already exist, rename them to
`dev` and `prod` (Settings > Environments — renaming keeps the variables and secrets) and
re-run the bootstrap script. The federated credential is scoped to the environment name,
so OIDC login fails until a credential for the new subject exists.

### GitHub Environment configuration

Variables:

| Name | Purpose |
|------|---------|
| `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | OIDC login |
| `AZURE_RESOURCE_GROUP` | Deployment target |
| `AZURE_CONTAINER_REGISTRY` | Registry name, without `.azurecr.io` |
| `APP_CUSTOM_DOMAIN`, `API_CUSTOM_DOMAIN` | Optional, override the hostnames in the parameter file |
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

Both can also be started from the Actions tab; the production one then asks for the image
tag to build. Both call `deploy.yml`, which lints, builds and pushes the three images to
ACR, applies the Bicep template, and then polls `/api/health` on the app and on the api
until they pass. A custom domain that does not answer yet is reported as a warning rather
than a failed deploy, since the revision itself is fine.

Because the whole environment is described by the template, the first run provisions it
and every later run is an in-place update.

## Custom domains

Container Apps issues a free managed certificate per hostname and validates ownership
against DNS. The records have to point at container apps that do not exist before the
first deploy, so bringing up a new environment takes two passes.

1. Deploy with custom domains turned off:

   ```bash
   gh workflow run deploy-dev.yml -f custom_domains=false
   ```

   The job summary prints the CNAME and `asuid` TXT records for both hostnames.
2. Create those records at the DNS provider. Point the CNAME straight at the Container
   Apps FQDN — an intermediate CNAME (Cloudflare proxying, a traffic manager) blocks
   certificate issuance and every later renewal. The TXT record has to stay in place for
   as long as the domain is bound, not just at issuance.
3. Deploy normally. The apps register the hostnames, the certificates are issued, and
   Container Apps binds each one to the matching hostname.

The hostnames are bound with `bindingType: 'Auto'`, which is what makes a single pass
work at all: Azure will not issue a certificate for a hostname that is not registered on
an app yet, and the older `SniEnabled` binding will not register a hostname without being
handed a certificate id. `Auto` registers the hostname with no certificate and picks up
the matching certificate once it exists.

The template owns the ingress configuration, so deploying with `custom_domains=false`
after the domains are live unbinds them.

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
