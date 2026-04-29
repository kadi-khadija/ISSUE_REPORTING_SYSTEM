import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const Login = () => {

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(formData);

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      // Check if the error is because email is not verified
      if (result.data && result.data.email_verified === false) {
        setEmailNotVerified(true);
        setUnverifiedEmail(result.data.email || '');
        setError('');
      } else {
        setError(result.error);
      }
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const response = await authAPI.resendVerification(unverifiedEmail);
      toast.success(response.data.message || 'Verification email sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (

    <div className="login-page d-flex align-items-center">

      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={5}>

            <Card className="login-card">

              {/* HEADER */}
              <div className="login-header">
                <div className="login-icon">
                  <FaSignInAlt />
                </div>
              </div>

              <Card.Body>

                <div className="text-center mb-4">
                  <h2 className="login-title">Welcome Back</h2>
                  <div className="title-bar"></div>
                  <p className="login-subtitle">
                    Sign in to your account
                  </p>
                </div>

                {error && (
                  <Alert className="custom-alert">
                    {error}
                  </Alert>
                )}

                {emailNotVerified && (
                  <Alert className="custom-alert email-not-verified-alert">
                    <FaEnvelope className="me-2" />
                    <strong>Email not verified.</strong> Please check your inbox for a verification email.
                    <div className="mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        className="resend-btn"
                      >
                        {resendLoading ? <Spinner size="sm" /> : 'Resend Verification Email'}
                      </Button>
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <FaUser /> Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      className="modern-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label">
                      <FaLock /> Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="modern-input"
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleChange}
                      label="Remember me"
                    />

                    <Link to="/forgot-password" className="forgot-link">
                      Forgot?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="login-btn w-100"
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : "Sign In"}
                  </Button>

                </Form>

                <div className="text-center mt-4">
                  <p className="small text-muted">
                    Don't have an account?{" "}
                    <Link to="/register" className="register-link">
                      Register
                    </Link>
                  </p>
                </div>

              </Card.Body>
            </Card>

          </Col>
        </Row>
      </Container>

      {/* STYLE */}
      <style>{`

/* BACKGROUND */
.login-page {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    #eef2ef 0%,
    #e3ebe6 100%
  );
}

/* CARD */
.login-card {
  border: none;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.08);
  transition: 0.3s;
}

.login-card:hover {
  transform: translateY(-5px);
}

/* HEADER */
.login-header {
  background: var(--primary);
  padding: 30px;
  text-align: center;
}

.login-icon {
  width: 70px;
  height: 70px;
  background: white;
  color: var(--primary);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

/* TITLE */
.login-title {
  font-weight: 800;
}

.title-bar {
  width: 40px;
  height: 4px;
  background: var(--primary);
  margin: 10px auto;
  border-radius: 2px;
}

.login-subtitle {
  color: var(--text-muted);
  font-size: 14px;
}

/* INPUT */
.modern-input {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 12px;
  transition: 0.3s;
}

.modern-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(111,143,118,0.15);
}

/* LABEL */
.form-label {
  font-weight: 600;
  font-size: 13px;
  color: #444;
  display: flex;
  gap: 8px;
  align-items: center;
}

/* BUTTON */
.login-btn {
  background: var(--primary);
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-weight: 700;
  transition: 0.3s;
}

.login-btn:hover {
  background: var(--deep-black);
}

/* LINKS */
.forgot-link {
  font-size: 13px;
  color: var(--primary);
  text-decoration: none;
}

.register-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}

/* ALERT */
.custom-alert {
  background: #fdecea;
  color: #b3261e;
  border-radius: 10px;
  border: none;
  font-size: 14px;
}
  [data-theme="dark"] .login-page {
  background: linear-gradient(
    180deg,
    #0f1316 0%,
    #151b1f 100%
  );
}

[data-theme="dark"] .login-card {
  background: #181d21;
  box-shadow: 0 20px 50px rgba(0,0,0,0.28);
}

[data-theme="dark"] .login-header {
  background: #6f8f76;
}

[data-theme="dark"] .login-icon {
  background: #101417;
  color: #8cab92;
}

[data-theme="dark"] .login-title {
  color: #f3f4f6;
}

[data-theme="dark"] .login-subtitle {
  color: #a1a1aa;
}

[data-theme="dark"] .modern-input {
  background: #11161a;
  border: 1px solid #2a3137;
  color: #f3f4f6;
}

[data-theme="dark"] .modern-input::placeholder {
  color: #8b949e;
}

[data-theme="dark"] .modern-input:focus {
  background: #181d21 !important;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(111,143,118,0.18);
}

[data-theme="dark"] .form-label {
  color: #d1d5db;
}

[data-theme="dark"] .login-btn {
  background: #6f8f76;
  color: white;
}

[data-theme="dark"] .login-btn:hover {
  background: #0f1113;
}

[data-theme="dark"] .forgot-link,
[data-theme="dark"] .register-link {
  color: #8cab92;
}

[data-theme="dark"] .custom-alert {
  background: #3a2020;
  color: #f2a3a3;
}


      `}</style>

    </div>
  );
};

export default Login;