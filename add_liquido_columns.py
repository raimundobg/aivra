"""
Script de migración para agregar columnas de líquido a PatientFile
Ejecutar: python add_liquido_columns.py
"""
import sqlite3
import os

def migrate_database():
    # Buscar la base de datos
    db_paths = [
        'instance/local.db',
        'local.db',
        '../instance/local.db'
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ No se encontró la base de datos")
        print("   Rutas buscadas:", db_paths)
        return False
    
    print(f"📁 Base de datos encontrada: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si las columnas ya existen
        cursor.execute("PRAGMA table_info(patient_files)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"\n📋 Columnas actuales en patient_files: {len(columns)}")
        
        # Columnas a agregar
        new_columns = [
            ('liquido_porcentaje', 'FLOAT'),
            ('liquido_ml', 'FLOAT')
        ]
        
        for col_name, col_type in new_columns:
            if col_name in columns:
                print(f"   ✓ '{col_name}' ya existe")
            else:
                try:
                    cursor.execute(f"ALTER TABLE patient_files ADD COLUMN {col_name} {col_type}")
                    print(f"   ➕ '{col_name}' agregada exitosamente")
                except sqlite3.OperationalError as e:
                    print(f"   ⚠️ Error agregando '{col_name}': {e}")
        
        conn.commit()
        conn.close()
        
        print("\n✅ Migración completada exitosamente!")
        print("   Reinicia la aplicación Flask para aplicar los cambios.")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        return False

if __name__ == '__main__':
    print("="*50)
    print("MIGRACIÓN: Agregar columnas de líquido")
    print("="*50)
    migrate_database()