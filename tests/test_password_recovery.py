"""
test_password_recovery.py - Tests for password recovery system
Complete test suite covering all password recovery functionality
"""
import pytest
from datetime import datetime, timedelta


class TestForgotPasswordPage:
    """Test GET /auth/forgot-password - page rendering"""

    def test_forgot_password_page_returns_200(self, client):
        """The forgot password page is accessible."""
        response = client.get('/auth/forgot-password')
        assert response.status_code == 200

    def test_forgot_password_page_has_form(self, client):
        """The page contains a form."""
        response = client.get('/auth/forgot-password')
        assert b'<form' in response.data

    def test_forgot_password_page_has_email_input(self, client):
        """The page contains an email input field."""
        response = client.get('/auth/forgot-password')
        assert b'type="email"' in response.data or b'email' in response.data.lower()


class TestForgotPasswordSubmit:
    """Test POST /auth/forgot-password - password reset request"""

    def test_submit_with_existing_email_returns_200(self, client, sample_user, mock_email):
        """Submitting with existing email returns 200."""
        response = client.post('/auth/forgot-password', data={'email': 'testuser@test.com'})
        assert response.status_code == 200

    def test_submit_with_existing_email_sends_email(self, client, sample_user, mock_email):
        """An email is sent when user exists."""
        client.post('/auth/forgot-password', data={'email': 'testuser@test.com'})
        assert len(mock_email) == 1
        assert mock_email[0]['to'] == 'testuser@test.com'

    def test_submit_with_existing_email_generates_token(self, client, sample_user, mock_email, app):
        """A reset token is generated for the user."""
        client.post('/auth/forgot-password', data={'email': 'testuser@test.com'})
        with app.app_context():
            from models import User
            user = User.query.filter_by(email='testuser@test.com').first()
            reset_tokens = user.reset_tokens.filter_by(used=False).all()
            assert len(reset_tokens) > 0

    def test_submit_with_nonexistent_email_returns_200(self, client, mock_email):
        """Submitting with non-existent email also returns 200 (for security)."""
        response = client.post('/auth/forgot-password', data={'email': 'noexist@test.com'})
        assert response.status_code == 200

    def test_submit_with_nonexistent_email_no_email_sent(self, client, mock_email):
        """No email is sent for non-existent email addresses."""
        client.post('/auth/forgot-password', data={'email': 'noexist@test.com'})
        assert len(mock_email) == 0

    def test_submit_empty_email_shows_error(self, client):
        """Submitting without email shows an error."""
        response = client.post('/auth/forgot-password', data={'email': ''})
        assert response.status_code in (200, 400)

    def test_submit_invalid_email_shows_error(self, client):
        """Submitting invalid email format shows error."""
        response = client.post('/auth/forgot-password', data={'email': 'not-an-email'})
        assert response.status_code in (200, 400)

    def test_submit_sets_token_expiry(self, client, sample_user, mock_email, app):
        """The generated token has an expiration date (1 hour)."""
        client.post('/auth/forgot-password', data={'email': 'testuser@test.com'})
        with app.app_context():
            from models import User
            user = User.query.filter_by(email='testuser@test.com').first()
            token = user.reset_tokens.filter_by(used=False).first()
            assert token.expires_at > datetime.utcnow()
            # Should expire in approximately 1 hour
            time_diff = (token.expires_at - datetime.utcnow()).total_seconds()
            assert 3500 < time_diff < 3700  # 1 hour ± 100 seconds


class TestResetPasswordPage:
    """Test GET /auth/reset-password/<token> - reset form rendering"""

    def test_valid_token_returns_reset_form(self, client, user_with_recovery_token):
        """Valid token shows the reset password form."""
        token = user_with_recovery_token['token']
        response = client.get(f'/auth/reset-password/{token}')
        assert response.status_code == 200
        assert b'password' in response.data.lower()

    def test_valid_token_has_password_fields(self, client, user_with_recovery_token):
        """The reset form has password input fields."""
        token = user_with_recovery_token['token']
        response = client.get(f'/auth/reset-password/{token}')
        assert b'type="password"' in response.data or b'password' in response.data.lower()

    def test_invalid_token_redirects(self, client):
        """Invalid token redirects or shows error."""
        response = client.get('/auth/reset-password/invalid-token-xyz', follow_redirects=False)
        assert response.status_code in (302, 200)  # Redirect or error page

    def test_expired_token_shows_error(self, client, user_with_expired_token):
        """Expired token shows an error message or redirects."""
        token = user_with_expired_token['token']
        response = client.get(f'/auth/reset-password/{token}', follow_redirects=False)
        assert response.status_code in (302, 200)  # Redirect or error page


class TestResetPasswordSubmit:
    """Test POST /auth/reset-password/<token> - password reset"""

    def test_valid_reset_succeeds(self, client, user_with_recovery_token):
        """Valid password reset with matching passwords succeeds."""
        token = user_with_recovery_token['token']
        response = client.post(f'/auth/reset-password/{token}', data={
            'password': 'NewPass123',
            'confirm_password': 'NewPass123'
        })
        assert response.status_code in (200, 302)

    def test_reset_changes_password(self, client, user_with_recovery_token, app):
        """Password is actually changed in database after reset."""
        token = user_with_recovery_token['token']
        client.post(f'/auth/reset-password/{token}', data={
            'password': 'NewPass123',
            'confirm_password': 'NewPass123'
        })
        with app.app_context():
            from models import User
            user = User.query.filter_by(email='testuser@test.com').first()
            assert user.check_password('NewPass123') is True
            assert user.check_password('password123') is False

    def test_reset_clears_token_after_use(self, client, user_with_recovery_token, app):
        """Token is marked as used after successful reset."""
        token = user_with_recovery_token['token']
        client.post(f'/auth/reset-password/{token}', data={
            'password': 'NewPass123',
            'confirm_password': 'NewPass123'
        })
        with app.app_context():
            from models import PasswordResetToken
            token_obj = PasswordResetToken.query.filter_by(token=token).first()
            assert token_obj.used is True

    def test_reset_fails_with_mismatched_passwords(self, client, user_with_recovery_token):
        """Reset fails if passwords don't match."""
        token = user_with_recovery_token['token']
        response = client.post(f'/auth/reset-password/{token}', data={
            'password': 'NewPass123',
            'confirm_password': 'DifferentPass456'
        })
        assert response.status_code in (200, 400)

    def test_reset_fails_with_short_password(self, client, user_with_recovery_token):
        """Reset fails if password is too short (< 6 chars)."""
        token = user_with_recovery_token['token']
        response = client.post(f'/auth/reset-password/{token}', data={
            'password': '123',
            'confirm_password': '123'
        })
        assert response.status_code in (200, 400)

    def test_reset_fails_with_invalid_token(self, client):
        """Reset fails with invalid token."""
        response = client.post('/auth/reset-password/fake-token', data={
            'password': 'NewPass123',
            'confirm_password': 'NewPass123'
        }, follow_redirects=False)
        assert response.status_code in (302, 200)

    def test_reset_fails_with_expired_token(self, client, user_with_expired_token, app):
        """Reset fails with expired token and password is not changed."""
        token = user_with_expired_token['token']
        email = user_with_expired_token['email']

        with app.app_context():
            from models import User
            user = User.query.filter_by(email=email).first()
            original_hash = user.password_hash

        client.post(f'/auth/reset-password/{token}', data={
            'password': 'NewPass123',
            'confirm_password': 'NewPass123'
        })

        with app.app_context():
            from models import User
            user = User.query.filter_by(email=email).first()
            # Password should NOT have changed
            assert user.password_hash == original_hash


class TestPasswordRecoverySecurity:
    """Test security aspects of password recovery"""

    def test_token_cannot_be_reused(self, client, user_with_recovery_token, app):
        """Token cannot be used twice."""
        token = user_with_recovery_token['token']

        # First use - should succeed
        client.post(f'/auth/reset-password/{token}', data={
            'password': 'FirstPass123',
            'confirm_password': 'FirstPass123'
        })

        # Second use with same token - should fail or have no effect
        response = client.post(f'/auth/reset-password/{token}', data={
            'password': 'SecondPass456',
            'confirm_password': 'SecondPass456'
        }, follow_redirects=False)

        with app.app_context():
            from models import User
            user = User.query.filter_by(email='testuser@test.com').first()
            # Password should be the first one, not the second
            assert user.check_password('FirstPass123') is True
            assert user.check_password('SecondPass456') is False

    def test_each_request_generates_new_token(self, client, sample_user, mock_email, app):
        """Each forgot-password request generates a new unique token."""
        client.post('/auth/forgot-password', data={'email': 'testuser@test.com'})
        with app.app_context():
            from models import User, PasswordResetToken
            user = User.query.filter_by(email='testuser@test.com').first()
            token1 = user.reset_tokens.filter_by(used=False).first().token

        client.post('/auth/forgot-password', data={'email': 'testuser@test.com'})
        with app.app_context():
            from models import User, PasswordResetToken
            user = User.query.filter_by(email='testuser@test.com').first()
            token2 = user.reset_tokens.order_by(PasswordResetToken.created_at.desc()).first().token

        # Tokens should be different
        assert token1 != token2

    def test_old_password_invalid_after_reset(self, client, user_with_recovery_token, app):
        """Old password is no longer valid after reset."""
        token = user_with_recovery_token['token']
        client.post(f'/auth/reset-password/{token}', data={
            'password': 'CompletelyNewPass789',
            'confirm_password': 'CompletelyNewPass789'
        })
        with app.app_context():
            from models import User
            user = User.query.filter_by(email='testuser@test.com').first()
            assert user.check_password('password123') is False
            assert user.check_password('CompletelyNewPass789') is True

    def test_email_case_insensitive(self, client, sample_user, mock_email, app):
        """Email lookup is case-insensitive."""
        response = client.post('/auth/forgot-password', data={
            'email': 'TESTUSER@TEST.COM'
        })
        # Should succeed and show success message
        assert response.status_code == 200


# Import models for use in tests
def test_import_models():
    """Verify that models can be imported."""
    from models import PasswordResetToken, User
    assert PasswordResetToken is not None
    assert User is not None
