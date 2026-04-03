# Sence API Integration - LMS to SIC

**Source**: User-provided text (from `instructivo_integracion_entre_lms_y_sic.pdf`)

## Authentication
*   **Method**: Re-use "Inicio Sesión SENCE" token or "RCE" authentication key.
*   **Format**: UUID (e.g., `5EEBF607-25A9-4DB2-A4DD-5D31BDAE3220`)

## JSON Structure (Request)
**Root Object**:
*   `rutOtec` (string): OTEC Root (e.g., "11222333-4")
*   `idSistema` (int): Always `1350`.
*   `token` (string): Auth token.
*   `codigoOferta` (string): Course offer code.
*   `codigoGrupo` (string): Group code.
*   `codigoEnvio` (string): Custom ID for the shipment (e.g., "ID-PERSONALIZADO-002").
*   `listaAlumnos` (array): List of student progress objects.

**Student Object**:
*   `rutAlumno` (int): Run without DV.
*   `dvAlumno` (string): DV.
*   `tiempoConectividad` (int): Minutes? (Example: 45).
*   `estado` (int): Status code (1?).
*   `porcentajeAvance` (int/float): Progress %.
*   `fechaInicio` (string): Start date.
*   `fechaFin` (string): End date.
*   `listaModulos` (array): Modules.

**Module Object**:
*   `codigoModulo` (string)
*   `tiempoConectividad` (int)
*   `porcentajeAvance` (int/float)
*   `estado` (int)
*   `fechaInicio` (string)
*   `fechaFin` (string)
*   `listaActividades` (array): `{ codigoActividad: string }`

## Endpoints

### 1. Connection Test / History
*   **Method**: `GET`
*   **URL**: `https://auladigital.sence.cl/gestor/API/avance-sic/historialEnvios`
*   **Params**: `rutOtec`, `idSistema`, `token`
*   **Success**: 200 OK

### 2. Submit Progress
*   **Method**: `POST`
*   **URL**: `https://auladigital.sence.cl/gestor/API/avance-sic/enviarAvance`
*   **Headers**: `Content-Type: application/json`
*   **Body**: JSON Structure above.

## Business Logic / Validation
1.  **Progress Consistency**: Sent % cannot be lower than previously sent % for the same day (or subsequent days?).
2.  **Identity Check**: Validation of RUT OTEC and Course Code against the middleware registry.
3.  **Registration Check**: Student/Module/Course must match records in the middleware.

## Responses
*   **Success**: Returns `id_proceso`, `envio` details, `errores: []`, `respuesta_SIC`.
*   **Error**: Returns `datosError` array with specific codes (e.g., "012" - Student not found).

## Session Management (LMS Integration)

### 1. Start Session (SENCE -> LMS)
**Context**: User clicks "Start Course" in Sence. Sence redirects to LMS.
**Parameters**:
*   `IdSesionAlumno` (149 chars): Session ID in OTEC platform.
*   `IdSesionSence` (149 chars): Sence Session ID (must be kept for end session).
*   `UrlRetoma` (100 chars): Redirect URL for successful login.
*   `UrlError` (100 chars): Redirect URL for failed login.

### 2. End Session (SENCE -> LMS)
**Context**: Session ends. Sence redirects to LMS.
**Parameters (Success)**:
*   `CodSence` (10 chars): Course Code.
*   `CodigoCurso` (50 chars): Course ID (min 7 chars).
*   `IdSesionAlumno` (149 chars).
*   `RunAlumno` (10 chars): RUT with DV (e.g., `xxxxxxxx-x`).
*   `FechaHora` (19 chars): `yyyy-mm-dd hh:mm:ss`.
*   `ZonaHoraria` (100 chars).
*   `LineaCapacitacion` (Int): `3` = Impulsa Personas.

**Parameters (Error)**:
*   Includes above plus `GlosaError` (Int).

### 3. Redirects (LMS -> SENCE)
**Environment URLs**:
*   **Test Start**: `https://sistemas.sence.cl/rcetest/Registro/IniciarSesion`
*   **Test End**: `https://sistemas.sence.cl/rcetest/Registro/CerrarSesion`
*   **Prod Start**: `https://sistemas.sence.cl/rce/Registro/IniciarSesion`
*   **Prod End**: `https://sistemas.sence.cl/rce/Registro/CerrarSesion`

**Form POST Fields for Login**:
`RutOtec`, `Token`, `CodSence`, `CodigoCurso`, `LineaCapacitacion`, `RunAlumno`, `IdSesionAlumno`, `UrlRetoma`, `UrlError`.

## Error Codes (Table Errores)
*   `100`: Incorrect password / No SENCE Key.
*   `200`: Missing mandatory params / Bad format.
*   `201`: Missing UrlRetoma/UrlError.
*   `211`: Token doesn't belong to OTEC.
*   `212`: Expired Token.
*   `300`: Internal Error.

## Legacy Web Service (SOAP/WCF)

**Source**: `MANUAL TÉCNICO INTEGRACIÓN VÍA WEB SERVICE`

### Service URLs
*   **Test WCF**: `http://elearningtest.sence.cl/Webservice/SenceElearning.svc`
*   **Test WS**: `http://elearningtest.sence.cl/Webservice/SenceElearning.asmx`
*   **Prod WCF**: `http://elearning.sence.cl/Webservice/SenceElearning.svc`

### Function: `RegistrarActividad`
**Description**: Registers session start/end.
**Parameters**:
*   `codigoSence` (String 10): Course code.
*   `rutAlumno` (String 8): Without DV.
*   `claveAlumno` (String 8): SENCE password.
*   `rutOtec` (String 8): Without DV.
*   `claveOtec` (String 16): OTEC SENCE password.
*   `estadoActividad` (String 1): `1` = Start Session. (Implicitly maybe `2`=End? Doc doesn't explicitly specify other values in snippet, but implies start/end).

**Return Values (Int)**:
*   `10`: OK
*   `21`: Invalid Activity Status Format
*   `22`: Missing Mandatory Param
*   `31`: Invalid Sence Code Format
*   `32`: Invalid Natural Rut Format
*   `33`: Invalid Juridical Rut Format
*   `40`: Deceased Person


