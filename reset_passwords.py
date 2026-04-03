from app import app, db, User
from werkzeug.security import generate_password_hash

def reset_all_passwords():
    with app.app_context():
        users = User.query.all()
        
        print("\n" + "="*60)
        print("RESETEANDO CONTRASEÑAS DE USUARIOS")
        print("="*60)
        
        # Contraseña estándar
        new_password = "password123"
        
        for user in users:
            user.password_hash = generate_password_hash(new_password)
            print(f"\n✅ Usuario: {user.email}")
            print(f"   Nueva contraseña: {new_password}")
        
        db.session.commit()
        
        print("\n" + "="*60)
        print("CREDENCIALES ACTUALIZADAS:")
        print("="*60)
        
        for user in users:
            print(f"\n📧 Email: {user.email}")
            print(f"   Nombre: {user.first_name} {user.last_name}")
            print(f"   Tipo: {user.user_type}")
            print(f"   🔑 Contraseña: {new_password}")
        
        print("\n" + "="*60)
        print(f"Total: {len(users)} usuarios actualizados")
        print("="*60)

if __name__ == "__main__":
    reset_all_passwords()
