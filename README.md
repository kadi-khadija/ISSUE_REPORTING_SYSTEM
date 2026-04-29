# Public Issue Reporting System - Production Ready

A full-stack web application for citizens to report public issues (roads, lighting, sanitation, environment) to their local municipality administrators. Built with Flask (backend) + React (frontend), now configured for **MySQL** with **real email verification**.

---

## What Changed (vs Original)

| Feature | Original | This Version |
|---|---|---|
| **Database** | SQLite (file-based) | **MySQL** (via PyMySQL + SQLAlchemy) |
| **Email Verification** | None | **Full system** with token, resend, HTML email template |
| **Session Security** | `SESSION_COOKIE_SECURE = False` | Configurable, `True` in production |
| **CORS** | Hardcoded `localhost:3000` | Configurable via `FRONTEND_URL` env var |
| **Config** | Hardcoded values | **Environment variables** via `.env` + python-dotenv |
| **Database Migrations** | None (`db.create_all()` only) | **Flask-Migrate** (Alembic-based) |
| **Admin seeding** | Raw `sqlite3` calls | **SQLAlchemy ORM** (database-agnostic) |
| **Secret Key** | Hardcoded | From env, with random generation instructions |
| **Git** | `app.db` committed | `.gitignore` excludes db, env, venv, uploads |

---

## Prerequisites

- **Python 3.9+**
- **Node.js 16+** (for frontend)
- **MySQL 8.0+** running (local, or remote like AWS RDS / PlanetScale)
- **phpMyAdmin** (optional, for visual database management)
- **A Gmail account** (or any SMTP provider) with an App Password

---

## Setup Instructions

### 1. Create the MySQL Database

```sql
-- Log into MySQL (via phpMyAdmin, MySQL CLI, or any client):
mysql -u root -p

-- Create the database:
CREATE DATABASE issue_reporting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a user (recommended, don't use root in production):
CREATE USER 'issue_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON issue_reporting.* TO 'issue_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the env example and fill in your values
cp .env.example .env
```

### 3. Configure `.env`

Edit `backend/.env` with your actual values:

```env
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-random-64-char-hex-string

# Your MySQL credentials
DATABASE_URL=mysql+pymysql://issue_user:your_strong_password@localhost:3306/issue_reporting

# SMTP Email (Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx   # Gmail App Password, NOT your regular password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Frontend URL (for CORS + email verification links)
FRONTEND_URL=http://localhost:3000

DEBUG=True
```

**How to get a Gmail App Password:**
1. Go to Google Account > Security > 2-Step Verification
2. Scroll to "App passwords" > Create a new app password
3. Copy the 16-character password into `MAIL_PASSWORD`

### 4. Initialize the Database

```bash
cd backend
# Make sure your virtual env is active

# Option A: Using Flask-Migrate (recommended)
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Option B: Simple (creates all tables)
python -c "from app import create_app; app = create_app(); print('Tables created!')"
```

### 5. Seed Admin Accounts

```bash
cd backend
python create_admins.py
```

This creates admin accounts from `communes.json` with password `Boumerdes_2026!`.

### 6. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 7. Run the Backend

```bash
cd backend

# Development
python run.py

# Or with Flask CLI
flask run --host=0.0.0.0 --port=5000 --debug
```

---

## Email Verification Flow

1. **User registers** → Account created with `email_verified = False`
2. **Verification email sent** → Contains a secure, time-limited token link
3. **User clicks link** → `/verify-email?token=...` → Token validated → `email_verified = True`
4. **User can now log in** → Login blocked if `email_verified = False`
5. **Resend option** → Available on login page if email is unverified
6. **Token expires** → After 24 hours; user can request a new one

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (sends verification email) |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/login` | Login (blocked if email not verified) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/check` | Check authentication status |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/issues` | List all public issues |
| GET | `/api/issues/my` | List current user's issues |
| POST | `/api/issues` | Create new issue |
| PUT | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue |
| GET | `/api/admin/issues` | Admin: list all issues |
| PUT | `/api/admin/issues/:id/status` | Admin: update issue status |
| PUT | `/api/admin/issues/:id/priority` | Admin: update issue priority |
| GET | `/api/admin/users` | Admin: list users |
| GET | `/api/admin/stats` | Admin: dashboard statistics |

---

## Deployment

### Deploy Backend (Render.com)

1. Push this project to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. **Build Command:** `cd backend && pip install -r requirements.txt`
5. **Start Command:** `cd backend && gunicorn app:app` (install gunicorn first)
6. **Environment Variables:** Add all values from `.env`
7. Set `FLASK_ENV=production` and `SESSION_COOKIE_SECURE=True`

### Deploy Frontend (Vercel or Netlify)

**Vercel:**
1. Push to GitHub
2. Import on vercel.com
3. Set root directory to `frontend`
4. Build command: `npm run build`
5. Set env var: `REACT_APP_API_URL=https://your-backend.onrender.com/api`

### MySQL for Production

Use a managed MySQL service:
- **PlanetScale** (free tier available)
- **AWS RDS**
- **Render.com** (PostgreSQL add-on also works - just change `DATABASE_URL` to `postgresql://...`)
- **Any cPanel / shared hosting** with MySQL + phpMyAdmin

---

## Default Admin Account

| Field | Value |
|---|---|
| Username | `admin` |
| Email | `admin@admin.com` |
| Password | `admin` |

**Change this immediately in production!** Create a new admin via `create_admins.py` or directly in MySQL/phpMyAdmin, then delete or disable the default one.

---

## Tech Stack

- **Backend:** Flask 3.0, Flask-SQLAlchemy, Flask-Login, Flask-Mail, Flask-Migrate, PyMySQL
- **Frontend:** React 18, React Router 6, React-Bootstrap, Axios, Leaflet, React-Toastify
- **Database:** MySQL 8.0+

---

## License

Based on [Wissam-Oubouchou/public-issue-reporting-system](https://github.com/Wissam-Oubouchou/public-issue-reporting-system) with production enhancements.
