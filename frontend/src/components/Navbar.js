import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const NavigationBar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }

    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar expand="lg" className="navbar-modern sticky-top">
      <Container>
        {/* Logo */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <div className="logo-wrapper">
            <img src="/image.png" alt="logo" className="navbar-logo-img" />
          </div>

          <span className="brand-text">
            Citizen<span className="text-sage">Report</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* Center Links */}
          <Nav className="mx-auto navbar-links">
            <Nav.Link as={Link} to="/">Home</Nav.Link>

            {user ? (
              isAdmin ? (
                <>
                  <Nav.Link as={Link} to="/issues">View Reports</Nav.Link>
                  <Nav.Link as={Link} to="/admin">Admin Dashboard</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                  <Nav.Link as={Link} to="/report">Report Issue</Nav.Link>
                  <Nav.Link as={Link} to="/issues">View Reports</Nav.Link>
                  <Nav.Link as={Link} to="/contact">Contact</Nav.Link>
                </>
              )
            ) : (
              <>
                <Nav.Link as={Link} to="/issues">View Reports</Nav.Link>
                <Nav.Link as={Link} to="/contact">Contact</Nav.Link>
              </>
            )}
          </Nav>

          {/* Right Side */}
          <Nav className="align-items-center gap-3">
            {/* Dark mode switch */}
           <div className="theme-switch" onClick={toggleTheme}>
  <div className={`switch-circle ${darkMode ? 'dark' : ''}`}></div>
</div>

            {user ? (
              <NavDropdown
                title={<span className="fw-semibold">Hi, {user.username}</span>}
                align="end"
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" />
                  Profile
                </NavDropdown.Item>

                <NavDropdown.Divider />

                <NavDropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" />
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className="d-flex gap-2 align-items-center">
                <Nav.Link as={Link} to="/login" className="login-link">
                  Login
                </Nav.Link>

                <Button
                  as={Link}
                  to="/register"
                  className="signup-btn"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
