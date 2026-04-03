export interface SenceStartSessionBody {
    RutOtec: string;
    Token: string;
    CodSence: string;
    CodigoCurso: string;
    LineaCapacitacion: string;
    RunAlumno: string;
    IdSesionAlumno: string;
    UrlRetoma: string;
    UrlError: string;
}

export interface SenceEndSessionBody extends SenceStartSessionBody {
    IdSesionSence?: string;
    FechaHora?: string;
    ZonaHoraria?: string;
    GlosaError?: string;
}

export interface SenceProgressPayload {
    rutOtec: string;
    idSistema: number; // 1350
    token: string;
    codigoOferta: string;
    codigoGrupo: string;
    codigoEnvio: string;
    listaAlumnos: StudentProgress[];
}

export interface StudentProgress {
    rutAlumno: number;
    dvAlumno: string;
    tiempoConectividad: number;
    estado: number;
    porcentajeAvance: number;
    fechaInicio: string;
    fechaFin: string;
    listaModulos: ModuleProgress[];
}

export interface ModuleProgress {
    codigoModulo: string;
    tiempoConectividad: number;
    porcentajeAvance: number;
    estado: number;
    fechaInicio: string;
    fechaFin: string;
    listaActividades: { codigoActividad: string }[];
}

export interface SessionRecord {
    pk: string; // SESSION#<IdSesionAlumno>
    sk: string; // METADATA
    rutOtec: string;
    codSence: string;
    runAlumno: string;
    startTime: string;
    endTime?: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ERROR';
    senceToken?: string;
}

// ============================================
// LCE Portal Scraping Types
// ============================================

export interface LCECredentials {
    rutOtec: string;           // RUT OTEC format: 76562778-8
    rutRepLegal: string;       // RUT Representante Legal
    password: string;          // Clave SENCE (CUS)
}

export interface LCECourseInfo {
    codigoCurso: string;       // e.g., "6749253"
    codigoSence: string;       // e.g., "1238087803"
    nombreCurso: string;
    programa: string;          // e.g., "Franquicia Tributaria E-Learning"
    horasAcreditadas: number;
    fechaInicio: string;
    fechaTermino: string;
    estado: string;            // e.g., "Emitida"
    modalidad?: string;        // e.g., "Asincrónica"
    empresa?: string;
    otec?: string;
    otic?: string;
}

export interface LCEParticipant {
    rut: string;               // e.g., "13.250.789-9"
    rutNormalized: string;     // e.g., "13250789-9" (sin puntos)
    nombre: string;
    numSesiones: number;       // N° sesiones from portal
    estadoDeclaracionJurada: string; // "Emitida", "Pendiente", etc.
    // Derived fields
    conexSence: 0 | 1;         // 1 if numSesiones >= 1, else 0
    dj: 0 | 1;                 // 1 if estado = "Emitida", else 0
}

export interface LCECourseParticipants {
    courseInfo: LCECourseInfo;
    participants: LCEParticipant[];
    scrapedAt: string;         // ISO timestamp
    totalParticipants: number;
    totalConectados: number;   // Count where conexSence = 1
    totalDJEmitidas: number;   // Count where dj = 1
}

export interface LCEScrapeResult {
    success: boolean;
    data?: LCECourseParticipants;
    error?: string;
    errorCode?: string;
}

// For updating the TABLERO SENCE spreadsheet
export interface TableroSenceUpdate {
    rut: string;
    conexSence: 0 | 1;
    dj: 0 | 1;
    numSesiones: number;
    lastChecked: string;
}
