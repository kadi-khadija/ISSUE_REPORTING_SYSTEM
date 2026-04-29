import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  FaEnvelope,
  FaFacebook,
  FaTelegram,
  FaInstagram,
  FaSkype
} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="app-footer">
      <Container>
        <Row className="align-items-center footer-main">
          {/* LEFT */}
          <Col md={6} className="text-center text-md-start mb-4 mb-md-0">
            <p className="footer-kicker mb-2">Get in touch</p>
            <h4 className="footer-title mb-3">Contact us</h4>

            <a href="mailto:ChakwaDz@gmail.com" className="footer-email">
              <FaEnvelope className="me-2" />
              ChakwaDz@gmail.com
            </a>
          </Col>

          {/* RIGHT */}
          <Col md={6} className="text-center text-md-end">
            <p className="footer-kicker mb-2">Stay connected</p>
            <h4 className="footer-title mb-3">Follow us</h4>

            <div className="footer-socials">
              <a href="mailto:ChakwaDz@gmail.com" className="social-link" aria-label="Email">
                <FaEnvelope />
              </a>
              <a href="#" className="social-link" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="#" className="social-link" aria-label="Telegram">
                <FaTelegram />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="#" className="social-link" aria-label="Skype">
                <FaSkype />
              </a>
            </div>
          </Col>
        </Row>

        <div className="footer-divider"></div>

        <Row>
          <Col className="text-center">
            <p className="footer-copy mb-0">
              © {new Date().getFullYear()} Citizen Alert Platform · Developed by Queens Code ·
              M'Hamed Bougara University of Boumerdès
            </p>
          </Col>
        </Row>
      </Container>

      <style>{`
        .app-footer {
          margin-top: auto;
          padding: 42px 0 24px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(0,0,0,0.06);
        }

        .footer-main {
          padding-bottom: 12px;
        }

        .footer-kicker {
          color: var(--sage-green);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 11px;
          font-weight: 700;
        }

        .footer-title {
          font-weight: 800;
          color: #171717;
          margin: 0;
        }

        .footer-email {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          font-weight: 700;
          color: #171717;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .footer-email:hover {
          color: var(--sage-green);
        }

        .footer-socials {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .footer-socials {
            justify-content: flex-end;
          }
        }

        .social-link {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: white;
          color: #171717;
          border: 1px solid #e8ece9;
          font-size: 1.1rem;
          transition: all 0.25s ease;
          box-shadow: 0 6px 18px rgba(0,0,0,0.04);
        }

        .social-link:hover {
          background: var(--sage-green);
          color: white;
          transform: translateY(-3px);
        }

        .footer-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0,0,0,0.12),
            transparent
          );
          margin: 20px 0 18px;
        }

        .footer-copy {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.3px;
          line-height: 1.7;
        }
          [data-theme="dark"] .app-footer {
  background: rgba(24, 29, 33, 0.88);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255,255,255,0.06);
}

[data-theme="dark"] .footer-kicker {
  color: #8cab92;
}

[data-theme="dark"] .footer-title {
  color: #f3f4f6;
}

[data-theme="dark"] .footer-email {
  color: #f3f4f6;
}

[data-theme="dark"] .footer-email:hover {
  color: #8cab92;
}

[data-theme="dark"] .social-link {
  background: #11161a;
  color: #f3f4f6;
  border: 1px solid #2a3137;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
}

[data-theme="dark"] .social-link:hover {
  background: #6f8f76;
  color: white;
}

[data-theme="dark"] .footer-divider {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.10),
    transparent
  );
}

[data-theme="dark"] .footer-copy {
  color: #a1a1aa;
}
      `}</style>
    </footer>
  );
};

export default Footer;
