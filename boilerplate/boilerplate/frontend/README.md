# Core Custom DHL | Umine

[![React](https://img.shields.io/badge/React_19-20232a?style=for-the-badge&logo=react&logoColor=61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite_7-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI_v3-319795?style=for-the-badge&logo=chakra-ui&logoColor=white)](https://chakra-ui.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Core Custom DHL** es el modulo de evaluaciones por competencias 360 dentro del ecosistema Umine. Disenado para ser embebido via iframe dentro del portal de clientes (`clientes.umine.com`), permite gestionar evaluaciones de desempeno con soporte multi-marca, roles y generacion de planes de desarrollo individual (IDP) asistidos por IA.

---

## Modo de Operacion

Este sitio opera en **dos modos**:

| Modo | Deteccion | Descripcion |
|------|-----------|-------------|
| **Embebido** | `window.self !== window.top` | Se carga dentro de un iframe. Recibe contexto (token, rol, tema, idioma) via `postMessage` desde el portal padre. No muestra flujo de autenticacion propio. |
| **Standalone** | Acceso directo | Flujo completo de autenticacion con Firebase (Google + Email). Incluye landing, registro, seleccion de cliente. |

### Origenes permitidos para embedding

El sitio esta preparado para ser embebido desde:

- `clientes.umine.com` (produccion)
- `localhost:5173`
- `localhost:5174`
- `localhost:5175`
- `localhost:5176`
- `localhost:3000`

---

## Protocolo postMessage (Embedding)

### Parent -> Child

```javascript
iframe.contentWindow.postMessage({
  type: 'UMINE_PARENT_CONTEXT',
  payload: {
    token: string,          // Firebase ID token
    companyKey: string,     // Clave del cliente (ej: "DHL", "ENTEL")
    role: string,           // Rol del usuario (ADMIN, MANAGER, CUSTOM-*)
    email: string,          // Email del usuario
    displayName: string,    // Nombre visible
    locale: string,         // Idioma (es, en)
    colorMode: 'light' | 'dark',
    brandTheme: {           // Tema visual de la marca (opcional)
      brandId: string,
      palette: { primary, secondary, accent, neutrals, scales }
    } | null
  }
}, '*');
```

### Child -> Parent (ACK)

```javascript
event.source.postMessage({ type: 'UMINE_CHILD_ACK' }, '*');
```

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| Framework | React 19 |
| Bundler | Vite 7 |
| Lenguaje | TypeScript 5.9 (strict) |
| UI | Chakra UI v3 + Emotion |
| Animaciones | Framer Motion |
| Iconos | Lucide React |
| Navegacion | React Router v7 |
| i18n | i18next + deteccion automatica |
| Auth | Firebase (Google + Email) |
| Analytics | Google Tag Manager |
| Persistencia local | LocalForage |
| Temas | next-themes (light/dark) + brand overlay dinamico |
| Testing | Vitest + Testing Library |
| Deploy | AWS Amplify |

---

## Arquitectura

El proyecto sigue **Atomic Design**:

```
src/
  app/           # Shell principal (AppShell.tsx — decide embebido vs standalone)
  pages/         # Vistas (Evaluacion, Evaluar, Resultado, Equipo, etc.)
  organisms/     # Secciones complejas (sidebar, modales, topnav)
  molecules/     # Componentes combinados (grupos, formularios)
  atoms/         # Unidades basicas (botones, badges)
  components/ui/ # Wrappers de Chakra UI
  providers/     # Context providers (Auth, Theme, Analytics)
  contexts/      # React contexts (Theme, Customer)
  services/      # Integraciones API (DHL, Generation, Auth, Media)
  hooks/         # Hooks custom (useParentContext, useBrandTheme)
  theme/         # Tokens, semantic tokens, config de tema
  i18n.ts        # Configuracion de idiomas
```

---

## Funcionalidades Principales

### Sistema de Evaluaciones
- Evaluaciones basadas en templates por canal (Retail, TSL, FSE, MAE, BackOffice)
- Jerarquia: Competencias -> Habilidades -> Comportamientos
- Escala de madurez de 5 niveles: Novato, Basico, Competente, Avanzado, Maestro
- Autoevaluacion y evaluacion 360 (equipo)

### Roles
- `ADMIN` — Acceso completo al sistema
- `MANAGER` — Evalua equipo, ve pipeline
- `CUSTOM-*` — Roles extensibles por cliente

### IA Generativa
- Planes de desarrollo individual (IDP) generados por IA
- Feedback de evaluacion asistido
- Metadata por canal (`channelUmine`)

### Multi-marca
- Temas dinamicos por empresa via Media Engine
- Paleta de colores personalizable (primary, secondary, accent)
- Semantic tokens por marca
- Glassmorphism + light/dark mode

---

## Inicio Rapido

### Prerequisitos
- Node.js v18+
- npm

### Instalacion

```bash
npm install
```

### Desarrollo

```bash
npm run dev
# Servidor en http://localhost:5175
```

### Build y Preview

```bash
npm run build
npm run preview
```

### Tests

```bash
npm test
```

---

## Variables de Entorno

Crear un archivo `.env` en la raiz:

```env
# Firebase (capa de auth compartida con portal padre)
VITE_PUBLIC_FIREBASE_API_KEY=
VITE_PUBLIC_FIREBASE_APP_ID=
VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=
VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
VITE_PUBLIC_FIREBASE_PROJECT_ID=
VITE_PUBLIC_FIREBASE_STORAGE_BUCKET=

# Analytics
VITE_PUBLIC_GTM_ID=
VITE_ANALYTICS_PROVIDER=gtm

# Entorno
VITE_ENVIRONMENT=prod

# Auth API
VITE_AUTH_API_URL=
VITE_AUTH_CORE_ID=smart-customers
VITE_ADMIN_API_KEY=

# Servicios externos
VITE_API_MEDIA_ENGINE=       # Brand themes
VITE_API_OPERACIONES=        # Operaciones API

# DHL Evaluation Core
VITE_DHL_API_URL=

# IA Generativa
VITE_GENERATION_API_URL=
```

---

## APIs Integradas

| Servicio | Variable | Descripcion |
|----------|----------|-------------|
| DHL Evaluation | `VITE_DHL_API_URL` | Templates, evaluaciones, resultados de equipo |
| Generation | `VITE_GENERATION_API_URL` | Generacion de texto/IDP via IA |
| Auth | `VITE_AUTH_API_URL` | Verificacion de acceso y asignacion de roles |
| Media Engine | `VITE_API_MEDIA_ENGINE` | Carga de temas de marca |
| Operaciones | `VITE_API_OPERACIONES` | Datos de orquestacion |

---

## Deploy

El proyecto se despliega en **AWS Amplify**. La configuracion esta en `amplify.yml` con SPA fallback (`/<*>` -> `/index.html`).

---

## Autor

**Leonardo Cortes** - [GitHub](https://github.com/leonardocortes-dotcom)

Desarrollado para **Umine Global S.A.**
