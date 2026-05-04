# Umine Micrositio — Boilerplate & Convenciones

Guía maestra para arrancar un nuevo proyecto de cliente en el ecosistema Umine.
Basada en el patrón establecido en `umine-core-ms-dhl` + `umine-custom-ms-dhl`.

---

## 1. Arquitectura General

```
Portal padre (clientes.umine.com)
        │
        │  postMessage o acceso directo
        ▼
┌─────────────────────────────┐
│  Frontend (Amplify)          │   umine-custom-ms-{cliente}
│  React 19 + Vite + Chakra   │
│  Modo embedded o standalone  │
└────────────┬────────────────┘
             │ fetch x-api-key
             ▼
┌─────────────────────────────┐
│  Backend (CDK + Lambda)      │   umine-core-ms-{cliente}
│  API Gateway HTTP v2         │
│  Node 24 ARM64 (Graviton)   │
│  DynamoDB on-demand          │
└─────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
DynamoDB        Secrets Manager
(datos)         (api keys, firebase SA)
```

---

## 2. Naming Convention (Confirmado por Leonardo Cortés)

| Recurso | Patrón | Ejemplo USM |
|---|---|---|
| DynamoDB table | `umine-{env}-clientes-{cliente}-{topico}` | `umine-prod-clientes-usm360-usuarios` |
| Lambda function | `umine-{env}-clientes-{cliente}-{dominio}-lambda-{accion}` | `umine-prod-clientes-usm360-respuestas-lambda-submit` |
| S3 bucket | `umine-{env}-clientes-{cliente}-{topico}` | `umine-prod-clientes-usm360-informes` |
| API Gateway | `umine-{env}-clientes-{cliente}-api` | `umine-prod-clientes-usm360-api` |
| CloudWatch Dashboard | `umine-{env}-clientes-{cliente}-dashboard` | `umine-prod-clientes-usm360-dashboard` |
| Secrets Manager | `umine/{env}/clientes/{cliente}/{secreto}` | `umine/prod/clientes/usm360/admin-api-key` |
| CDK Stack | `Umine{Env}{Cliente}Stack` | `UmineProdUsm360Stack` |
| Repo backend | `umine-core-ms-{cliente}` | `umine-core-ms-usm360` |
| Repo frontend | `umine-custom-ms-{cliente}` | `umine-custom-ms-usm360` |

**Envs:** `dev` → `qa` → `prod`. Trabajar directo en `prod` está autorizado para micrositios.

---

## 3. Backend — Estructura de Carpetas

```
umine-core-ms-{cliente}/
├── bin/
│   └── app.ts                   # CDK entry: mapea branch → env
├── lib/
│   └── stacks/
│       └── core-{cliente}-stack.ts  # Stack: tablas + Lambdas + rutas + dashboard
├── src/
│   ├── auth/
│   │   └── auth-middleware.ts   # validateExternalAuth(), validateInternalAuth()
│   ├── domain/                  # Tipos de dominio (interfaces puras)
│   ├── repositories/            # CRUD DynamoDB por entidad
│   │   └── base-repository.ts   # DocumentClient genérico
│   ├── services/                # Lógica de negocio
│   ├── handlers/                # 1 handler = 1 Lambda
│   │   └── {entidad}/
│   │       └── {accion}/handler.ts
│   └── utils/
│       └── responses.ts         # successResponse(), errorResponse()
├── seed/                        # Datos iniciales
├── tests/
├── cdk.json
├── tsconfig.json                # CommonJS, strict, ESNext target
├── jest.config.js
└── package.json                 # type: "commonjs", pnpm
```

---

## 4. Backend — Patrón Handler

```typescript
// src/handlers/{entidad}/{accion}/handler.ts
import { validateExternalAuth } from '../../../auth/auth-middleware';
import { successResponse, errorResponse } from '../../../utils/responses';

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!(await validateExternalAuth(event)))
    return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body ?? '{}');

    // Validar campos requeridos
    for (const field of ['campoA', 'campoB']) {
      if (!body[field]) return errorResponse(`Missing ${field}`, 400);
    }

    // Delegar a servicio
    const result = await service.create(body);
    return successResponse(result, 201);
  } catch (err: any) {
    console.error('Error:', err);
    return errorResponse(err.message, 500);
  }
};
```

---

## 5. Backend — Patrón CDK Stack

```typescript
// lib/stacks/core-{cliente}-stack.ts
const prefix = `umine-${envName}-clientes-{cliente}`;

// 1. Tabla DynamoDB
const table = new dynamodb.Table(this, 'MiTabla', {
  tableName: `${prefix}-{topico}`,
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: envName === 'prod'
    ? cdk.RemovalPolicy.RETAIN
    : cdk.RemovalPolicy.DESTROY,
});

// 2. API Gateway
const api = new apigw.HttpApi(this, 'Api', {
  apiName: `${prefix}-api`,
  corsPreflight: {
    allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
    allowMethods: [apigw.CorsHttpMethod.OPTIONS, GET, POST, PUT],
    allowOrigins: ['http://localhost:5173', 'https://clientes.umine.com'],
  },
});

// 3. Factory de Lambda
const createLambda = (id: string, name: string, handlerPath: string) => {
  const fn = new lambda_nodejs.NodejsFunction(this, id, {
    functionName: `${prefix}-${name}-lambda-{accion}`,
    runtime: lambda.Runtime.NODEJS_24_X,
    architecture: lambda.Architecture.ARM_64,
    entry: path.join(__dirname, `../../src/handlers/${handlerPath}/handler.ts`),
    depsLockFilePath: path.join(__dirname, '../../pnpm-lock.yaml'),
    timeout: cdk.Duration.seconds(15),
    environment: { MI_TABLA: table.tableName, ENV_NAME: envName },
    bundling: { minify: true, sourceMap: true },
  });
  fn.addToRolePolicy(new iam.PolicyStatement({
    actions: ['secretsmanager:GetSecretValue'],
    resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:umine/${envName}/clientes/{cliente}/admin-api-key-*`],
  }));
  return fn;
};

// 4. Conectar Lambda → tabla
const createFn = createLambda('CreateFn', 'create', '{entidad}/create');
table.grantReadWriteData(createFn);

// 5. Rutas
const EXT = '/api/v1/external';
api.addRoutes({
  path: `${EXT}/{entidad}`,
  methods: [apigw.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration('CreateInt', createFn),
});
```

---

## 6. Backend — Auth

```typescript
// External routes: x-api-key header
// Secret en Secrets Manager: umine/{env}/clientes/{cliente}/admin-api-key
// Se cachea en memoria Lambda para toda la vida de la instancia

// Internal routes: Bearer Firebase ID token
// Secret: umine/{env}/clientes/{cliente}/firebase-service-account
```

---

## 7. Backend — CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [ main, qa, dev ]

# branch main → prod
# branch qa   → qa
# branch dev  → dev

# GitHub Secrets requeridos:
# AWS_ACCESS_KEY_ID_DEV / AWS_SECRET_ACCESS_KEY_DEV
# AWS_ACCESS_KEY_ID_QA  / AWS_SECRET_ACCESS_KEY_QA
# AWS_ACCESS_KEY_ID_PROD / AWS_SECRET_ACCESS_KEY_PROD
```

Ver `backend/github-workflows/deploy.yml` para el archivo completo.

---

## 8. Frontend — Estructura (Atomic Design)

```
src/
  app/           # AppShell.tsx — detecta embedded vs standalone
  pages/         # Vistas completas (una por feature)
  organisms/     # Secciones complejas (sidebar, modales, nav)
  molecules/     # Componentes combinados (grupos, formularios)
  atoms/         # Unidades básicas (GlassPanel, badges, botones)
  components/ui/ # Wrappers Chakra UI
  providers/     # AuthProvider, ThemeProvider, AnalyticsProvider
  contexts/      # ThemeContext, CustomerContext
  services/      # Clientes API ({cliente}Service.ts)
  hooks/         # useParentContext, useBrandTheme, useAnalytics
  theme/         # tokens.ts, semanticTokens.ts, config.ts
  i18n.ts        # i18next config
```

---

## 9. Frontend — Modos de Operación

**Embedded** (iframe desde clientes.umine.com):
- Detectado: `window.self !== window.top`
- Recibe contexto vía `postMessage` tipo `UMINE_PARENT_CONTEXT`
- Payload: `{ token, companyKey, role, email, displayName, locale, colorMode, brandTheme }`
- Responde ACK: `UMINE_CHILD_ACK`

**Standalone** (acceso directo):
- Firebase auth completo (Google + Email/Password)
- Verifica acceso en Auth API `/verify`
- Soporte onboarding seguro vía `?token=...` en URL

---

## 10. Frontend — Servicio API

```typescript
// src/services/{cliente}Service.ts
const API_URL = import.meta.env.VITE_{CLIENTE}_API_URL;
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export const {cliente}Service = {
  getItem: async (id: string) => {
    const res = await fetch(`${API_URL}/api/v1/external/{entidad}/${id}`, { headers });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  },
  // ...
};
```

---

## 11. Frontend — Variables de Entorno

```env
# Firebase (compartido con portal padre umine-prod-clientes)
VITE_PUBLIC_FIREBASE_API_KEY=
VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=
VITE_PUBLIC_FIREBASE_PROJECT_ID=umine-prod-clientes
VITE_PUBLIC_FIREBASE_STORAGE_BUCKET=
VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
VITE_PUBLIC_FIREBASE_APP_ID=

# Auth (ecosistema Umine)
VITE_AUTH_API_URL=https://vpzy9dkfa9.execute-api.us-east-2.amazonaws.com/prod
VITE_AUTH_CORE_ID=smart-customers
VITE_ADMIN_API_KEY=umine-auth-prod-staff-xzy

# Servicios externos Umine
VITE_API_MEDIA_ENGINE=https://4csgu2gl32.execute-api.us-east-2.amazonaws.com
VITE_API_OPERACIONES=https://ago9nj8ru0.execute-api.us-east-2.amazonaws.com
VITE_GENERATION_API_URL=https://xhvnv4qnjl.execute-api.us-east-2.amazonaws.com

# Backend del micrositio (reemplazar por URL del deploy)
VITE_{CLIENTE}_API_URL=https://...execute-api.us-east-2.amazonaws.com

# Analytics
VITE_PUBLIC_GTM_ID=GTM-PPKD7XSP
VITE_ANALYTICS_PROVIDER=gtm

# Entorno
VITE_ENVIRONMENT=prod
```

---

## 12. Frontend — Deploy (Amplify)

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
customRules:
  - source: /<*>
    target: /index.html
    status: 200   # SPA fallback — crítico para React Router
```

---

## 13. Checklist Nuevo Proyecto

### Backend
- [ ] Crear repo `umine-core-ms-{cliente}` (clonar desde umine-core-ms-dhl)
- [ ] Actualizar naming en CDK stack (`prefix = umine-${env}-clientes-{cliente}`)
- [ ] Definir tablas DynamoDB + GSIs necesarios
- [ ] Crear handlers para cada endpoint
- [ ] Actualizar `seed/` con datos iniciales del cliente
- [ ] Configurar GitHub Secrets (AWS creds x3 envs)
- [ ] Crear secrets en AWS Secrets Manager (`umine/prod/clientes/{cliente}/admin-api-key`)
- [ ] Push a `main` → CDK deploy automático

### Frontend
- [ ] Crear repo `umine-custom-ms-{cliente}` (clonar desde umine-custom-ms-dhl)
- [ ] Renombrar `dhlService.ts` → `{cliente}Service.ts`
- [ ] Actualizar variable `VITE_DHL_API_URL` → `VITE_{CLIENTE}_API_URL`
- [ ] Adaptar páginas al dominio del cliente (eliminar las de DHL)
- [ ] Configurar `.env` con valores reales
- [ ] Conectar en AWS Amplify al repo de GitHub
- [ ] Configurar variables de entorno en Amplify console

---

## 14. Archivos de Referencia en Esta Carpeta

```
boilerplate/
├── INSTRUCTIONS.md              ← este archivo
├── backend/
│   ├── README.md                ← documentación backend DHL
│   ├── cdk.json                 ← config CDK
│   ├── tsconfig.json            ← TS backend (CommonJS, strict)
│   ├── jest.config.js           ← testing setup
│   ├── package.json             ← dependencias backend
│   └── github-workflows/
│       └── deploy.yml           ← CI/CD pipeline completo
└── frontend/
    ├── README.md                ← documentación frontend DHL
    ├── amplify.yml              ← deploy Amplify
    ├── tsconfig.json            ← TS refs
    ├── tsconfig.app.json        ← TS app (ESNext, strict)
    ├── tsconfig.node.json       ← TS vite config
    ├── vite.config.ts           ← build + iframe headers
    ├── eslint.config.js         ← linting rules
    ├── index.html               ← template con GTM + ElevenLabs
    ├── package.json             ← dependencias frontend
    ├── scripts/
    │   └── generate_token.cjs  ← genera tokens de onboarding
    └── docs/
        └── privacy_center_replication_guide.md
```
