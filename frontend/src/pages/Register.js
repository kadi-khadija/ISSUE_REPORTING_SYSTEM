import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaPhone, FaIdCard } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Minimum 3 characters';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords not matching';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name || formData.username,
      phone: formData.phone,
    });

    setLoading(false);

    if (result.success) {
      // Show "check your email" screen instead of redirecting to dashboard
      setRegisteredEmail(formData.email);
      setRegistrationSuccess(true);
    } else {
      setError(result.error);
    }
  };

  // Show the "check your email" success screen
  if (registrationSuccess) {
    return (
      <div className="register-page min-vh-100 d-flex align-items-center py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="register-card border-0 overflow-hidden">
                <div className="bg-sage py-4 text-center">
                  <div className="step-number">
                    <FaEnvelope />
                  </div>
                </div>
                <Card.Body className="register-body p-4 p-md-5 text-center">
                  <h3 className="fw-bold mb-3 text-sage">Check Your Email!</h3>
                  <p className="text-muted mb-2">
                    We've sent a verification email to:
                  </p>
                  <p className="fw-bold text-dark mb-4">{registeredEmail}</p>
                  <p className="text-muted small mb-4">
                    Please click the verification link in the email to activate your account.
                    The link will expire in 24 hours.
                  </p>
                  <Alert variant="info" className="text-start small">
                    <strong>Didn't receive the email?</strong>
                    <ul className="mb-0 mt-2 small">
                      <li>Check your spam or junk folder</li>
                      <li>Make sure you entered the correct email address</li>
                      <li>You can request a new verification link from the login page</li>
                    </ul>
                  </Alert>
                  <Link to="/login" className="btn btn-main w-100 py-3 fw-bold d-block mt-4 text-decoration-none">
                    Go to Login
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <style>{`
          .register-page { background: linear-gradient(180deg, #eef2ef, #e3ebe6); }
          .register-card { border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); background: white; }
          .register-body { background: white; }
          .step-number { background: var(--deep-black); width: 70px; height: 70px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; margin: auto; font-size: 1.5rem; }
          .btn-main { background: var(--deep-black); border: none; border-radius: 10px; transition: 0.3s; color: white; }
          .btn-main:hover, .btn-main:focus { background: #6f8f76 !important; color: white; }
          .text-sage { color: var(--primary) !important; }
          [data-theme="dark"] .register-page { background: linear-gradient(180deg, #0f1316, #151b1f); }
          [data-theme="dark"] .register-card { background: #181d21; box-shadow: 0 20px 40px rgba(0,0,0,0.28); }
          [data-theme="dark"] .register-body { background: #181d21; }
          [data-theme="dark"] .step-number { background: #0f1113; color: white; }
          [data-theme="dark"] .btn-main { background: #0f1113; color: white; }
          [data-theme="dark"] .btn-main:hover, [data-theme="dark"] .btn-main:focus { background: #6f8f76 !important; color: white; }
          [data-theme="dark"] .text-sage { color: #8cab92 !important; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="register-page min-vh-100 d-flex align-items-center py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={7}>
            <Card className="register-card border-0 overflow-hidden">
              {/* HEADER */}
              <div className="bg-sage py-4 text-center">
                <div className="step-number">
                  <FaUserPlus />
                </div>
              </div>

              <Card.Body className="register-body p-4 p-md-5">
                <div className="text-center mb-5">
                  <h2 className="register-title fw-bold text-uppercase mb-1">Create Account</h2>
                  <div className="divider mx-auto"></div>
                  <p className="register-subtitle mt-3 small">
                    Join and report issues in your city
                  </p>
                </div>

                {error && (
                  <Alert variant="danger" className="register-alert border-0 small fw-bold">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="label">
                          <FaUser className="me-2 text-sage" />
                          Username
                        </Form.Label>

                        <Form.Control
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="input"
                          isInvalid={!!errors.username}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.username}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="label">
                          <FaEnvelope className="me-2 text-sage" />
                          Email
                        </Form.Label>

                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input"
                          isInvalid={!!errors.email}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.email}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="label">
                          <FaLock className="me-2 text-sage" />
                          Password
                        </Form.Label>

                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="input"
                          isInvalid={!!errors.password}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="label">
                          <FaLock className="me-2 text-sage" />
                          Confirm
                        </Form.Label>

                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="input"
                          isInvalid={!!errors.confirmPassword}
                        />

                        <Form.Control.Feedback type="invalid">
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="label">
                          <FaIdCard className="me-2 text-sage" />
                          Full Name
                        </Form.Label>

                        <Form.Control
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="input"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="label">
                          <FaPhone className="me-2 text-sage" />
                          Phone
                        </Form.Label>

                        <Form.Control
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="input"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Button
                    type="submit"
                    className="btn-main w-100 py-3 fw-bold"
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : 'Create Account'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="register-login-text small fw-bold">
                    Already have an account ?
                    <Link to="/login" className="text-sage ms-2">
                      Login
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .register-page {
          background: linear-gradient(180deg, #eef2ef, #e3ebe6);
        }

        .register-card {
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          background: white;
        }

        .register-body {
          background: white;
        }

        .register-title {
          color: #171717;
        }

        .register-subtitle {
          color: #6b7280;
        }

        .divider {
          width: 40px;
          height: 4px;
          background: var(--primary);
          margin-top: 8px;
        }

        .step-number {
          background: var(--deep-black);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto;
          font-size: 1.5rem;
        }

        .label {
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
          color: #666;
        }

        .input {
          background: #f5f7f6 !important;
          border: 1px solid transparent !important;
          padding: 12px !important;
          border-radius: 8px !important;
          transition: all 0.2s ease;
          color: #171717 !important;
          box-shadow: none !important;
        }

        .input:focus {
          background: white !important;
          box-shadow: none !important;
          border-left: 4px solid var(--primary) !important;
          border-color: #dfe7e2 !important;
        }

        .input.is-invalid {
          border: 1px solid #dc3545 !important;
        }

        .btn-main {
          background: var(--deep-black);
          border: none;
          border-radius: 10px;
          transition: 0.3s;
        }

        .btn-main:hover,
        .btn-main:focus {
          background: #6f8f76 !important;
        }

        .text-sage {
          color: var(--primary) !important;
        }

        .register-login-text {
          color: #6b7280;
        }

        .register-alert {
          background: #fdeaea;
          color: #b3261e;
        }

        /* DARK MODE */
        [data-theme="dark"] .register-page {
          background: linear-gradient(180deg, #0f1316, #151b1f);
        }

        [data-theme="dark"] .register-card {
          background: #181d21;
          box-shadow: 0 20px 40px rgba(0,0,0,0.28);
        }

        [data-theme="dark"] .register-body {
          background: #181d21;
        }

        [data-theme="dark"] .register-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] .register-subtitle {
          color: #a1a1aa;
        }

        [data-theme="dark"] .divider {
          background: #8cab92;
        }

        [data-theme="dark"] .step-number {
          background: #0f1113;
          color: white;
        }

        [data-theme="dark"] .label {
          color: #cbd5d1;
        }

        [data-theme="dark"] .input {
          background: #11161a !important;
          color: #f3f4f6 !important;
          border: 1px solid #2a3137 !important;
        }

        [data-theme="dark"] .input::placeholder {
          color: #8b949e;
        }

        [data-theme="dark"] .input:focus {
          background: #11161a !important;
          color: #fff !important;
          border-left: 4px solid #8cab92 !important;
          border-color: #384047 !important;
          box-shadow: none !important;
        }

        [data-theme="dark"] .input.is-invalid {
          border: 1px solid #dc3545 !important;
        }

        [data-theme="dark"] .btn-main {
          background: #0f1113;
          color: white;
        }

        [data-theme="dark"] .btn-main:hover,
        [data-theme="dark"] .btn-main:focus {
          background: #6f8f76 !important;
        }

        [data-theme="dark"] .text-sage {
          color: #8cab92 !important;
        }

        [data-theme="dark"] .register-login-text {
          color: #a1a1aa;
        }

        [data-theme="dark"] .register-alert {
          background: #3a2020;
          color: #f2a3a3;
        }

        [data-theme="dark"] .invalid-feedback {
          color: #ff8f8f;
        }
      `}</style>
    </div>
  );
};

export default Register;
