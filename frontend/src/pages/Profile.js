import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Tab, Tabs, Spinner } from 'react-bootstrap';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaSave,
  FaIdBadge,
  FaCalendarAlt,
  FaShieldAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setLoading(true);
    const result = await updateProfile(profileData);
    setLoading(false);

    if (result.success) {
      toast.success('Profile updated');
    } else {
      toast.error(result.error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await updateProfile({ password: passwordData.newPassword });
    setLoading(false);

    if (result.success) {
      setPasswordData({ newPassword: '', confirmPassword: '' });
      toast.success('Password updated');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="profile-page min-vh-100 py-5">
      <Container>
        <Row className="justify-content-center">
          <Col lg={11} xl={9}>
            {/* HEADER */}
            <div className="profile-header text-center mb-5">
              <p className="profile-kicker mb-2">Account Settings</p>
              <h2 className="profile-title mb-2">My Profile</h2>
              <p className="profile-subtitle mb-0">
                Manage your personal information and secure your account settings.
              </p>
            </div>

            <Card className="border-0 profile-card">
              <Row className="g-0">
                {/* SIDEBAR */}
                <Col md={4} className="profile-sidebar p-4 p-lg-5 text-center d-flex flex-column justify-content-center">
                  <div className="profile-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>

                  <h4 className="fw-bold mb-1 text-white">
                    {user?.full_name || user?.username}
                  </h4>

                  <p className="profile-username mb-4">@{user?.username}</p>

                  <div className="sidebar-divider"></div>

                  <div className="profile-meta mt-3">
                    <div className="meta-item">
                      <span className="meta-icon">
                        <FaIdBadge />
                      </span>
                      <div>
                        <small className="meta-label">Role</small>
                        <div className="meta-value text-capitalize">{user?.role}</div>
                      </div>
                    </div>

                    <div className="meta-item">
                      <span className="meta-icon">
                        <FaCalendarAlt />
                      </span>
                      <div>
                        <small className="meta-label">Joined</small>
                        <div className="meta-value">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '--'}
                        </div>
                      </div>
                    </div>

                    <div className="meta-item">
                      <span className="meta-icon">
                        <FaShieldAlt />
                      </span>
                      <div>
                        <small className="meta-label">Account</small>
                        <div className="meta-value">Active</div>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* CONTENT */}
                <Col md={8} className="profile-content p-4 p-md-5">
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="custom-tabs mb-4"
                  >
                    <Tab eventKey="profile" title="General Info" />
                    <Tab eventKey="password" title="Security" />
                  </Tabs>

                  {activeTab === 'profile' && (
                    <Form onSubmit={handleProfileSubmit} className="animate-fade-in">
                      <div className="form-block mb-4">
                        <h5 className="form-block-title">Personal Information</h5>
                        <p className="form-block-subtitle mb-0">
                          Update your name, email address, and phone number.
                        </p>
                      </div>

                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-muted text-uppercase">Full Name</Form.Label>
                        <div className="input-group-custom">
                          <FaUser className="icon" />
                          <Form.Control
                            name="full_name"
                            value={profileData.full_name}
                            onChange={handleProfileChange}
                            className="custom-input"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Email</Form.Label>
                            <div className="input-group-custom">
                              <FaEnvelope className="icon" />
                              <Form.Control
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                className={`custom-input ${errors.email ? 'is-invalid' : ''}`}
                                placeholder="Enter your email"
                              />
                            </div>
                            {errors.email && <div className="invalid-msg mt-2">{errors.email}</div>}
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Phone</Form.Label>
                            <div className="input-group-custom">
                              <FaPhone className="icon" />
                              <Form.Control
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                className="custom-input"
                                placeholder="Enter your phone number"
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button type="submit" className="profile-btn">
                        {loading ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </Form>
                  )}

                  {activeTab === 'password' && (
                    <Form onSubmit={handlePasswordSubmit} className="animate-fade-in">
                      <div className="form-block mb-4">
                        <h5 className="form-block-title">Security Settings</h5>
                        <p className="form-block-subtitle mb-0">
                          Change your password to keep your account secure.
                        </p>
                      </div>

                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-muted text-uppercase">New Password</Form.Label>
                        <div className="input-group-custom">
                          <FaLock className="icon" />
                          <Form.Control
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="custom-input"
                            placeholder="Enter new password"
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold text-muted text-uppercase">Confirm Password</Form.Label>
                        <div className="input-group-custom">
                          <FaLock className="icon" />
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="custom-input"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </Form.Group>

                      <Button type="submit" className="profile-btn">
                        {loading ? <Spinner size="sm" /> : 'Update Password'}
                      </Button>
                    </Form>
                  )}
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .profile-page {
          background: linear-gradient(180deg, #eef2ef, #e3ebe6);
        }

        .profile-header {
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }

        .profile-kicker {
          color: #5f7f67;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .profile-title {
          font-size: 2.4rem;
          font-weight: 800;
          color: #111;
          letter-spacing: -1px;
        }

        .profile-subtitle {
          color: #6b7280;
          font-size: 1rem;
          line-height: 1.7;
        }

        .profile-card {
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
          transition: all .25s ease;
        }

        .profile-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 50px rgba(0,0,0,0.10);
        }

        .profile-sidebar {
          background: linear-gradient(180deg, #111, #1a1a1a);
          color: white;
          position: relative;
        }

        .profile-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 2px solid #5f7f67;
          display: grid;
          place-items: center;
          font-size: 42px;
          font-weight: 700;
          color: #5f7f67;
          background: rgba(255,255,255,0.05);
          margin: 0 auto 16px;
          transition: all .25s ease;
        }

        .profile-avatar:hover {
          transform: scale(1.05);
        }

        .profile-username {
          color: #8fb298;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .sidebar-divider {
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 8px 0 4px;
        }

        .profile-meta {
          display: flex;
          flex-direction: column;
          gap: 18px;
          text-align: left;
        }

        .meta-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .meta-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(95,127,103,0.14);
          color: #8fb298;
          flex-shrink: 0;
        }

        .meta-label {
          display: block;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .meta-value {
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .profile-content {
          background: rgba(255,255,255,0.92);
        }

        .custom-tabs {
          border-bottom: 1px solid #ecefec;
        }

        .custom-tabs .nav-link {
          border: none;
          color: #9ca3af;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-right: 24px;
          padding: 10px 0;
          background: transparent !important;
        }

        .custom-tabs .nav-link.active {
          color: #111;
          border-bottom: 2px solid #5f7f67;
        }

        .form-block-title {
          font-weight: 800;
          color: #111;
          margin-bottom: 6px;
        }

        .form-block-subtitle {
          color: #6b7280;
          font-size: 0.96rem;
          line-height: 1.6;
        }

        .input-group-custom {
          position: relative;
        }

        .icon {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          color: #5f7f67;
          font-size: 0.95rem;
        }

        .custom-input {
          border: none;
          border-bottom: 1px solid #ddd;
          border-radius: 0;
          padding: 13px 10px 13px 32px;
          background: transparent;
          font-weight: 500;
          transition: all 0.25s ease;
          box-shadow: none !important;
        }

        .custom-input:focus {
          border-bottom: 1px solid #5f7f67;
          transform: translateY(-1px);
        }

        .custom-input.is-invalid {
          border-bottom: 1px solid #b3261e !important;
        }

        .invalid-msg {
          font-size: 0.85rem;
          color: #b3261e;
          font-weight: 600;
        }

        .profile-btn {
          background: #111 !important;
          border: none !important;
          border-radius: 14px !important;
          padding: 12px 22px !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
          box-shadow: none !important;
        }

        .profile-btn:hover,
        .profile-btn:focus {
          background: #5f7f67 !important;
          transform: translateY(-2px);
        }

        .animate-fade-in {
          animation: fadeIn 0.35s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
          
      `}</style>
    </div>
  );
};

export default Profile;
