/**
 * TABLERO SENCE 2025 - Modelo de Datos para DynamoDB
 *
 * Source: Excel "BBDD 2025" - 69 columnas mapeadas
 *
 * Tabla: tablero-sence-operaciones
 *
 * Keys:
 *   PK: COURSE#<codSence>
 *   SK: PARTICIPANT#<rut>
 *
 * GSI1 (gsi1-client):
 *   gsi1pk: CLIENT#<idCliente>
 *   gsi1sk: COURSE#<codSence>#PARTICIPANT#<rut>
 *
 * GSI2 (gsi2-rut):
 *   gsi2pk: RUT#<rut>
 *   gsi2sk: COURSE#<codSence>
 */

// ============================================
// Column Mapping: Excel → DynamoDB
// ============================================

export const COLUMN_MAPPING: Record<string, string> = {
    // Index 0-9
    'Coordinador/a': 'coordinador',
    'Comercial a cargo': 'comercialACargo',
    'ID CLIENTE': 'idCliente',
    'CLIENTE': 'cliente',
    'Total Cliente': 'totalCliente',
    'OTIC': 'otic',
    'OC': 'oc',
    'ID SENCE': 'idSence',
    'COD SENCE': 'codSence',
    'Nombre Curso': 'nombreCurso',

    // Index 10-19
    'F Inicio': 'fechaInicio',
    'MES DE INICIO': 'mesInicio',
    'AÑO INICIO': 'anioInicio',
    'DIAS INICIO': 'diasInicio',
    'F Término': 'fechaTermino',
    'MES TERMINO': 'mesTermino',
    'AÑO TERMINO': 'anioTermino',
    'FRANQUICIA (%)': 'franquiciaPct',
    'MONTO SENCE': 'montoSence',
    'COSTO EMPRESA': 'costoEmpresa',

    // Index 20-29
    'RUT': 'rut',
    'INSCRITOS': 'inscritos',
    'NOMBRES': 'nombres',
    'APELLIDOS': 'apellidos',
    'CORREO PERSONAL': 'correoPersonal',
    'CONEX SENCE': 'conexSence',
    ' ': '_empty1',  // Index 26 - empty column
    '%CONEXION': 'pctConexion',
    'DJ': 'dj',
    'BAJAS  CONEXION': 'bajasConexion',

    // Index 30-39
    'BAJAS DJ': 'bajasDj',
    '% DJP': 'pctDjp',
    'monto real': 'montoReal',
    'Comentario': 'comentario',
    'F HOY': 'fechaHoy',
    'DIAS CONEXION': 'diasConexion',
    'DÍAS DJP': 'diasDjp',
    'Promedio Días DJ x Cliente': 'promedioDiasDjCliente',
    'Monto Conexión Sence': 'montoConexionSence',
    'MONTO a Facturar $': 'montoAFacturar',

    // Index 40-49
    'Estado OC ': 'estadoOc',
    'NUMERO FACTURA': 'numeroFactura',
    'FECHA FACTURACION': 'fechaFacturacion',
    'MES  FACTURACIÓN': 'mesFacturacion',
    'DIAS DURACIÓN CURSO': 'diasDuracionCurso',
    'FECHA ESTIMADA FACTURACIÓN': 'fechaEstimadaFacturacion',
    'Dias Totals de DJ': 'diasTotalesDj',
    'MES': 'mes',
    'MES (NUMERO)': 'mesNumero',
    'ID curso': 'idCurso',

    // Index 50-59
    'Link Carpeta BAJA': 'linkCarpetaBaja',
    'Semana Estimada Facturación': 'semanaEstimadaFacturacion',
    'SUPERVISADO': 'supervisado',
    'Aportante RSE': 'aportanteRse',
    'dj': 'djFlag',  // Index 54 - different from DJ at index 28
    'Género': 'genero',
    'GRUPO': 'grupo',
    'ID COmercial': 'idComercial',
    'CONEXBOT': 'conexBot',
    'DJBOT': 'djBot',

    // Index 60-68
    'ConexBOTStatus': 'conexBotStatus',
    'DJBOTStatus': 'djBotStatus',
    'BOT_PROCESSED': 'botProcessed',
    'BOT_NUM_SESIONES': 'botNumSesiones',
    'Actualizar_CONEX': 'actualizarConex',
    'Actualizar_DJ': 'actualizarDj',
    ' .1': '_empty2',  // Index 66 - empty column
    ' .2': '_empty3',  // Index 67 - empty column
    ' .3': '_empty4',  // Index 68 - empty column
};

// Columns to ignore during import (empty columns)
export const IGNORED_COLUMNS = ['_empty1', '_empty2', '_empty3', '_empty4'];

// ============================================
// Main Entity: TableroSenceRecord
// ============================================

export interface TableroSenceRecord {
    // ========== DynamoDB Keys ==========
    pk: string;                          // COURSE#<codSence>
    sk: string;                          // PARTICIPANT#<rut>
    gsi1pk: string;                      // CLIENT#<idCliente>
    gsi1sk: string;                      // COURSE#<codSence>#PARTICIPANT#<rut>
    gsi2pk: string;                      // RUT#<rut>
    gsi2sk: string;                      // COURSE#<codSence>

    // ========== Index 0-9: Coordination & Client ==========
    coordinador: string | null;          // 0: Coordinador/a
    comercialACargo: string | null;      // 1: Comercial a cargo
    idCliente: string | null;            // 2: ID CLIENTE
    cliente: string | null;              // 3: CLIENTE
    totalCliente: number | null;         // 4: Total Cliente
    otic: string | null;                 // 5: OTIC
    oc: string | null;                   // 6: OC
    idSence: string | null;              // 7: ID SENCE
    codSence: string;                    // 8: COD SENCE (required - part of PK)
    nombreCurso: string | null;          // 9: Nombre Curso

    // ========== Index 10-19: Course Dates & Financials ==========
    fechaInicio: string | null;          // 10: F Inicio (ISO date)
    mesInicio: string | null;            // 11: MES DE INICIO
    anioInicio: number | null;           // 12: AÑO INICIO
    diasInicio: number | null;           // 13: DIAS INICIO
    fechaTermino: string | null;         // 14: F Término (ISO date)
    mesTermino: string | null;           // 15: MES TERMINO
    anioTermino: number | null;          // 16: AÑO TERMINO
    franquiciaPct: number | null;        // 17: FRANQUICIA (%)
    montoSence: number | null;           // 18: MONTO SENCE
    costoEmpresa: number | null;         // 19: COSTO EMPRESA

    // ========== Index 20-29: Participant Info ==========
    rut: string;                         // 20: RUT (required - part of SK)
    inscritos: number | null;            // 21: INSCRITOS
    nombres: string | null;              // 22: NOMBRES
    apellidos: string | null;            // 23: APELLIDOS
    correoPersonal: string | null;       // 24: CORREO PERSONAL
    conexSence: number | null;           // 25: CONEX SENCE (0 or 1)
    // Index 26: empty column - skipped
    pctConexion: number | null;          // 27: %CONEXION
    dj: number | null;                   // 28: DJ (0 or 1)
    bajasConexion: number | null;        // 29: BAJAS CONEXION

    // ========== Index 30-39: Status & Calculations ==========
    bajasDj: number | null;              // 30: BAJAS DJ
    pctDjp: number | null;               // 31: % DJP
    montoReal: number | null;            // 32: monto real
    comentario: string | null;           // 33: Comentario
    fechaHoy: string | null;             // 34: F HOY (ISO date)
    diasConexion: number | null;         // 35: DIAS CONEXION
    diasDjp: number | null;              // 36: DÍAS DJP
    promedioDiasDjCliente: number | null;// 37: Promedio Días DJ x Cliente
    montoConexionSence: number | null;   // 38: Monto Conexión Sence
    montoAFacturar: number | null;       // 39: MONTO a Facturar $

    // ========== Index 40-49: Billing ==========
    estadoOc: string | null;             // 40: Estado OC
    numeroFactura: string | null;        // 41: NUMERO FACTURA
    fechaFacturacion: string | null;     // 42: FECHA FACTURACION (ISO date)
    mesFacturacion: string | null;       // 43: MES FACTURACIÓN
    diasDuracionCurso: number | null;    // 44: DIAS DURACIÓN CURSO
    fechaEstimadaFacturacion: string | null; // 45: FECHA ESTIMADA FACTURACIÓN
    diasTotalesDj: number | null;        // 46: Dias Totals de DJ
    mes: string | null;                  // 47: MES
    mesNumero: number | null;            // 48: MES (NUMERO)
    idCurso: string | null;              // 49: ID curso

    // ========== Index 50-59: Additional Info ==========
    linkCarpetaBaja: string | null;      // 50: Link Carpeta BAJA
    semanaEstimadaFacturacion: string | null; // 51: Semana Estimada Facturación
    supervisado: string | null;          // 52: SUPERVISADO
    aportanteRse: string | null;         // 53: Aportante RSE
    djFlag: string | null;               // 54: dj (lowercase, different from DJ)
    genero: string | null;               // 55: Género
    grupo: string | null;                // 56: GRUPO
    idComercial: string | null;          // 57: ID COmercial
    conexBot: number | null;             // 58: CONEXBOT (0 or 1)
    djBot: number | null;                // 59: DJBOT (0 or 1)

    // ========== Index 60-65: Bot Processing ==========
    conexBotStatus: number | null;       // 60: ConexBOTStatus
    djBotStatus: number | null;          // 61: DJBOTStatus
    botProcessed: string | null;         // 62: BOT_PROCESSED (ISO timestamp)
    botNumSesiones: number | null;       // 63: BOT_NUM_SESIONES
    actualizarConex: number | null;      // 64: Actualizar_CONEX
    actualizarDj: number | null;         // 65: Actualizar_DJ
    // Index 66-68: empty columns - skipped

    // ========== Audit Fields ==========
    createdAt: string;                   // ISO timestamp
    updatedAt: string;                   // ISO timestamp
}

// ============================================
// Key Builders
// ============================================

export const TableroKeys = {
    pk: (codSence: string): string => `COURSE#${codSence}`,
    sk: (rut: string): string => `PARTICIPANT#${rut}`,
    gsi1pk: (idCliente: string): string => `CLIENT#${idCliente}`,
    gsi1sk: (codSence: string, rut: string): string => `COURSE#${codSence}#PARTICIPANT#${rut}`,
    gsi2pk: (rut: string): string => `RUT#${rut}`,
    gsi2sk: (codSence: string): string => `COURSE#${codSence}`,

    // Extract values from keys
    extractCodSence: (pk: string): string => pk.replace('COURSE#', ''),
    extractRut: (sk: string): string => sk.replace('PARTICIPANT#', ''),
    extractIdCliente: (gsi1pk: string): string => gsi1pk.replace('CLIENT#', ''),
};

// ============================================
// DTOs
// ============================================

export interface CreateTableroRecordInput {
    codSence: string;
    rut: string;
    idCliente: string;
    [key: string]: any;
}

export interface UpdateTableroRecordInput {
    codSence: string;
    rut: string;
    updates: Partial<Omit<TableroSenceRecord, 'pk' | 'sk' | 'gsi1pk' | 'gsi1sk' | 'gsi2pk' | 'gsi2sk' | 'createdAt' | 'codSence' | 'rut'>>;
}

export interface BatchUpdateInput {
    items: Array<{
        codSence: string;
        rut: string;
        updates: Record<string, any>;
    }>;
}

// ============================================
// Query Results
// ============================================

export interface TableroQueryResult {
    items: TableroSenceRecord[];
    count: number;
    scannedCount: number;
    lastEvaluatedKey?: Record<string, any>;
}

export interface TableroStats {
    totalRegistros: number;
    totalClientes: number;
    totalCursos: number;
    totalParticipantes: number;
    totalConectados: number;
    totalDjEmitidas: number;
    montoTotalSence: number;
    montoTotalFacturar: number;
}

// ============================================
// Filter Options
// ============================================

export interface TableroFilters {
    coordinador?: string;
    comercialACargo?: string;
    idCliente?: string;
    estadoOc?: string;
    mesInicio?: string;
    anioInicio?: number;
    conexSence?: number;
    dj?: number;
}

// ============================================
// Excel Row Type (raw import)
// ============================================

export interface ExcelRowRaw {
    'Coordinador/a'?: any;
    'Comercial a cargo'?: any;
    'ID CLIENTE'?: any;
    'CLIENTE'?: any;
    'Total Cliente'?: any;
    'OTIC'?: any;
    'OC'?: any;
    'ID SENCE'?: any;
    'COD SENCE'?: any;
    'Nombre Curso'?: any;
    'F Inicio'?: any;
    'MES DE INICIO'?: any;
    'AÑO INICIO'?: any;
    'DIAS INICIO'?: any;
    'F Término'?: any;
    'MES TERMINO'?: any;
    'AÑO TERMINO'?: any;
    'FRANQUICIA (%)'?: any;
    'MONTO SENCE'?: any;
    'COSTO EMPRESA'?: any;
    'RUT'?: any;
    'INSCRITOS'?: any;
    'NOMBRES'?: any;
    'APELLIDOS'?: any;
    'CORREO PERSONAL'?: any;
    'CONEX SENCE'?: any;
    ' '?: any;
    '%CONEXION'?: any;
    'DJ'?: any;
    'BAJAS  CONEXION'?: any;
    'BAJAS DJ'?: any;
    '% DJP'?: any;
    'monto real'?: any;
    'Comentario'?: any;
    'F HOY'?: any;
    'DIAS CONEXION'?: any;
    'DÍAS DJP'?: any;
    'Promedio Días DJ x Cliente'?: any;
    'Monto Conexión Sence'?: any;
    'MONTO a Facturar $'?: any;
    'Estado OC '?: any;
    'NUMERO FACTURA'?: any;
    'FECHA FACTURACION'?: any;
    'MES  FACTURACIÓN'?: any;
    'DIAS DURACIÓN CURSO'?: any;
    'FECHA ESTIMADA FACTURACIÓN'?: any;
    'Dias Totals de DJ'?: any;
    'MES'?: any;
    'MES (NUMERO)'?: any;
    'ID curso'?: any;
    'Link Carpeta BAJA'?: any;
    'Semana Estimada Facturación'?: any;
    'SUPERVISADO'?: any;
    'Aportante RSE'?: any;
    'dj'?: any;
    'Género'?: any;
    'GRUPO'?: any;
    'ID COmercial'?: any;
    'CONEXBOT'?: any;
    'DJBOT'?: any;
    'ConexBOTStatus'?: any;
    'DJBOTStatus'?: any;
    'BOT_PROCESSED'?: any;
    'BOT_NUM_SESIONES'?: any;
    'Actualizar_CONEX'?: any;
    'Actualizar_DJ'?: any;
    ' .1'?: any;
    ' .2'?: any;
    ' .3'?: any;
}
