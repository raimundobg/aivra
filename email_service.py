"""
email_service.py - Servicio de envio de emails para BiteTrack
Supports Resend (HTTP API) and Flask-Mail (SMTP) as fallback.
"""
from flask_mail import Mail, Message
from flask import render_template, current_app
import os
import json
import threading
import requests

mail = Mail()

# ============================================
# INITIALIZATION
# ============================================

def init_mail(app):
    """Initialize Flask-Mail with app config from environment variables."""
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get(
        'MAIL_DEFAULT_SENDER',
        os.environ.get('MAIL_USERNAME', 'noreply@bitetrack.cl')
    )
    app.config['MAIL_TIMEOUT'] = 10
    mail.init_app(app)
    return mail


# ============================================
# SENDING BACKENDS
# ============================================

def _send_via_resend(to, subject, html, text):
    """Send email via Resend HTTP API (no SMTP needed)."""
    api_key = os.environ.get('RESEND_API_KEY', '')
    if not api_key:
        return {'success': False, 'error': 'RESEND_API_KEY not configured'}

    from_email = os.environ.get(
        'RESEND_FROM',
        os.environ.get('MAIL_DEFAULT_SENDER',
                       os.environ.get('MAIL_USERNAME', 'BiteTrack <onboarding@resend.dev>'))
    )

    try:
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'from': from_email,
                'to': [to] if isinstance(to, str) else to,
                'subject': subject,
                'html': html,
                'text': text,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            return {'success': True, 'error': None}
        else:
            error_msg = resp.json().get('message', resp.text)
            return {'success': False, 'error': f'Resend API error ({resp.status_code}): {error_msg}'}
    except Exception as e:
        return {'success': False, 'error': f'Resend request failed: {str(e)}'}


def _send_via_smtp(msg, timeout=15):
    """Send email via SMTP with a hard timeout to prevent worker hangs."""
    result = {'success': False, 'error': 'Timeout'}
    app = current_app._get_current_object()

    def _send():
        try:
            with app.app_context():
                mail.send(msg)
            result['success'] = True
            result['error'] = None
        except Exception as e:
            result['error'] = str(e)
            app.logger.error(f"[EMAIL-SMTP] Error: {str(e)}")

    t = threading.Thread(target=_send)
    t.start()
    t.join(timeout=timeout)

    if t.is_alive():
        result['error'] = f'SMTP timeout after {timeout}s'
        app.logger.warning(f"[EMAIL-SMTP] SMTP timeout after {timeout}s")

    return result


def _send_email(to, subject, html, text):
    """
    Send email using the best available backend.
    Priority: Resend (HTTP) > SMTP (Flask-Mail)
    """
    app = current_app._get_current_object()

    # Try Resend first (HTTP-based, works on Railway)
    resend_key = os.environ.get('RESEND_API_KEY', '')
    resend_from = os.environ.get('RESEND_FROM', '')
    print(f"[EMAIL] RESEND_API_KEY set: {bool(resend_key)}, key starts with: {resend_key[:10]}..." if resend_key else "[EMAIL] RESEND_API_KEY: NOT SET")
    print(f"[EMAIL] RESEND_FROM: {resend_from or 'NOT SET'}")

    if resend_key:
        print(f"[EMAIL] Sending via Resend to {to}")
        result = _send_via_resend(to, subject, html, text)
        print(f"[EMAIL] Resend result: {result}")
        if result['success']:
            return result
        print(f"[EMAIL] Resend failed, trying SMTP fallback: {result['error']}")

    # Fallback to SMTP
    smtp_user = os.environ.get('MAIL_USERNAME', '')
    smtp_pass = os.environ.get('MAIL_PASSWORD', '')
    if smtp_user and smtp_pass:
        print(f"[EMAIL] Sending via SMTP to {to}")
        msg = Message(subject=subject, recipients=[to] if isinstance(to, str) else to)
        msg.html = html
        msg.body = text
        result = _send_via_smtp(msg, timeout=15)
        print(f"[EMAIL] SMTP result: {result}")
        return result

    return {'success': False, 'error': 'No email backend configured (set RESEND_API_KEY or MAIL_USERNAME/MAIL_PASSWORD)'}


# ============================================
# PUBLIC API
# ============================================

def send_intake_email(patient, intake_url, nutritionist_name):
    """
    Send branded HTML email to patient with pre-consultation form link.

    Returns:
        dict with 'success' (bool) and 'error' (str, if any)
    """
    if not patient.email:
        return {'success': False, 'error': 'El paciente no tiene email registrado'}

    try:
        subject = f'Formulario Pre-Consulta - {nutritionist_name}'

        html = render_template(
            'email/intake_invitation.html',
            patient_name=patient.nombre,
            nutritionist_name=nutritionist_name,
            intake_url=intake_url
        )

        text = (
            f"Hola {patient.nombre},\n\n"
            f"{nutritionist_name} te ha agendado una consulta nutricional.\n\n"
            f"Por favor completa tu formulario pre-consulta en el siguiente enlace:\n"
            f"{intake_url}\n\n"
            f"Este formulario nos ayuda a preparar mejor tu consulta.\n\n"
            f"Saludos,\nEquipo BiteTrack"
        )

        return _send_email(patient.email, subject, html, text)

    except Exception as e:
        current_app.logger.error(f"Error enviando email a {patient.email}: {str(e)}")
        return {'success': False, 'error': str(e)}


def send_booking_confirmation(booking, nutritionist, intake_url):
    """
    Send booking confirmation email with intake form link and payment info.

    Returns:
        dict with 'success' (bool) and 'error' (str, if any)
    """
    if not booking.client_email:
        return {'success': False, 'error': 'El cliente no tiene email'}

    banco_info = {}
    if nutritionist.banco_info:
        try:
            banco_info = json.loads(nutritionist.banco_info)
        except (json.JSONDecodeError, TypeError):
            banco_info = {}

    try:
        subject = f'Confirmacion de Cita - {nutritionist.get_full_name()}'

        html = render_template(
            'email/booking_confirmation.html',
            client_name=booking.client_name,
            nutritionist_name=nutritionist.get_full_name(),
            booking_date=booking.booking_date.strftime('%d/%m/%Y'),
            booking_time=booking.booking_time,
            specialty_label=booking.get_specialty_label(),
            intake_url=intake_url,
            banco_info=banco_info,
            consulta_precio=nutritionist.consulta_precio,
        )

        text = (
            f"Hola {booking.client_name},\n\n"
            f"Tu cita con {nutritionist.get_full_name()} ha sido reservada.\n\n"
            f"Fecha: {booking.booking_date.strftime('%d/%m/%Y')}\n"
            f"Hora: {booking.booking_time}\n\n"
            f"Por favor completa tu formulario pre-consulta:\n"
            f"{intake_url}\n\n"
            f"Saludos,\nEquipo BiteTrack"
        )

        return _send_email(booking.client_email, subject, html, text)

    except Exception as e:
        current_app.logger.error(f"Error enviando confirmacion a {booking.client_email}: {str(e)}")
        return {'success': False, 'error': str(e)}


def is_mail_configured():
    """Check if any email backend is configured."""
    resend_key = os.environ.get('RESEND_API_KEY', '')
    if resend_key:
        return True
    username = os.environ.get('MAIL_USERNAME', '')
    password = os.environ.get('MAIL_PASSWORD', '')
    return bool(username and password)
