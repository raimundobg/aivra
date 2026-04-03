from app import load_alimentos_database
import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

def verify():
    print("Loading DB...")
    try:
        # Mock app context if needed or just call function if it doesn't use current_app
        # load_alimentos_database uses openpyxl, pandas. Should be independent of flask app context?
        # Let's try.
        db = load_alimentos_database()
        print(f"DB Loaded successfully. Found {len(db)} main groups.")
        print("-" * 50)
        for g in db.keys():
            print(f"DB Group: {g}")
            
    except Exception as e:
        print(f"CRITICAL ERROR loading DB: {e}")
        return

    # Mimic the logic in get_alimentos_grupo
    keywords = {
        'lacteos': ['lacteo', 'leche', 'queso', 'yogur'],
        'cereales': ['cereal', 'pan', 'arroz', 'fideo', 'pasta', 'avena', 'galleta'],
        'frutas': ['fruta'],
        'verduras': ['verdura', 'hortaliza', 'vegetal'],
        'proteina': ['carne', 'pescado', 'huevo', 'legumbre', 'pollo', 'cerdo', 'atun', 'jamon', 'pavo'],
        'grasas': ['aceite', 'grasa', 'palta', 'frutos_secos', 'semilla', 'almendra', 'nuez', 'mani'],
        'azucares': ['azucar', 'miel', 'mermelada', 'dulce', 'chocolate'],
        'otros': ['otro', 'bebida', 'aderezo', 'salsa', 'jugo']
    }
    
    print("-" * 50)
    print("Testing Vocabulary Coverage:")
    
    total_items = 0
    for frontend_grp, terms in keywords.items():
        print(f"\nChecking Frontend Group: '{frontend_grp}'")
        group_items = 0
        
        for db_grupo, subgrupos in db.items():
            db_grupo_lower = db_grupo.lower()
            
            # 1. Match Group Name
            if any(term in db_grupo_lower for term in terms):
                print(f"  MATCHED DB GROUP: '{db_grupo}'")
                for sub, items in subgrupos.items():
                    group_items += len(items)
            else:
                # 2. Match Subgroup Name
                for subgrupo, items in subgrupos.items():
                    if any(term in subgrupo.lower() for term in terms):
                        print(f"  MATCHED DB SUBGROUP: '{subgrupo}' (in '{db_grupo}')")
                        group_items += len(items)
        
        print(f"  => Found {group_items} food items.")
        total_items += group_items
        
        if group_items == 0:
            print(f"  WARNING: No items found for '{frontend_grp}'! Check keywords.")

    print("-" * 50)
    print(f"Total navigable items: {total_items}")

if __name__ == "__main__":
    verify()
