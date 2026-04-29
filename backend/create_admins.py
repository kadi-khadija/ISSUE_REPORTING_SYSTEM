"""
Script to create admin accounts from communes.json using SQLAlchemy.
Run this AFTER setting up your MySQL database and running `flask db upgrade` (or `db.create_all()`).

Usage:
    cd backend
    python create_admins.py
"""

import json
import os
import sys

# Add backend directory to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    with open('communes.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        admins = data['admins']
        communes = data['communes']

    password_hash = generate_password_hash('Boumerdes_2026!')
    created = 0
    skipped = 0

    for email, zipcode in admins.items():
        commune_name = communes.get(zipcode, 'Unknown Commune')

        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"  SKIP: Admin {email} already exists")
            skipped += 1
            continue

        admin = User(
            username=email.split('@')[0],
            email=email,
            password_hash=password_hash,
            full_name=f"APC {commune_name}",
            role='admin',
            zipcode=zipcode,
            is_active=True,
            email_verified=True  # Admin accounts are pre-verified
        )
        db.session.add(admin)
        created += 1
        print(f"  CREATED: Admin {email} (Commune: {commune_name}, Zipcode: {zipcode})")

    db.session.commit()
    print(f"\nDone! Created {created} admin accounts, skipped {skipped} existing.")
