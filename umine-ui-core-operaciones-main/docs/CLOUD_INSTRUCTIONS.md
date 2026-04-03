# Cloud Setup Instructions - Umine Core Operaciones

This document contains the necessary requirements and configurations for the Cloud Engineer to enable **Google Analytics** and **Google Authentication**.

## 1. Google Analytics (GA4)

Please set up a Google Analytics 4 property and provide the **Measurement ID**.

### Steps for Cloud Engineer:
1. Go to [Google Analytics Console](https://analytics.google.com/).
2. Create a new Property: **Umine-Core-Operaciones**.
3. Create a **Web Data Stream**:
   - **Website URL**: (Provide production URL when available, e.g., `operaciones.umine.cl`)
   - **Stream Name**: Production Web.
4. Enable **Enhanced Measurement**.
5. **Requested Deliverable**: Provide the `G-XXXXXXXXXX` Measurement ID.

---

## 2. Google Authentication (OAuth 2.0)

Please set up the Google Cloud Project and OAuth credentials.

### Steps for Cloud Engineer:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create/Select Project: **Umine-Platform**.
3. **OAuth Consent Screen**:
   - **User Type**: External.
   - **App Name**: Umine Core.
   - **Scopes**: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`.
4. **Credentials**:
   - Create **OAuth client ID**.
   - **Application Type**: Web application.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (Development)
     - `https://umine-core.ti` (Production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/login/callback`
     - `https://umine-core.ti/login/callback`
5. **Requested Deliverable**:
   - `Client ID`
   - `Client Secret` (to be stored in secure Secret Manager)

---

## 3. Environment Variables (Required for Frontend)

Once the steps above are completed, please provide the following keys to be added to the `.env` file:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_CLIENT_ID=XXXXX-XXXXX.apps.googleusercontent.com
```
