from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
import itsdangerous
import os


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='citizen')
    full_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    zipcode = db.Column(db.String(10), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(256), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    issues = db.relationship('Issue', backref='reporter', lazy='dynamic',
                             foreign_keys='Issue.user_id')
    assigned_issues = db.relationship('Issue', backref='assignee', lazy='dynamic',
                                      foreign_keys='Issue.assigned_to')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role == 'admin'

    def generate_verification_token(self):
        """Generate a secure email verification token."""
        serializer = itsdangerous.URLSafeTimedSerializer(
            os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
        )
        token = serializer.dumps(self.email, salt='email-verify')
        self.verification_token = token
        db.session.commit()
        return token

    @staticmethod
    def verify_token(token, max_age=86400):
        """Verify an email token. Returns the email if valid, None otherwise.
        max_age is in seconds (default 24 hours)."""
        serializer = itsdangerous.URLSafeTimedSerializer(
            os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
        )
        try:
            email = serializer.loads(token, salt='email-verify', max_age=max_age)
            return email
        except (itsdangerous.BadSignature, itsdangerous.SignatureExpired, Exception):
            return None

    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'phone': self.phone,
            'zipcode': self.zipcode,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        return data

    def __repr__(self):
        return f'<User {self.username}>'


class Issue(db.Model):
    __tablename__ = 'issues'

    STATUS_NEW = 'new'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_RESOLVED = 'resolved'
    STATUS_REJECTED = 'rejected'

    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_URGENT = 'urgent'

    CATEGORY_ROADS = 'roads'
    CATEGORY_LIGHTING = 'lighting'
    CATEGORY_SANITATION = 'sanitation'
    CATEGORY_ENVIRONMENT = 'environment'
    CATEGORY_OTHERS = 'others'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False, default=CATEGORY_OTHERS)
    status = db.Column(db.String(20), nullable=False, default=STATUS_NEW, index=True)
    priority = db.Column(db.String(20), nullable=False, default=PRIORITY_MEDIUM)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_address = db.Column(db.String(500), nullable=True)
    zipcode = db.Column(db.String(10), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    images = db.relationship('IssueImage', backref='issue', lazy='dynamic',
                             cascade='all, delete-orphan')
    status_history = db.relationship('StatusHistory', backref='issue', lazy='dynamic',
                                     cascade='all, delete-orphan')

    def to_dict(self, include_admin_fields=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'status': self.status,
            'priority': self.priority,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'location_address': self.location_address,
            'zipcode': self.zipcode,
            'user_id': self.user_id,
            'reporter_name': self.reporter.username if self.reporter else None,
            'images': [img.to_dict() for img in self.images],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_admin_fields:
            data.update({
                'assigned_to': self.assigned_to,
                'assignee_name': self.assignee.username if self.assignee else None,
                'admin_notes': self.admin_notes,
                'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
            })

        return data

    @staticmethod
    def get_categories():
        return [Issue.CATEGORY_ROADS, Issue.CATEGORY_LIGHTING, Issue.CATEGORY_SANITATION,
                Issue.CATEGORY_ENVIRONMENT, Issue.CATEGORY_OTHERS]

    @staticmethod
    def get_statuses():
        return [Issue.STATUS_NEW, Issue.STATUS_IN_PROGRESS, Issue.STATUS_RESOLVED, Issue.STATUS_REJECTED]

    @staticmethod
    def get_priorities():
        return [Issue.PRIORITY_LOW, Issue.PRIORITY_MEDIUM, Issue.PRIORITY_HIGH, Issue.PRIORITY_URGENT]

    def __repr__(self):
        return f'<Issue {self.id}: {self.title}>'


class IssueImage(db.Model):
    __tablename__ = 'issue_images'

    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(db.Integer, db.ForeignKey('issues.id'), nullable=False, index=True)
    file_path = db.Column(db.String(500), nullable=False)
    original_filename = db.Column(db.String(255), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'file_path': self.file_path,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'url': f'/uploads/{self.file_path}'
        }

    def __repr__(self):
        return f'<IssueImage {self.id}>'


class StatusHistory(db.Model):
    __tablename__ = 'status_history'

    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(db.Integer, db.ForeignKey('issues.id'), nullable=False, index=True)
    old_status = db.Column(db.String(20), nullable=True)
    new_status = db.Column(db.String(20), nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    comment = db.Column(db.Text, nullable=True)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    changer = db.relationship('User', backref='status_changes')

    def to_dict(self):
        return {
            'id': self.id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_by': self.changer.username if self.changer else None,
            'comment': self.comment,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None
        }

    def __repr__(self):
        return f'<StatusHistory {self.id}>'
