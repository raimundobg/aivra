"""
Migration Script: Add Public Intake System columns to PatientFile
Run this script to add the new columns for the public intake feature.

Usage: python migrate_add_intake_columns.py
"""

import sqlite3
import os

def migrate_database():
    """Add intake_token and related columns to patient_files table"""

    # Find the database
    db_path = 'instance/local.db'

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        print("Looking for alternative locations...")

        if os.path.exists('local.db'):
            db_path = 'local.db'
        else:
            print("No database found. The columns will be created when the app starts.")
            return

    print(f"Migrating database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check existing columns
    cursor.execute("PRAGMA table_info(patient_files)")
    existing_columns = [row[1] for row in cursor.fetchall()]

    print(f"Existing columns: {len(existing_columns)}")

    # Columns to add
    new_columns = [
        ("intake_token", "VARCHAR(64) UNIQUE"),
        ("intake_completed", "BOOLEAN DEFAULT 0"),
        ("intake_completed_at", "DATETIME"),
        ("intake_url_sent", "BOOLEAN DEFAULT 0"),
        ("intake_url_sent_at", "DATETIME"),
    ]

    added = 0
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            try:
                sql = f"ALTER TABLE patient_files ADD COLUMN {col_name} {col_type}"
                cursor.execute(sql)
                print(f"  Added column: {col_name}")
                added += 1
            except sqlite3.OperationalError as e:
                print(f"  Error adding {col_name}: {e}")
        else:
            print(f"  Column already exists: {col_name}")

    # Create index on intake_token if not exists
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_patient_files_intake_token ON patient_files (intake_token)")
        print("  Index on intake_token created/verified")
    except Exception as e:
        print(f"  Error creating index: {e}")

    conn.commit()
    conn.close()

    print(f"\nMigration complete! Added {added} new columns.")
    print("The public intake system is now ready to use.")

if __name__ == '__main__':
    migrate_database()
