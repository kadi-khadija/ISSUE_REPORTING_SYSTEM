import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCog, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();

  const issueImages = [
    {
      image: "https://jpcfbih.ba/assets/photos/text/original/1517989300-uticaj-klimatskih-promjena-na-cestovnu-infrastrukturu.jpg",
      title: "Roads & Infrastructure",
      description: "Potholes, cracks, flooding, and road damage affecting daily commute.",
      icon: "🛣️"
    },
    {
      image: "https://norwaste.no/wp-content/uploads/2020/10/20191109_172713.jpg",
      title: "Sanitation & Waste",
      description: "Garbage accumulation, drain blockages, and hygiene related concerns.",
      icon: "🗑️"
    },
    {
      image: "https://www.senatedems.ct.gov/wp-content/uploads/2024/08/Blog-Social-Mock-up-22.png",
      title: "Flooding & Emergencies",
      description: "Water overflow, damaged streets, and urgent public safety situations.",
      icon: "🚨"
    }
  ];

  if (isAdmin) {
    return (
      <>
        <section
          className="hero-container"
          style={{
            backgroundImage:
              "url('https://www.aps.dz/fr/_next/image?url=%2Ffr%2Fapi%2Fimage%2Farticle%2F3f949aae1777d81eaa54ec0612c95ab0.webp&w=1920&q=75')",
          }}
        >
          <Container className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="hero-white">Admin Control</span>
                <br />
                <span className="hero-gradient">Manage Reports</span>
              </h1>

              <p className="hero-subtitle">
                Welcome back, {user?.username}. Review public reports, monitor progress,
                and manage the platform from your administration dashboard.
              </p>

              <div className="d-flex flex-wrap gap-3 mt-4">
                <Button as={Link} to="/admin" size="lg" className="hero-btn">
                  <FaCog className="me-2" />
                  Open Admin Dashboard
                </Button>

                <Button as={Link} to="/issues" size="lg" className="hero-btn hero-btn-secondary">
                  <FaClipboardList className="me-2" />
                  View Reports
                </Button>
              </div>
            </div>
          </Container>
        </section>

   

        <style>{`
          .hero-container { min-height: 85vh; background-attachment: fixed; }
          .bg-sage { background-color: var(--sage-green); }

          .hero-btn-secondary {
            background: rgba(255,255,255,0.12) !important;
            border: 1px solid rgba(255,255,255,0.35) !important;
            color: white !important;
          }

          .hero-btn-secondary:hover {
            background: rgba(255,255,255,0.2) !important;
            color: white !important;
          }

          .report-types-section {
            padding: 90px 0;
            background: #ffffff;
          }

          .report-section-head {
            max-width: 760px;
            margin: 0 auto 50px auto;
          }

          .report-section-title {
            font-size: 3rem;
            font-weight: 800;
            color: #111827;
            margin-bottom: 12px;
            letter-spacing: -1px;
          }

          .report-section-subtitle {
            font-size: 1.1rem;
            color: #6b7280;
            line-height: 1.8;
            margin: 0;
          }

          .report-card-modern {
            position: relative;
            height: 430px;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 18px 45px rgba(0,0,0,0.08);
            transition: all 0.35s ease;
          }

          .report-card-modern:hover {
            transform: translateY(-8px);
            box-shadow: 0 24px 55px rgba(0,0,0,0.12);
          }

          .report-card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
          }

          .report-card-modern:hover .report-card-image {
            transform: scale(1.06);
          }

          .report-card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(0,0,0,0.08) 0%,
              rgba(0,0,0,0.58) 100%
            );
            display: flex;
            align-items: flex-end;
            padding: 24px;
          }

          .report-card-content {
            color: white;
          }

          .report-card-icon {
            font-size: 1.8rem;
            margin-bottom: 14px;
          }

          .report-card-title {
            font-size: 1.7rem;
            font-weight: 800;
            margin-bottom: 10px;
            line-height: 1.25;
          }

          .report-card-description {
            font-size: 1rem;
            line-height: 1.7;
            color: rgba(255,255,255,0.88);
            margin-bottom: 16px;
            max-width: 95%;
          }

          .report-card-link {
            display: inline-flex;
            align-items: center;
            color: white;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.95rem;
            transition: all 0.2s ease;
          }

          .report-card-link:hover {
            color: #d8e6dc;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <section
        className="hero-container"
        style={{
          backgroundImage:
            "url('https://www.aps.dz/fr/_next/image?url=%2Ffr%2Fapi%2Fimage%2Farticle%2F3f949aae1777d81eaa54ec0612c95ab0.webp&w=1920&q=75')",
        }}
      >
        <Container className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-white">Report Today</span>
              <br />
              <span className="hero-gradient">Improve Tomorrow</span>
            </h1>

            <p className="hero-subtitle">
              Be the change your city needs. Pinpoint issues, track their progress,
              and help us build a better environment for everyone.
            </p>

            {!isAuthenticated ? (
              <Button as={Link} to="/register" size="lg" className="hero-btn">
                Get Started Now <FaArrowRight className="ms-2" />
              </Button>
            ) : (
              <Button as={Link} to="/report" size="lg" className="hero-btn">
                Submit a Report <FaArrowRight className="ms-2" />
              </Button>
            )}
          </div>
        </Container>
      </section>

      <section className="section-sage text-center">
        <Container>
          <h2 className="fw-bold text-uppercase mb-5" style={{ fontSize: '2rem' }}>How it work</h2>
          <Row>
            <Col md={4} className="mb-5 mb-md-0">
              <div className="step-number">1</div>
              <h4 className="fw-bold">Report</h4>
              <p className="px-lg-5">Take a photo and describe the issue you've encountered in your city.</p>
            </Col>
            <Col md={4} className="mb-5 mb-md-0">
              <div className="step-number">2</div>
              <h4 className="fw-bold">Track</h4>
              <p className="px-lg-5">Follow the status of your report in real-time as officials handle it.</p>
            </Col>
            <Col md={4}>
              <div className="step-number">3</div>
              <h4 className="fw-bold">Resolve</h4>
              <p className="px-lg-5">Celebrate a cleaner, safer community once the issue is fixed.</p>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="report-types-section">
        <Container>
          <div className="report-section-head text-center">
            <h2 className="report-section-title">What Can You Report?</h2>
            <p className="report-section-subtitle">
              Browse common issue types and help us keep your community clean,
              safe, and well-maintained.
            </p>
          </div>

          <Row className="g-4">
            {issueImages.map((item, index) => (
              <Col key={index} md={6} lg={4}>
                <div className="report-card-modern">
                  <img src={item.image} alt={item.title} className="report-card-image" />
                  <div className="report-card-overlay">
                    <div className="report-card-content">
                      <div className="report-card-icon">{item.icon}</div>
                      <h3 className="report-card-title">{item.title}</h3>
                      <p className="report-card-description">{item.description}</p>
                      <Link to="/issues" className="report-card-link">
                        Explore reports <FaArrowRight size={12} className="ms-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <style>{`
        .hero-container { min-height: 85vh; background-attachment: fixed; }
        .bg-sage { background-color: var(--sage-green); }
        .step-number { box-shadow: 0 10px 0 rgba(0,0,0,0.1); }

        .report-types-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .report-section-head {
          max-width: 760px;
          margin: 0 auto 50px auto;
        }

        .report-section-title {
          font-size: 3rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 12px;
          letter-spacing: -1px;
        }

        .report-section-subtitle {
          font-size: 1.1rem;
          color: #6b7280;
          line-height: 1.8;
          margin: 0;
        }

        .report-card-modern {
          position: relative;
          height: 430px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 18px 45px rgba(0,0,0,0.08);
          transition: all 0.35s ease;
        }

        .report-card-modern:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 55px rgba(0,0,0,0.12);
        }

        .report-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .report-card-modern:hover .report-card-image {
          transform: scale(1.06);
        }

        .report-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,0.08) 0%,
            rgba(0,0,0,0.58) 100%
          );
          display: flex;
          align-items: flex-end;
          padding: 24px;
        }

        .report-card-content {
          color: white;
        }

        .report-card-icon {
          font-size: 1.8rem;
          margin-bottom: 14px;
        }

        .report-card-title {
          font-size: 1.7rem;
          font-weight: 800;
          margin-bottom: 10px;
          line-height: 1.25;
        }

        .report-card-description {
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.88);
          margin-bottom: 16px;
          max-width: 95%;
        }

        .report-card-link {
          display: inline-flex;
          align-items: center;
          color: white;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .report-card-link:hover {
          color: #d8e6dc;
        }
          [data-theme="dark"] .report-types-section {
  background: #11161a;
}

[data-theme="dark"] .report-section-title {
  color: #f3f4f6;
}

[data-theme="dark"] .report-section-subtitle {
  color: #a1a1aa;
}

[data-theme="dark"] .report-card-modern {
  box-shadow: 0 18px 45px rgba(0,0,0,0.35);
}

[data-theme="dark"] .report-card-modern:hover {
  box-shadow: 0 24px 55px rgba(0,0,0,0.45);
}

[data-theme="dark"] .report-card-overlay {
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0.18) 0%,
    rgba(0,0,0,0.72) 100%
  );
}

[data-theme="dark"] .report-card-link:hover {
  color: #9fc0a7;
}

      `}</style>
    </>
  );
};

export default Home;
