# Instrucciones de Integración Cloud (Firebase + GTM)

Este documento detalla los pasos para configurar los servicios de infraestructura necesarios para la autenticación (Firebase Auth) y análisis de eventos (Google Tag Manager).

## 1. Configuración de Firebase (Auth & Analytics)

### Pasos:
1.  **Crear Proyecto**: Ve a [Firebase Console](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  **Añadir App Web**: Registra una nueva aplicación web para obtener las credenciales.
3.  **Configurar Variables**: Copia los valores en tu archivo `.env`:
    ```env
    VITE_FIREBASE_API_KEY=AIza...
    VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=tu-proyecto
    VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
    VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
    VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
    ```
4.  **Habilitar Autenticación**: En Firebase Console, ve a **Authentication** -> **Sign-in method** y activa "Google".
5.  **Habilitar Analytics**: Asegúrate de que Google Analytics esté activado en la configuración del proyecto de Firebase.

### 1-bis. Autorizar Dominios (Importante para Deploy)
Para que el login de Google funcione en tu URL de Amplify, debes autorizar el dominio:
1.  En Firebase Console, ve a **Authentication** -> **Settings** -> **Authorized domains**.
2.  Haz clic en **Add domain**.
3.  Pega tu URL de Amplify: `main.d1wouqi9sq00k5.amplifyapp.com` (sin el https://).

---

## 2. Google Tag Manager (GTM)

El proyecto utiliza una capa de abstracción para enviar eventos a GTM a través del `dataLayer`.

### Pasos:
1.  **Obtener Container ID**: Ve a [GTM](https://tagmanager.google.com/) y copia el ID (formato `GTM-XXXXXXX`).
2.  **Configurar Proveedor**: Define el proveedor en el `.env`:
    ```env
    VITE_ANALYTICS_PROVIDER=gtm
    ```
3.  **Script de GTM**: El ID se inyecta automáticamente si está configurado en el entorno de despliegue (Amplify/Vercel).

---

## 3. Eventos Trackeados

El sistema utiliza `useAnalytics()` para registrar las siguientes acciones:

| Evento | Descripción | Propiedades |
| :--- | :--- | :--- |
| `page_view` | Vista de página automática | `page_path`, `page_title` |
| `brand_generate` | Generación de marca vía AI | `has_prompt`, `has_image`, `has_pdf` |
| `i18n_language_changed` | Cambio de idioma | `lang` (es/en) |
| `i18n_demo_interacted` | Interacción en el Sandbox | `action`, `view` |
| `identify` | Identificación de usuario | `userId`, `email` |

---

## Verificación
Para validar la integración, abre la consola del navegador y busca los logs de `[Analytics]`. Si estás en modo `console`, verás los eventos impresos sin enviarse a red.
