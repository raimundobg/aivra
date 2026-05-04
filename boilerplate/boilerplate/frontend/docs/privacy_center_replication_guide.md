# Guía de Replicación: Centro de Privacidad (Privacy Center)

Esta guía detalla la ubicación, estructura y dependencias del **Centro de Privacidad** para facilitar su replicación en otros proyectos del ecosistema Umine.

## 📍 Ubicación del Módulo
El componente principal se encuentra en:
- `src/pages/PrivacyCenter.tsx`

## 🏗️ Estructura y Componentes
El Centro de Privacidad utiliza una arquitectura basada en **Atoms** y **Molecules** para mantener la consistencia visual ("Glassmorphism").

### Componentes UI (Reutilizables)
Para replicar el diseño exacto, se requieren los siguientes componentes:
1. **GlassPanel** (`src/atoms/GlassPanel.tsx`): Contenedor con efecto de desenfoque y borde sutil.
2. **PageHeader** (`src/molecules/PageHeader.tsx`): Encabezado estandarizado con icono y subtítulo.
3. **ChannelCard** (`src/molecules/ChannelCard.tsx`): Tarjetas interactivas para la selección de canales de comunicación (Email, WhatsApp, SMS).

### Iconografía
Utiliza `lucide-react` para todos los indicadores visuales:
- `ShieldCheck`, `Download`, `Trash2`, `Info`, `Mail`, `MessageSquare`, `Smartphone`, `PowerOff`.

## ⚙️ Integración con Servicios (Backend)
El componente depende de dos servicios principales para la persistencia de datos:

### 1. Auth Service (`src/services/authService.ts`)
Gestiona el perfil del usuario y sus preferencias de contacto.
- **Endpoints requeridos**:
    - `GET /admin/users/{userId}`: Carga el perfil inicial (`fono`, `favorite_channel`).
    - `PATCH /admin/users/{userId}/fono`: Actualiza el número de teléfono (formato Chileno +569).
    - `PATCH /admin/users/{userId}/favorite-channel`: Actualiza el canal de preferencia.

### 2. Support Service (`src/services/supportService.ts`)
Utilizado para la solicitud de eliminación de cuenta.
- **Flujo**: En lugar de una eliminación directa, crea un ticket de soporte de tipo `PRIVACIDAD` para procesamiento manual/admin.

## 🔑 Variables de Entorno
Asegúrate de configurar las siguientes variables en el archivo `.env` del nuevo proyecto:
```env
VITE_AUTH_API_URL=https://tu-api-auth.com
VITE_ADMIN_API_KEY=tu-api-key-de-administracion
```

## 🚀 Pasos para la Replicación
1. **Copiar Componentes**: Mover `PrivacyCenter.tsx` y los componentes de UI mencionados arriba al nuevo proyecto.
2. **Configurar i18n**: El componente utiliza `useTranslation()`. Debes copiar las llaves bajo el namespace `privacy_center` en tus archivos de traducción (`es.json`, `en.json`).
3. **Verificar Providers**: Asegúrate de que el componente esté envuelto en:
    - `AuthProvider`: Para obtener el `userId` y datos de Firebase/Auth.
    - `ChakraProvider`: Para los estilos y componentes base.
4. **Rutas**: Registrar la página en tu enrutador (ej. React Router):
   ```tsx
   <Route path="/privacy" element={<PrivacyCenter />} />
   ```

## 📝 Notas de Implementación
- **Validación de Teléfono**: Incluye una regex específica para números chilenos (`/^9\d{8}$/`).
- **Descarga de Datos**: El botón "Descargar Datos" es puramente del lado del cliente; genera un JSON con el estado actual del perfil y el `localStorage`.
- **Feedback Visual**: Utiliza `toaster` de Chakra UI para confirmar acciones exitosas o errores.
