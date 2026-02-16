"""
email_service.py - Servicio de envio de emails para BiteTrack
"""
from flask_mail import Mail, Message
from flask import render_template, current_app
import os
import threading

mail = Mail()


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
    # SMTP timeout to prevent worker hangs (10 seconds connect, 15 seconds total)
    app.config['MAIL_TIMEOUT'] = 10
    mail.init_app(app)
    return mail


def _send_mail_with_timeout(msg, timeout=15):
    """Send email with a hard timeout to prevent worker hangs."""
    result = {'success': False, 'error': 'Timeout'}

    def _send():
        try:
            mail.send(msg)
            result['success'] = True
            result['error'] = None
        except Exception as e:
            result['error'] = str(e)

    t = threading.Thread(target=_send)
    t.start()
    t.join(timeout=timeout)

    if t.is_alive():
        result['error'] = f'SMTP timeout after {timeout}s'
    return result


def send_intake_email(patient, intake_url, nutritionist_name):
    """
    Send branded HTML email to patient with pre-consultation form link.

    Returns:
        dict with 'success' (bool) and 'error' (str, if any)
    """
    if not patient.email:
        return {'success': False, 'error': 'El paciente no tiene email registrado'}

    try:
        msg = Message(
            subject=f'Formulario Pre-Consulta - {nutritionist_name}',
            recipients=[patient.email]
        )

        # Render HTML email template
        msg.html = render_template(
            'email/intake_invitation.html',
            patient_name=patient.nombre,
            nutritionist_name=nutritionist_name,
            intake_url=intake_url
        )

        # Plain text fallback
        msg.body = (
            f"Hola {patient.nombre},\n\n"
            f"{nutritionist_name} te ha agendado una consulta nutricional.\n\n"
            f"Por favor completa tu formulario pre-consulta en el siguiente enlace:\n"
            f"{intake_url}\n\n"
            f"Este formulario nos ayuda a preparar mejor tu consulta.\n\n"
            f"Saludos,\nEquipo BiteTrack"
        )

        return _send_mail_with_timeout(msg, timeout=15)

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

    import json
    banco_info = {}
    if nutritionist.banco_info:
        try:
            banco_info = json.loads(nutritionist.banco_info)
        except (json.JSONDecodeError, TypeError):
            banco_info = {}

    try:
        msg = Message(
            subject=f'Confirmacion de Cita - {nutritionist.get_full_name()}',
            recipients=[booking.client_email]
        )

        msg.html = render_template(
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

        msg.body = (
            f"Hola {booking.client_name},\n\n"
            f"Tu cita con {nutritionist.get_full_name()} ha sido reservada.\n\n"
            f"Fecha: {booking.booking_date.strftime('%d/%m/%Y')}\n"
            f"Hora: {booking.booking_time}\n\n"
            f"Por favor completa tu formulario pre-consulta:\n"
            f"{intake_url}\n\n"
            f"Saludos,\nEquipo BiteTrack"
        )

        return _send_mail_with_timeout(msg, timeout=15)

    except Exception as e:
        current_app.logger.error(f"Error enviando confirmacion a {booking.client_email}: {str(e)}")
        return {'success': False, 'error': str(e)}


def is_mail_configured():
    """Check if mail credentials are set (not just defaults)."""
    username = os.environ.get('MAIL_USERNAME', '')
    password = os.environ.get('MAIL_PASSWORD', '')
    return bool(username and password)
