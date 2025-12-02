"""
Script de Migración - Patient Intake V2
Agrega las columnas nuevas a la base de datos SQLite
VERSIÓN CORREGIDA - Usa patient_files (plural)
"""

import sqlite3
import os

# Ruta a la base de datos
DB_PATH = 'instance/local.db'

# SQL para agregar las columnas (compatible con SQLite)
# NOTA: Tabla se llama "patient_files" (PLURAL)
MIGRATION_SQL = """
-- ============================================
-- CONDUCTA Y ENTORNO
-- ============================================
ALTER TABLE patient_files ADD COLUMN profesion VARCHAR(100);
ALTER TABLE patient_files ADD COLUMN teletrabajo VARCHAR(20);
ALTER TABLE patient_files ADD COLUMN quien_cocina TEXT;
ALTER TABLE patient_files ADD COLUMN con_quien_vive TEXT;
ALTER TABLE patient_files ADD COLUMN donde_come TEXT;

-- ============================================
-- SALUD GENERAL (CAMPOS ADICIONALES)
-- ============================================
ALTER TABLE patient_files ADD COLUMN observaciones_sueno TEXT;
ALTER TABLE patient_files ADD COLUMN gatillantes_estres TEXT;
ALTER TABLE patient_files ADD COLUMN manejo_estres TEXT;
ALTER TABLE patient_files ADD COLUMN consumo_alcohol VARCHAR(50);
ALTER TABLE patient_files ADD COLUMN tipo_alcohol TEXT;
ALTER TABLE patient_files ADD COLUMN tabaco VARCHAR(10);
ALTER TABLE patient_files ADD COLUMN drogas VARCHAR(10);
ALTER TABLE patient_files ADD COLUMN duracion_ejercicio INTEGER;

-- ============================================
-- SÍNTOMAS GASTROINTESTINALES
-- ============================================
ALTER TABLE patient_files ADD COLUMN frecuencia_evacuacion VARCHAR(50);
ALTER TABLE patient_files ADD COLUMN reflujo VARCHAR(10);
ALTER TABLE patient_files ADD COLUMN reflujo_alimento TEXT;
ALTER TABLE patient_files ADD COLUMN hinchazon VARCHAR(10);
ALTER TABLE patient_files ADD COLUMN hinchazon_alimento TEXT;
ALTER TABLE patient_files ADD COLUMN tiene_alergias VARCHAR(10);
ALTER TABLE patient_files ADD COLUMN alergias_alimento TEXT;

-- ============================================
-- REGISTRO 24H Y FRECUENCIA (JSON)
-- ============================================
ALTER TABLE patient_files ADD COLUMN registro_24h TEXT;
ALTER TABLE patient_files ADD COLUMN frecuencia_consumo TEXT;
"""

def run_migration():
    """Ejecuta la migración de base de datos"""
    
    # Verificar que existe la base de datos
    if not os.path.exists(DB_PATH):
        print(f"❌ Error: No se encontró la base de datos en {DB_PATH}")
        return False
    
    print(f"📊 Conectando a la base de datos: {DB_PATH}")
    
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Primero verificar que existe la tabla patient_files
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='patient_files'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print(f"❌ Error: La tabla 'patient_files' no existe en la base de datos")
            print(f"\n🔍 Tablas disponibles:")
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            for table in tables:
                print(f"   • {table[0]}")
            return False
        
        print(f"✅ Tabla 'patient_files' encontrada")
        
        # Separar las sentencias SQL
        statements = [stmt.strip() for stmt in MIGRATION_SQL.split(';') if stmt.strip() and not stmt.strip().startswith('--')]
        
        print(f"\n🔧 Ejecutando {len(statements)} sentencias ALTER TABLE...\n")
        
        success_count = 0
        skip_count = 0
        
        for i, statement in enumerate(statements, 1):
            try:
                cursor.execute(statement)
                # Extraer el nombre de la columna del statement
                column_name = statement.split('ADD COLUMN')[1].split()[0] if 'ADD COLUMN' in statement else 'unknown'
                print(f"  ✅ [{i}/{len(statements)}] Columna agregada: {column_name}")
                success_count += 1
            except sqlite3.OperationalError as e:
                if 'duplicate column name' in str(e).lower():
                    column_name = statement.split('ADD COLUMN')[1].split()[0] if 'ADD COLUMN' in statement else 'unknown'
                    print(f"  ⚠️  [{i}/{len(statements)}] Columna ya existe: {column_name}")
                    skip_count += 1
                else:
                    print(f"  ❌ [{i}/{len(statements)}] Error: {e}")
                    raise
        
        # Confirmar cambios
        conn.commit()
        print(f"\n✅ Migración completada exitosamente!")
        print(f"   • {success_count} columnas agregadas")
        print(f"   • {skip_count} columnas ya existían")
        
        # Verificar las columnas
        print(f"\n🔍 Verificando columnas nuevas...")
        cursor.execute("PRAGMA table_info(patient_files)")
        columns = cursor.fetchall()
        
        new_columns = [
            'profesion', 'teletrabajo', 'quien_cocina', 'con_quien_vive', 'donde_come',
            'observaciones_sueno', 'gatillantes_estres', 'manejo_estres', 
            'consumo_alcohol', 'tipo_alcohol', 'tabaco', 'drogas', 'duracion_ejercicio',
            'frecuencia_evacuacion', 'reflujo', 'reflujo_alimento', 
            'hinchazon', 'hinchazon_alimento', 'tiene_alergias', 'alergias_alimento',
            'registro_24h', 'frecuencia_consumo'
        ]
        
        existing_columns = [col[1] for col in columns]
        
        found_count = 0
        missing_count = 0
        
        for col_name in new_columns:
            if col_name in existing_columns:
                print(f"   ✅ {col_name}")
                found_count += 1
            else:
                print(f"   ❌ {col_name} - NO EXISTE")
                missing_count += 1
        
        print(f"\n📊 Resumen:")
        print(f"   • {found_count}/{len(new_columns)} columnas encontradas")
        print(f"   • {missing_count}/{len(new_columns)} columnas faltantes")
        
        cursor.close()
        conn.close()
        
        if missing_count == 0:
            print(f"\n🎉 ¡Base de datos actualizada correctamente!")
            print(f"\n💡 Ahora puedes reiniciar tu servidor Flask:")
            print(f"   python app.py")
            return True
        else:
            print(f"\n⚠️  Algunas columnas no se agregaron. Revisa los errores.")
            return False
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        import traceback
        print(f"\n📋 Traceback completo:")
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("  MIGRACIÓN DE BASE DE DATOS - PATIENT INTAKE V2")
    print("  (Versión corregida - patient_files plural)")
    print("=" * 60)
    print()
    
    success = run_migration()
    
    if not success:
        print("\n⚠️  La migración falló. Por favor revisa los errores.")
        exit(1)
    else:
        print("\n✅ Migración completada exitosamente!")
        exit(0)