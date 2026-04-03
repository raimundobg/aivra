"""
conftest.py - Shared test fixtures for BiteTrack password recovery tests
"""
import pytest
import os
import sys
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set environment variables for testing BEFORE importing app
os.environ['SECRET_KEY'] = 'test-secret-key-12345'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['RESEND_API_KEY'] = ''
os.environ['MAIL_USERNAME'] = ''
os.environ['MAIL_PASSWORD'] = ''
os.environ['TESTING'] = 'true'


@pytest.fixture(scope='session')
def app():
    """Create and configure the Flask app for testing."""
    from flask import Flask
    from models import db
    from auth import auth_bp
    from flask_login import LoginManager

    # Create app instance
    test_app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), '..', 'templates'))
    test_app.config['TESTING'] = True
    test_app.config['SECRET_KEY'] = 'test-secret-key-12345'
    test_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    test_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    test_app.config['WTF_CSRF_ENABLED'] = False

    # Initialize database
    db.init_app(test_app)

    # Register auth blueprint
    test_app.register_blueprint(auth_bp, url_prefix='/auth')

    # Configure Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(test_app)
    login_manager.login_view = 'auth.login'

    from models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Add dummy routes for redirects
    @test_app.route('/dashboard')
    def dashboard():
        return 'dashboard', 200

    @test_app.route('/dashboard/nutritionist')
    def nutritionist_dashboard():
        return 'nutritionist dashboard', 200

    @test_app.route('/dashboard/client')
    def client_dashboard():
        return 'client dashboard', 200

    @test_app.route('/dashboard/patient')
    def patient_dashboard():
        return 'patient dashboard', 200

    @test_app.route('/dashboard/enterprise')
    def enterprise_dashboard():
        return 'enterprise dashboard', 200

    @test_app.route('/')
    def index():
        return 'index', 200

    # Create all tables
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    """Create a test client for each test function."""
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """Provide a fresh database session for each test."""
    from models import db, User

    with app.app_context():
        # Clean up any existing test users
        User.query.filter(User.email.like('%@test.com')).delete()
        db.session.commit()

        yield db

        # Cleanup after test
        db.session.rollback()
        User.query.filter(User.email.like('%@test.com')).delete()
        db.session.commit()


@pytest.fixture(scope='function')
def sample_user(app, db_session):
    """Create a test user."""
    from models import User, UserType, SubscriptionPlan
    from datetime import date

    with app.app_context():
        user = User(
            email='testuser@test.com',
            first_name='Test',
            last_name='User',
            birth_date=date(1990, 1, 15),
            country='Chile',
            city='Santiago',
            user_type=UserType.CLIENTE,
            subscription_plan=SubscriptionPlan.FREE,
        )
        user.set_password('password123')
        db_session.session.add(user)
        db_session.session.commit()
        return user


@pytest.fixture(scope='function')
def user_with_recovery_token(app, db_session, sample_user):
    """Create a user with a valid recovery token."""
    from models import User, PasswordResetToken

    with app.app_context():
        user = User.query.filter_by(email='testuser@test.com').first()
        token_obj = PasswordResetToken(user_id=user.id)
        db_session.session.add(token_obj)
        db_session.session.commit()
        return {'user': user, 'token': token_obj.token}


@pytest.fixture(scope='function')
def user_with_expired_token(app, db_session, sample_user):
    """Create a user with an expired recovery token."""
    from models import User, PasswordResetToken

    with app.app_context():
        user = User.query.filter_by(email='testuser@test.com').first()
        token_obj = PasswordResetToken(user_id=user.id)
        token_obj.expires_at = datetime.utcnow() - timedelta(hours=2)
        db_session.session.add(token_obj)
        db_session.session.commit()
        return {'email': user.email, 'token': token_obj.token}


@pytest.fixture(scope='function')
def mock_email(monkeypatch):
    """Mock the email service to track sent emails."""
    sent_emails = []

    def fake_send_password_reset_email(user, reset_url):
        sent_emails.append({
            'to': user.email,
            'user_id': user.id,
            'reset_url': reset_url,
            'type': 'password_reset'
        })
        return {'success': True, 'error': None}

    import email_service
    monkeypatch.setattr(email_service, 'send_password_reset_email', fake_send_password_reset_email)

    return sent_emails
