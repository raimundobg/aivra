from app import app, db, User

with app.app_context():
    users = User.query.all()
    print("\n" + "="*60)
    print("CREDENCIALES DE ACCESO HABILITADAS")
    print("="*60)
    
    for user in users:
        print(f"\n👤 Usuario:")
        print(f"   Email: {user.email}")
        print(f"   Tipo: {user.user_type}")
        print(f"   Nombre: {user.first_name} {user.last_name}")
    
    print("\n" + "="*60)
    print(f"Total de usuarios: {len(users)}")
    print("="*60)
    print("\n📝 NOTA: La contraseña para admin@test.com es: password123")
    print("="*60)
