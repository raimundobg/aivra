import urllib.request
import urllib.parse
import http.cookiejar
import json
import re

BASE_URL = "http://127.0.0.1:5000"
LOGIN_URL = f"{BASE_URL}/auth/login"
DASHBOARD_URL = f"{BASE_URL}/dashboard/nutritionist"
INTAKE_URL = f"{BASE_URL}/dashboard/nutritionist/patient/new"
API_PATIENTS_URL = f"{BASE_URL}/api/patients"

# Setup cookie jar
cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
urllib.request.install_opener(opener)

def login():
    try:
        data = urllib.parse.urlencode({
            'email': 'admin@test.com',
            'password': 'password123'
        }).encode()
        opener.open(LOGIN_URL, data=data)
        return True
    except:
        return False

def create_patient():
    print("Creating Patient...")
    data = {
        "nombre": "Test Patient Log",
        "fecha_nacimiento": "1990-01-01",
        "sexo": "Femenino",
        "email": "test_log@patient.com",
        "menstruacion": "regular",
        "percepcion_esfuerzo": 7,
        "consumo_agua_litros": 2.5,
        "objetivos": ["salud"],
    }
    
    json_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(API_PATIENTS_URL, data=json_data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        response = opener.open(req)
        print("Success")
    except urllib.request.HTTPError as e:
        error_msg = e.read().decode('utf-8')
        with open("error_log.txt", "w") as f:
            f.write(error_msg)
        print("Error logged to error_log.txt")

if __name__ == "__main__":
    login()
    create_patient()
