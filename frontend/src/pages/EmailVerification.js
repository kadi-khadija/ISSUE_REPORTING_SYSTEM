import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Button, Alert } from 'react-bootstrap';
import { FaEnvelopeOpenText, FaCheckCircle, FaTimesCircle, FaRedo } from 'react-icons/fa';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error | expired
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('no_token');
      setMessage('No verification token found in the URL.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        const errorMsg = error.response?.data?.error || 'Verification failed.';
        if (errorMsg.toLowerCase().includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(errorMsg);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setResendLoading(true);
    try {
      const response = await authAPI.resendVerification(resendEmail);
      toast.success(response.data.message || 'Verification email sent!');
      setStatus('resent');
      setMessage(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend email.');
    } finally {
      setResendLoading(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="verify-page min-vh-100 d-flex align-items-center py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="verify-card border-0 overflow-hidden">
              {/* HEADER */}
              <div className="bg-sage py-4 text-center">
                <div className="step-number">
                  <FaEnvelopeOpenText />
                </div>
              </div>

              <Card.Body className="verify-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="verify-title fw-bold text-uppercase mb-1">Email Verification</h2>
                  <div className="divider mx-auto"></div>
                </div>

                {status === 'loading' && (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="success" className="mb-3" />
                    <p className="text-muted">Verifying your email address...</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="text-center py-3">
                    <FaCheckCircle size={60} className="text-success mb-3" />
                    <h4 className="text-success mb-2">Email Verified!</h4>
                    <p className="text-muted mb-4">{message}</p>
                    <Button className="btn-main px-5 py-2 fw-bold" onClick={goToLogin}>
                      Go to Login
                    </Button>
                  </div>
                )}

                {(status === 'error' || status === 'expired' || status === 'no_token') && (
                  <div className="text-center py-3">
                    <FaTimesCircle size={60} className="text-danger mb-3" />
                    <h4 className="text-danger mb-2">
                      {status === 'expired' ? 'Link Expired' : 'Verification Failed'}
                    </h4>
                    <p className="text-muted mb-4">{message}</p>

                    <div className="resend-section mt-4">
                      <p className="text-muted small mb-3">Enter your email to receive a new verification link:</p>
                      <div className="d-flex gap-2 justify-content-center">
                        <input
                          type="email"
                          className="form-control w-auto"
                          style={{ maxWidth: '280px' }}
                          placeholder="your@email.com"
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                        />
                        <Button
                          className="btn-main fw-bold"
                          onClick={handleResend}
                          disabled={resendLoading}
                        >
                          {resendLoading ? <Spinner size="sm" /> : <><FaRedo className="me-1" /> Resend</>}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link to="/login" className="text-sage fw-bold small">
                        Back to Login
                      </Link>
                    </div>
                  </div>
                )}

                {status === 'resent' && (
                  <div className="text-center py-3">
                    <FaEnvelopeOpenText size={60} className="text-primary mb-3" />
                    <h4 className="mb-2">Email Sent!</h4>
                    <p className="text-muted">{message}</p>
                    <div className="mt-4">
                      <Link to="/login" className="text-sage fw-bold small">
                        Back to Login
                      </Link>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .verify-page {
          background: linear-gradient(180deg, #eef2ef, #e3ebe6);
        }
        .verify-card {
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          background: white;
        }
        .verify-body { background: white; }
        .verify-title { color: #171717; }
        .divider {
          width: 40px; height: 4px;
          background: var(--primary);
          margin-top: 8px;
        }
        .step-number {
          background: var(--deep-black);
          width: 70px; height: 70px;
          border-radius: 50%;
          color: white;
          display: flex; align-items: center; justify-content: center;
          margin: auto; font-size: 1.5rem;
        }
        .btn-main {
          background: var(--deep-black); border: none;
          border-radius: 10px; transition: 0.3s;
        }
        .btn-main:hover, .btn-main:focus {
          background: #6f8f76 !important;
        }
        .text-sage { color: var(--primary) !important; }

        [data-theme="dark"] .verify-page {
          background: linear-gradient(180deg, #0f1316, #151b1f);
        }
        [data-theme="dark"] .verify-card { background: #181d21; box-shadow: 0 20px 40px rgba(0,0,0,0.28); }
        [data-theme="dark"] .verify-body { background: #181d21; }
        [data-theme="dark"] .verify-title { color: #f3f4f6; }
        [data-theme="dark"] .divider { background: #8cab92; }
        [data-theme="dark"] .step-number { background: #0f1113; color: white; }
        [data-theme="dark"] .btn-main { background: #0f1113; color: white; }
        [data-theme="dark"] .btn-main:hover, [data-theme="dark"] .btn-main:focus { background: #6f8f76 !important; }
        [data-theme="dark"] .text-sage { color: #8cab92 !important; }
      `}</style>
    </div>
  );
};

export default EmailVerification;
