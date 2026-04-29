import os
import json
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import config
from extensions import db, login_manager, migrate

def create_app(config_name='default'):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'production')
    """Application factory pattern."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'

    # Configure CORS
    CORS(app,
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True)

    # Ensure upload directory exists
    upload_folder = app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.issues import issues_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(issues_bp, url_prefix='/api/issues')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Serve uploaded files
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}, 200

    # Create database tables (use Flask-Migrate in production instead)
    with app.app_context():
        db.create_all()

        # Auto-create admin if not exists (with email_verified=True for seeded accounts)
               # Auto-create admin if not exists (with email_verified=True for seeded accounts)
        from models import User
        if not User.query.filter_by(role='admin').first():
            admin = User(
                username='admin',
                email='admin@admin.com',
                full_name='System Admin',
                role='admin',
                email_verified=True
            )
            admin.set_password('admin')
            db.session.add(admin)
            db.session.commit()
            print("Default admin created - Username: admin, Password: admin")

        # Auto-create commune admins from communes.json
        communes_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'communes.json')
        if os.path.exists(communes_file):
            with open(communes_file, 'r', encoding='utf-8') as f:
                communes_data = json.load(f)
                admins_config = communes_data.get('admins', {})
                communes_map = communes_data.get('communes', {})
                created = 0
                for email, zipcode in admins_config.items():
                    if User.query.filter_by(email=email).first():
                        continue
                    commune_name = communes_map.get(zipcode, 'Unknown')
                    admin_user = User(
                        username=email.split('@')[0],
                        email=email,
                        full_name=f"APC {commune_name}",
                        role='admin',
                        zipcode=zipcode,
                        is_active=True,
                        email_verified=True
                    )
                    admin_user.set_password('Boumerdes_2026!')
                    db.session.add(admin_user)
                    created += 1
                if created > 0:
                    db.session.commit()
                    print(f"Created {created} commune admin accounts")

    return app

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Create app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
