# Umine | Core Operaciones

Plataforma central para la gestión de operaciones de Umine, incluyendo el procesamiento de órdenes de compra (PO) y el módulo CRM de clientes. Implementado con Vite, React y Chakra UI v3.

## Stack Tecnológico
- **Vite** + **React**
- **Chakra UI v3** (Theme & Components)
- **Tailwind** (Solo para referencia de diseño, no usado en runtime)
- **Chart.js** (Data Viz)
- **React Router** (Navegación SPA)

## Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Ejecutar tests:
   ```bash
   npm test
   ```

## Variables de Entorno
Crea un archivo `.env` basado en:
```env
# Configuración General
VITE_APP_ENV=local
VITE_ANALYTICS_PROVIDER=gtm # o 'console' para dev

# Firebase Config (Auth & Analytics)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Para más detalles sobre cómo obtener estas llaves, consulta [CLOUD_INSTRUCTIONS.md](CLOUD_INSTRUCTIONS.md).

## Deploy en AWS Amplify

El proyecto está configurado para desplegarse automáticamente en Amplify:

1. Conecta el repositorio de GitHub en la consola de Amplify.
2. Utiliza la configuración de `amplify.yml` incluida en la raíz.
3. Asegúrate de configurar la regla de redirección (Rewrite/Redirect) para SPA:
   - Source address: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - Target address: `/index.html`
   - Type: `200 (Rewrite)`

## Arquitectura
Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para más detalles sobre la estructura del proyecto y [docs/COMPONENT_MAPPING.md](docs/COMPONENT_MAPPING.md) para ver la migración desde el HTML original.
