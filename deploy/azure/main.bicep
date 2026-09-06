metadata description = 'Kodem platform on Azure Container Apps, backed by Azure Database for PostgreSQL Flexible Server.'

targetScope = 'resourceGroup'

@description('Short environment name. Used as a suffix on resource names.')
@allowed(['dev', 'prod'])
param environmentName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Name of the existing Azure Container Registry holding the kodem images. Created by deploy/azure/bootstrap-azure.sh.')
param containerRegistryName string

@description('Name of the existing user-assigned identity the container apps run as. Created by deploy/azure/bootstrap-azure.sh, which also grants it AcrPull on the registry.')
param managedIdentityName string = ''

@description('Image tag to deploy for all three services.')
param imageTag string

@description('Custom domain for the web app, e.g. app.kodem.co.il (prod) or app.dev.kodem.co.il (dev). Requires the CNAME and asuid TXT records to exist first; see deploy/azure/README.md. Leave empty to serve on the generated Container Apps FQDN.')
param appCustomDomain string = ''

@description('Custom domain for the api, e.g. api.kodem.co.il (prod) or api.dev.kodem.co.il (dev). Same DNS prerequisites as appCustomDomain. Leave empty to serve on the generated Container Apps FQDN.')
param apiCustomDomain string = ''

@description('PostgreSQL administrator login.')
param postgresAdminUser string = 'kodem'

@secure()
@description('PostgreSQL administrator password.')
param postgresAdminPassword string

@secure()
@description('Secret used to sign API access tokens.')
param jwtSecret string

@description('Google OAuth client id. Leave empty to boot with a placeholder.')
param googleClientId string = ''

@secure()
@description('Google OAuth client secret. Leave empty to boot with a placeholder.')
param googleClientSecret string = ''

@description('GitHub OAuth client id. Leave empty to boot with a placeholder.')
param githubClientId string = ''

@secure()
@description('GitHub OAuth client secret. Leave empty to boot with a placeholder.')
param githubClientSecret string = ''

@description('Facebook OAuth client id. Leave empty to boot with a placeholder.')
param facebookClientId string = ''

@secure()
@description('Facebook OAuth client secret. Leave empty to boot with a placeholder.')
param facebookClientSecret string = ''

@description('Compute tier for the PostgreSQL flexible server.')
param postgresSkuName string = 'Standard_B1ms'

@allowed(['Burstable', 'GeneralPurpose', 'MemoryOptimized'])
param postgresSkuTier string = 'Burstable'

@description('PostgreSQL storage in GB.')
param postgresStorageGb int = 32

@description('Log Analytics retention in days.')
param logRetentionDays int = 30

@description('Replica bounds for the api container app.')
param apiMinReplicas int = 1
param apiMaxReplicas int = 3

@description('Replica bounds for the app container app.')
param appMinReplicas int = 1
param appMaxReplicas int = 3

// Container app names are also their internal DNS names inside the Container Apps
// environment, so they stay identical across environments: the app image bakes
// API_ORIGIN=http://kodem-api at build time and must resolve in dev and prod alike.
var apiAppName = 'kodem-api'
var workerAppName = 'kodem-worker'
var webAppName = 'kodem-app'

var prefix = 'kodem-${environmentName}'
var databaseName = 'kodem'
var resolvedIdentityName = empty(managedIdentityName) ? '${prefix}-identity' : managedIdentityName

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${prefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: logRetentionDays
  }
}

// The identity and its AcrPull grant are created by the bootstrap script rather than
// here: it keeps the CI principal down to Contributor (creating role assignments needs
// more than that), and it means the grant has long since propagated by the time the
// first revision tries to pull an image.
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: resolvedIdentityName
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: containerRegistryName
}

// The flexible server name becomes a public DNS label, so it needs to be globally
// unique rather than just unique inside the resource group.
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: '${prefix}-pg-${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: postgresSkuName
    tier: postgresSkuTier
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminUser
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: postgresStorageGb
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: environmentName == 'prod' ? 14 : 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Container Apps egress IPs are not stable, so the services reach PostgreSQL through
// the "allow Azure services" rule (the 0.0.0.0 sentinel) rather than an IP allowlist.
resource postgresAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  parent: postgres
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource containerEnv 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: '${prefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

var loginServer = registry.properties.loginServer
var resolvedAppUrl = empty(appCustomDomain)
  ? 'https://${webAppName}.${containerEnv.properties.defaultDomain}'
  : 'https://${appCustomDomain}'
var resolvedApiUrl = empty(apiCustomDomain)
  ? 'https://${apiAppName}.${containerEnv.properties.defaultDomain}'
  : 'https://${apiCustomDomain}'
var databaseUrl = 'postgresql://${postgresAdminUser}:${uriComponent(postgresAdminPassword)}@${postgres.properties.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'

var registryConfig = [
  {
    server: loginServer
    identity: identity.id
  }
]

var managedIdentity = {
  type: 'UserAssigned'
  userAssignedIdentities: {
    '${identity.id}': {}
  }
}

resource api 'Microsoft.App/containerApps@2025-07-01' = {
  name: apiAppName
  location: location
  identity: managedIdentity
  dependsOn: [
    postgresDatabase
    postgresAllowAzure
  ]
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3333
        transport: 'auto'
        // The web tier proxies /api/* to http://kodem-api over the environment's
        // internal network, so plain HTTP has to keep working inside the environment.
        // Turning this off makes Envoy answer those hops with a redirect to a
        // hostname that only resolves inside Azure.
        allowInsecure: true
        customDomains: empty(apiCustomDomain)
          ? []
          : [
              {
                name: apiCustomDomain
                bindingType: 'Auto'
              }
            ]
      }
      registries: registryConfig
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'google-client-secret'
          value: empty(googleClientSecret) ? 'google-client-secret' : googleClientSecret
        }
        {
          name: 'github-client-secret'
          value: empty(githubClientSecret) ? 'github-client-secret' : githubClientSecret
        }
        {
          name: 'facebook-client-secret'
          value: empty(facebookClientSecret) ? 'facebook-client-secret' : facebookClientSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${loginServer}/kodem-api:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3333' }
            { name: 'APP_URL', value: resolvedAppUrl }
            { name: 'COOKIE_SECURE', value: 'true' }
            { name: 'FEATURE_FLAG_ENV', value: environmentName == 'prod' ? 'production' : 'development' }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
            { name: 'GOOGLE_CLIENT_ID', value: empty(googleClientId) ? 'google-client-id' : googleClientId }
            { name: 'GOOGLE_CLIENT_SECRET', secretRef: 'google-client-secret' }
            { name: 'GOOGLE_CALLBACK_URL', value: '${resolvedAppUrl}/api/auth/google/callback' }
            { name: 'GITHUB_CLIENT_ID', value: empty(githubClientId) ? 'github-client-id' : githubClientId }
            { name: 'GITHUB_CLIENT_SECRET', secretRef: 'github-client-secret' }
            { name: 'GITHUB_CALLBACK_URL', value: '${resolvedAppUrl}/api/auth/github/callback' }
            { name: 'FACEBOOK_CLIENT_ID', value: empty(facebookClientId) ? 'facebook-client-id' : facebookClientId }
            { name: 'FACEBOOK_CLIENT_SECRET', secretRef: 'facebook-client-secret' }
            { name: 'FACEBOOK_CALLBACK_URL', value: '${resolvedAppUrl}/api/auth/facebook/callback' }
          ]
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: 3333
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 6
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: 3333
              }
              initialDelaySeconds: 60
              periodSeconds: 30
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: apiMinReplicas
        maxReplicas: apiMaxReplicas
      }
    }
  }
}

// The worker polls the event queue, so it stays pinned to a single replica to avoid
// two runners picking up the same pending events.
resource worker 'Microsoft.App/containerApps@2025-07-01' = {
  name: workerAppName
  location: location
  identity: managedIdentity
  dependsOn: [
    api
  ]
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      registries: registryConfig
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'worker'
          image: '${loginServer}/kodem-worker:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'WORKER_PORT', value: '3334' }
            { name: 'WORKER_POLL_MS', value: '2000' }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/worker/health'
                port: 3334
              }
              initialDelaySeconds: 30
              periodSeconds: 30
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

resource web 'Microsoft.App/containerApps@2025-07-01' = {
  name: webAppName
  location: location
  identity: managedIdentity
  dependsOn: [
    api
  ]
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
        customDomains: empty(appCustomDomain)
          ? []
          : [
              {
                name: appCustomDomain
                bindingType: 'Auto'
              }
            ]
      }
      registries: registryConfig
    }
    template: {
      containers: [
        {
          name: 'app'
          image: '${loginServer}/kodem-app:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          // API_ORIGIN is baked into the Next.js standalone build, so it is a build
          // arg in the deploy workflow rather than a variable here.
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3000' }
            { name: 'HOSTNAME', value: '0.0.0.0' }
          ]
          // Probes the Next.js server itself, not '/api/health', so an api blip does
          // not also take the web tier out of rotation.
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 6
            }
          ]
        }
      ]
      scale: {
        minReplicas: appMinReplicas
        maxReplicas: appMaxReplicas
      }
    }
  }
}

// Managed certificates are issued against DNS, and Azure refuses to issue one for a
// hostname that is not registered on an app yet — while 'SniEnabled' refuses to
// register a hostname without naming a certificate. 'Auto' breaks that cycle: the app
// registers the hostname with no certificate, the certificate is created afterwards,
// and Container Apps binds it to the matching hostname on its own.
resource appCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2025-07-01' = if (!empty(appCustomDomain)) {
  parent: containerEnv
  name: replace(appCustomDomain, '.', '-')
  location: location
  properties: {
    subjectName: appCustomDomain
    domainControlValidation: 'CNAME'
  }
  dependsOn: [
    web
  ]
}

resource apiCertificate 'Microsoft.App/managedEnvironments/managedCertificates@2025-07-01' = if (!empty(apiCustomDomain)) {
  parent: containerEnv
  name: replace(apiCustomDomain, '.', '-')
  location: location
  properties: {
    subjectName: apiCustomDomain
    domainControlValidation: 'CNAME'
  }
  dependsOn: [
    api
  ]
}

output appFqdn string = web.properties.configuration.ingress.fqdn
output appUrlResolved string = resolvedAppUrl
output apiFqdn string = api.properties.configuration.ingress.fqdn
output apiUrlResolved string = resolvedApiUrl
output appCustomDomainConfigured string = appCustomDomain
output apiCustomDomainConfigured string = apiCustomDomain
output containerRegistryLoginServer string = loginServer
output postgresFqdn string = postgres.properties.fullyQualifiedDomainName
output apiInternalOrigin string = 'http://${apiAppName}'
