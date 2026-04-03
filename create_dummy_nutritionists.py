"""
Script para crear 10 nutricionistas dummy con diferentes especialidades
"""
from datetime import datetime
from app import app, db
from models import User
from werkzeug.security import generate_password_hash

DUMMY_NUTRITIONISTS = [
    {
        'email': 'maria.gonzalez@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Maria',
        'last_name': 'Gonzalez',
        'birth_date': '1988-03-15',
        'specialization': 'nutricion_clinica,diabetes_metabolismo',
        'bio': 'Nutricionista clinica con 8 años de experiencia en manejo de diabetes y sindrome metabolico. Enfoque integral y personalizado.',
        'consulta_precio': 45000,
        'consulta_duracion': 60,
        'city': 'Santiago',
        'country': 'Chile'
    },
    {
        'email': 'carlos.mendez@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Carlos',
        'last_name': 'Mendez',
        'birth_date': '1985-07-22',
        'specialization': 'nutricion_deportiva,rendimiento_atletico',
        'bio': 'Especialista en nutricion deportiva para atletas de alto rendimiento. Trabajo con equipos profesionales de futbol y atletismo.',
        'consulta_precio': 55000,
        'consulta_duracion': 45,
        'city': 'Concepcion',
        'country': 'Chile'
    },
    {
        'email': 'ana.silva@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Ana',
        'last_name': 'Silva',
        'birth_date': '1990-11-08',
        'specialization': 'nutricion_pediatrica,alergias_intolerancias',
        'bio': 'Pediatra nutricional con enfoque en alergias alimentarias y desarrollo infantil. Mama de 2 niños.',
        'consulta_precio': 40000,
        'consulta_duracion': 50,
        'city': 'Valparaiso',
        'country': 'Chile'
    },
    {
        'email': 'pedro.rojas@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Pedro',
        'last_name': 'Rojas',
        'birth_date': '1982-05-30',
        'specialization': 'control_peso,obesidad_cirugia_bariatrica',
        'bio': 'Experto en manejo de obesidad y acompañamiento pre/post cirugia bariatrica. Mas de 500 pacientes atendidos.',
        'consulta_precio': 50000,
        'consulta_duracion': 60,
        'city': 'Santiago',
        'country': 'Chile'
    },
    {
        'email': 'lucia.fernandez@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Lucia',
        'last_name': 'Fernandez',
        'birth_date': '1992-09-12',
        'specialization': 'alimentacion_vegetariana_vegana,nutricion_funcional',
        'bio': 'Especialista en alimentacion basada en plantas. Vegana hace 10 años. Certificada en nutricion funcional.',
        'consulta_precio': 42000,
        'consulta_duracion': 55,
        'city': 'Viña del Mar',
        'country': 'Chile'
    },
    {
        'email': 'roberto.castro@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Roberto',
        'last_name': 'Castro',
        'birth_date': '1978-01-25',
        'specialization': 'gastroenterologia_nutricional,enfermedad_celiaca',
        'bio': 'Gastroenterologo nutricionista. Especializado en enfermedad celiaca, sindrome intestino irritable y enfermedades inflamatorias.',
        'consulta_precio': 60000,
        'consulta_duracion': 60,
        'city': 'Santiago',
        'country': 'Chile'
    },
    {
        'email': 'carmen.lagos@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Carmen',
        'last_name': 'Lagos',
        'birth_date': '1987-06-18',
        'specialization': 'tca_conducta_alimentaria,nutricion_psicologia',
        'bio': 'Psicologa y nutricionista. Trabajo interdisciplinario en trastornos de conducta alimentaria. Enfoque compasivo.',
        'consulta_precio': 55000,
        'consulta_duracion': 75,
        'city': 'Temuco',
        'country': 'Chile'
    },
    {
        'email': 'felipe.morales@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Felipe',
        'last_name': 'Morales',
        'birth_date': '1975-12-03',
        'specialization': 'nutricion_geriatrica,nutricion_clinica',
        'bio': 'Especialista en nutricion para adultos mayores. Trabajo en prevencion de sarcopenia y desnutricion geriatrica.',
        'consulta_precio': 38000,
        'consulta_duracion': 50,
        'city': 'La Serena',
        'country': 'Chile'
    },
    {
        'email': 'valentina.herrera@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Valentina',
        'last_name': 'Herrera',
        'birth_date': '1993-04-27',
        'specialization': 'embarazo_lactancia,nutricion_pediatrica',
        'bio': 'Matrona y nutricionista. Apoyo integral durante embarazo, lactancia y primeros años de vida del bebe.',
        'consulta_precio': 43000,
        'consulta_duracion': 60,
        'city': 'Puerto Montt',
        'country': 'Chile'
    },
    {
        'email': 'jorge.vargas@nutricion.cl',
        'password': 'Demo123!',
        'first_name': 'Jorge',
        'last_name': 'Vargas',
        'birth_date': '1980-08-09',
        'specialization': 'nutrigenomica,medicina_integrativa',
        'bio': 'Pionero en nutrigenomica en Chile. Analisis genetico para planes alimentarios personalizados. Medicina funcional.',
        'consulta_precio': 75000,
        'consulta_duracion': 90,
        'city': 'Santiago',
        'country': 'Chile'
    }
]


def create_dummy_nutritionists():
    with app.app_context():
        created = 0
        skipped = 0

        for nutri_data in DUMMY_NUTRITIONISTS:
            # Check if user already exists
            existing = User.query.filter_by(email=nutri_data['email']).first()
            if existing:
                print(f"[SKIP] {nutri_data['email']} ya existe")
                skipped += 1
                continue

            # Create new nutritionist
            birth_date = datetime.strptime(nutri_data['birth_date'], '%Y-%m-%d').date()
            user = User(
                email=nutri_data['email'],
                password_hash=generate_password_hash(nutri_data['password']),
                user_type='nutricionista',
                first_name=nutri_data['first_name'],
                last_name=nutri_data['last_name'],
                birth_date=birth_date,
                specialization=nutri_data['specialization'],
                bio=nutri_data['bio'],
                consulta_precio=nutri_data['consulta_precio'],
                consulta_duracion=nutri_data['consulta_duracion'],
                city=nutri_data['city'],
                country=nutri_data['country'],
                is_active=True
            )
            db.session.add(user)
            print(f"[OK] Creado: {nutri_data['first_name']} {nutri_data['last_name']} ({nutri_data['email']})")
            created += 1

        db.session.commit()
        print(f"\n{'='*50}")
        print(f"RESUMEN: {created} creados, {skipped} omitidos")
        print(f"{'='*50}")


if __name__ == '__main__':
    create_dummy_nutritionists()
