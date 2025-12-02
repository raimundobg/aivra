"""
Script de Migración - Agregar Columnas Faltantes
Solo agrega las 3 columnas que faltan
"""

import sqlite3
import os

# Ruta a la base de datos
DB_PATH = 'instance/local.db'

# SQL para agregar SOLO las columnas faltantes
MISSING_COLUMNS_SQL = """
ALTER TABLE patient_files ADD COLUMN profesion VARCHAR(100);
ALTER TABLE patient_files ADD COLUMN observaciones_sueno TEXT;
ALTER TABLE patient_files ADD COLUMN registro_24h TEXT;
"""

def add_missing_columns():
    """Agrega las columnas faltantes"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Error: No se encontró la base de datos en {DB_PATH}")
        return False
    
    print(f"📊 Conectando a la base de datos: {DB_PATH}")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print(f"\n🔧 Agregando 3 columnas faltantes...\n")
        
        # Profesion
        try:
            cursor.execute("ALTER TABLE patient_files ADD COLUMN profesion VARCHAR(100)")
            print(f"  ✅ Columna agregada: profesion")
        except sqlite3.OperationalError as e:
            if 'duplicate column' in str(e).lower():
                print(f"  ⚠️  Columna ya existe: profesion")
            else:
                print(f"  ❌ Error agregando profesion: {e}")
        
        # Observaciones_sueno
        try:
            cursor.execute("ALTER TABLE patient_files ADD COLUMN observaciones_sueno TEXT")
            print(f"  ✅ Columna agregada: observaciones_sueno")
        except sqlite3.OperationalError as e:
            if 'duplicate column' in str(e).lower():
                print(f"  ⚠️  Columna ya existe: observaciones_sueno")
            else:
                print(f"  ❌ Error agregando observaciones_sueno: {e}")
        
        # Registro_24h
        try:
            cursor.execute("ALTER TABLE patient_files ADD COLUMN registro_24h TEXT")
            print(f"  ✅ Columna agregada: registro_24h")
        except sqlite3.OperationalError as e:
            if 'duplicate column' in str(e).lower():
                print(f"  ⚠️  Columna ya existe: registro_24h")
            else:
                print(f"  ❌ Error agregando registro_24h: {e}")
        
        # Confirmar cambios
        conn.commit()
        
        # Verificar TODAS las columnas necesarias
        print(f"\n🔍 Verificando TODAS las columnas requeridas...")
        cursor.execute("PRAGMA table_info(patient_files)")
        columns = cursor.fetchall()
        
        required_columns = [
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
        missing_list = []
        
        for col_name in required_columns:
            if col_name in existing_columns:
                print(f"   ✅ {col_name}")
                found_count += 1
            else:
                print(f"   ❌ {col_name} - FALTA")
                missing_count += 1
                missing_list.append(col_name)
        
        print(f"\n📊 Resumen Final:")
        print(f"   • {found_count}/{len(required_columns)} columnas presentes")
        print(f"   • {missing_count}/{len(required_columns)} columnas faltantes")
        
        cursor.close()
        conn.close()
        
        if missing_count == 0:
            print(f"\n🎉 ¡TODAS LAS COLUMNAS ESTÁN PRESENTES!")
            print(f"\n💡 Ahora puedes reiniciar tu servidor Flask:")
            print(f"   python app.py")
            return True
        else:
            print(f"\n⚠️  Todavía faltan {missing_count} columnas:")
            for col in missing_list:
                print(f"      • {col}")
            print(f"\n🔍 Esto puede indicar un problema con SQLite.")
            print(f"   Intenta agregar manualmente estas columnas.")
            return False
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("  AGREGAR COLUMNAS FALTANTES")
    print("=" * 60)
    print()
    
    success = add_missing_columns()
    
    if success:
        print("\n✅ ¡Listo! Base de datos actualizada.")
        exit(0)
    else:
        print("\n⚠️  Revisa los errores arriba.")
        exit(1)