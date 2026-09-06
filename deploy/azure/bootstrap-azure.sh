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
LOCATION="${LOCATION:-westeurope}"
GITHUB_REPO="${GITHUB_REPO:-}"

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
  echo "ENVIRONMENT must be 'dev' or 'prod' (got '$ENVIRONMENT')." >&2
  exit 1
fi

if [[ -z "$GITHUB_REPO" ]]; then
  echo "GITHUB_REPO must be set to '<owner>/<repo>'." >&2
  exit 1
fi

if [[ "$ENVIRONMENT" == "prod" ]]; then
  GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-production}"
else
  GITHUB_ENVIRONMENT="${GITHUB_ENVIRONMENT:-development}"
fi

RESOURCE_GROUP="${RESOURCE_GROUP:-kodem-${ENVIRONMENT}-rg}"
APP_REGISTRATION_NAME="${APP_REGISTRATION_NAME:-kodem-${ENVIRONMENT}-github-actions}"

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
  local role="$1" scope="$2" attempt
  if [[ -n "$(az role assignment list --assignee "$PRINCIPAL_ID" --role "$role" --scope "$scope" --query '[0].id' -o tsv)" ]]; then
    echo "    $role on $scope (already assigned)"
    return
  fi
  for attempt in 1 2 3 4 5; do
    if az role assignment create --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
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
assign_role Contributor "$RESOURCE_GROUP_ID"
# The Bicep template grants AcrPull to the container apps' managed identity, and
# creating role assignments is not something Contributor is allowed to do.
assign_role "User Access Administrator" "$RESOURCE_GROUP_ID"
assign_role AcrPush "$ACR_ID"

SUGGESTED_JWT_SECRET="$(openssl rand -hex 32)"
SUGGESTED_PG_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' )Aa1"

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
  APP_CUSTOM_DOMAIN          (optional, e.g. dev.kodem.co.il — leave empty to use the generated Container Apps FQDN)
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

Then push to the deploy branch (or run the workflow manually) to provision
Container Apps, PostgreSQL and logging, and to roll out the first images.
EOF
