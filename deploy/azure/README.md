# Azure deploy

Kodem runs on **Azure Container Apps**, with images in **Azure Container Registry** and
data in **Azure Database for PostgreSQL Flexible Server**. There are no servers to patch,
no nginx, and no certbot: Container Apps terminates TLS and handles ingress.

## What gets created

`main.bicep` deploys everything except the resource group and the registry, which the
bootstrap script creates first so that CI has somewhere to push images to.

| Resource | Name | Notes |
|----------|------|-------|
| Container Apps environment | `kodem-<env>-env` | Logs to the Log Analytics workspace |
| Container app | `kodem-app` | External ingress on port 3000 — the public entrypoint |
| Container app | `kodem-api` | Internal ingress on port 3333 |
| Container app | `kodem-worker` | No ingress, pinned to one replica |
| PostgreSQL flexible server | `kodem-<env>-pg-<hash>` | Public endpoint, TLS required, Azure services allowed |
| Log Analytics workspace | `kodem-<env>-logs` | |
| User-assigned identity | `kodem-<env>-identity` | Granted `AcrPull` so the apps pull without registry passwords |

The browser only ever talks to `kodem-app`. Next.js rewrites `/api/*` to the api container
app over the environment's internal network, so the api is never exposed publicly.

Container app names deliberately have no environment suffix. They double as internal DNS
names, and the app image bakes `API_ORIGIN=http://kodem-api` at build time, so the same
image has to work in every environment.

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

It creates the resource group, the registry, and an Entra ID application with a federated
credential so GitHub Actions authenticates over OIDC — there are no Azure passwords or
publish profiles stored in GitHub. It then prints the exact variables and secrets to add
to the matching GitHub Environment (`development` for dev, `production` for prod).

### GitHub Environment configuration

Variables:

| Name | Purpose |
|------|---------|
| `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | OIDC login |
| `AZURE_RESOURCE_GROUP` | Deployment target |
| `AZURE_CONTAINER_REGISTRY` | Registry name, without `.azurecr.io` |
| `APP_CUSTOM_DOMAIN` | Optional, e.g. `dev.kodem.co.il` — see below |
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
| Push to `dev` | `deploy-dev.yml` | `development`, image tag `dev` |
| Tag `v-*` on `main` | `deploy-prod.yml` | `production`, image tag `v-x.y.z` |

Both call `deploy.yml`, which lints, builds and pushes the three images to ACR, applies
the Bicep template, and then polls `https://<app-fqdn>/api/health` until it passes.

Because the whole environment is described by the template, the first run provisions it
and every later run is an in-place update.

## Custom domain

Container Apps validates domain ownership against DNS, and the DNS records point at the
app that does not exist yet on a first deploy, so this is a two-pass setup.

1. Deploy once with `APP_CUSTOM_DOMAIN` unset and note the generated FQDN.
2. Create the DNS records:
   - `CNAME dev` → `kodem-app.<region>.azurecontainerapps.io`
   - `TXT asuid.dev` → the verification id from
     `az containerapp show -n kodem-app -g kodem-dev-rg --query properties.customDomainVerificationId -o tsv`
3. Set the `APP_CUSTOM_DOMAIN` variable and re-run the deploy. The template requests a
   free managed certificate and binds it.

Keep the variable set. The template owns the ingress configuration, so clearing it on a
later run unbinds the domain.

## Operations

```bash
# Live logs
az containerapp logs show -n kodem-api -g kodem-dev-rg --follow

# Revisions and rollback (no rebuild, no secrets needed)
az containerapp revision list -n kodem-app -g kodem-dev-rg -o table
az containerapp ingress traffic set -n kodem-app -g kodem-dev-rg --revision-weight <previous-revision>=100

# Shell into a running replica
az containerapp exec -n kodem-api -g kodem-dev-rg --command sh

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
