from flask import Blueprint, request, jsonify, current_app, render_template_string
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db
from models import User
import os
import requests as http_requests

auth_bp = Blueprint('auth', __name__)


def send_verification_email(user):
    """Send a verification email using Brevo HTTP API (no SMTP)."""
    token = user.generate_verification_token()
    frontend_url = current_app.config.get('FRONTEND_URL', os.environ.get('FRONTEND_URL', 'http://localhost:3000'))
    verify_url = f"{frontend_url}/verify-email?token={token}"

    sender_email = os.environ.get('MAIL_DEFAULT_SENDER', '')
    sender_name = "Issue Reporting System"

    html_body = render_template_string('''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #2d5016, #4a7c2e); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .body { padding: 30px; }
        .body p { color: #333333; font-size: 16px; line-height: 1.6; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #2d5016, #4a7c2e); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #888; }
        .note { font-size: 13px; color: #888; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Issue Reporting System</h1>
        </div>
        <div class="body">
            <p>Hello <strong>{{ user.full_name or user.username }}</strong>,</p>
            <p>Thank you for registering! Please verify your email by clicking the button below:</p>
            <div class="button-container">
                <a href="{{ verify_url }}" class="button">Verify My Email</a>
            </div>
            <p class="note" style="word-break: break-all; color: #4a7c2e;"><a href="{{ verify_url }}">{{ verify_url }}</a></p>
            <p class="note">This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
            <p>Issue Reporting System</p>
        </div>
    </div>
</body>
</html>
    ''', user=user, verify_url=verify_url)

    try:
        brevo_api_key = os.environ.get('BREVO_API_KEY', '')
        if not brevo_api_key:
            print("ERROR: BREVO_API_KEY is not set in .env file!")
            return False

        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": brevo_api_key,
            "content-type": "application/json"
        }
        payload = {
            "sender": {
                "name": sender_name,
                "email": sender_email
            },
            "to": [{"email": user.email, "name": user.full_name or user.username}],
            "subject": "Please Verify Your Email - Issue Reporting System",
            "htmlContent": html_body
        }

        response = http_requests.post(url, json=payload, headers=headers, timeout=10)
        print(f"Brevo API response: {response.status_code} - {response.text}")

        if response.status_code in [200, 201, 202]:
            return True
        else:
            print(f"Brevo API error: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Failed to send verification email to {user.email}: {e}")
        return False


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()

    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if not email or '@' not in email:
        return jsonify({'error': 'Valid email is required'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    import json
    role = 'citizen'
    zipcode = data.get('zipcode', '').strip()

    try:
        communes_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'communes.json')
        if os.path.exists(communes_file):
            with open(communes_file, 'r', encoding='utf-8') as f:
                communes_data = json.load(f)
                admins = communes_data.get('admins', {})
                if email in admins:
                    return jsonify({'error': 'This is an official system email. Please log in instead.'}), 403
    except Exception as e:
        print(f"Error checking admin status: {e}")

    user = User(username=username, email=email, full_name=full_name or username,
                phone=phone, zipcode=zipcode, role=role, is_active=True, email_verified=False)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    email_sent = send_verification_email(user)

    return jsonify({
        'message': 'Registration successful. Please check your email to verify your account.',
        'email_sent': email_sent,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    if not data or not data.get('token'):
        return jsonify({'error': 'Verification token is required'}), 400

    token = data.get('token')
    email = User.verify_token(token)
    if not email:
        return jsonify({'error': 'Invalid or expired verification link'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.email_verified:
        return jsonify({'message': 'Email is already verified. You can log in.'}), 200

    user.email_verified = True
    user.verification_token = None
    db.session.commit()
    return jsonify({'message': 'Email verified successfully! You can now log in.'}), 200


@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400

    email = data.get('email', '').strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'No account found with this email'}), 404
    if user.email_verified:
        return jsonify({'error': 'This email is already verified. You can log in.'}), 400

    email_sent = send_verification_email(user)
    if email_sent:
        return jsonify({'message': 'Verification email sent. Please check your inbox.'}), 200
    else:
        return jsonify({'error': 'Failed to send verification email. Please try again later.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')
    remember = data.get('remember', False)

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter(
        (User.username == username) | (User.email == username.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated. Contact administrator.'}), 403
    if not user.email_verified:
        return jsonify({'error': 'Please verify your email address before logging in.', 'email_verified': False, 'email': user.email}), 403

    login_user(user, remember=remember)
    return jsonify({'message': 'Login successful', 'user': user.to_dict()}), 200


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({'user': current_user.to_dict()}), 200


@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'full_name' in data:
        current_user.full_name = data['full_name'].strip()
    if 'phone' in data:
        current_user.phone = data['phone'].strip()
    if 'email' in data:
        email = data['email'].strip().lower()
        if email != current_user.email:
            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'Email already in use'}), 409
            current_user.email = email
            current_user.email_verified = False
            send_verification_email(current_user)
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        current_user.set_password(data['password'])

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': current_user.to_dict()}), 200


@auth_bp.route('/check', methods=['GET'])
def check_auth():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'user': current_user.to_dict()}), 200
    return jsonify({'authenticated': False, 'user': None}), 200