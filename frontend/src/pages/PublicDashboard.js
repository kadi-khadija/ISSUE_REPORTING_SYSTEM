import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Pagination, InputGroup } from 'react-bootstrap';
import { FaFilter, FaList, FaMap, FaSearch, FaChevronLeft, FaChevronRight, FaCircle } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import IssueCard from '../components/IssueCard';
import Loading from '../components/Loading';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PublicDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({ category: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const mapCenter = [36.7538, 3.0588];

  useEffect(() => {
    fetchCategories();
    fetchStatuses();
    fetchIssues();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await issuesAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Categories error');
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await issuesAPI.getStatuses();
      const raw = Array.isArray(response.data)
        ? response.data
        : (response.data.statuses || []);
      setStatuses(
        raw.map((s) =>
          typeof s === 'string'
            ? { value: s, label: s.replace('_', ' ').toUpperCase() }
            : s
        )
      );
    } catch (error) {
      console.error('Statuses error');
    }
  };

  const fetchIssues = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: 9 };
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await issuesAPI.getAll(params);
      setIssues(response.data.issues);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Issues error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusClass = (status) => {
    const map = {
      new: 'status-new',
      in_progress: 'status-progress',
      resolved: 'status-resolved',
      rejected: 'status-rejected',
    };
    return map[status] || 'status-new';
  };

  return (
    <div className="public-dashboard-page">
      <Container>
        {/* HERO / HEADER */}
        <Row className="align-items-center dashboard-hero">
          <Col lg={7}>
            <p className="hero-kicker">Citizen Platform</p>
            <h1 className="hero-title">Public Reports</h1>
            <p className="hero-subtitle">
              Browse, track, and explore issues reported by the community in a cleaner and more modern interface.
            </p>
          </Col>

          <Col lg={5} className="text-lg-end mt-4 mt-lg-0">
            <div className="view-switcher">
              <Button
                className={`switch-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <FaList className="me-2" />
                List
              </Button>

              <Button
                className={`switch-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
              >
                <FaMap className="me-2" />
                Map
              </Button>
            </div>
          </Col>
        </Row>

        {/* FILTERS */}
        <Card className="filters-card mb-5">
          <Card.Body>
            <Row className="g-4 align-items-end">
              <Col lg={4} md={6}>
                <Form.Label className="filter-label">Category</Form.Label>
                <InputGroup className="filter-group">
                  <InputGroup.Text className="filter-icon">
                    <FaFilter />
                  </InputGroup.Text>
                  <Form.Select
                    className="filter-input"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col lg={4} md={6}>
                <Form.Label className="filter-label">Status</Form.Label>
                <InputGroup className="filter-group">
                  <InputGroup.Text className="filter-icon">
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Select
                    className="filter-input"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>

              <Col lg={4}>
                <div className="summary-box">
                  <span className="summary-number">{pagination.total}</span>
                  <span className="summary-label">reported issues</span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* CONTENT */}
        {loading ? (
          <Loading fullPage text="Loading reports..." />
        ) : viewMode === 'list' ? (
          <div className="fade-up">
            <Row className="g-4">
              {issues.length === 0 ? (
                <Col className="text-center py-5">
                  <div className="empty-icon">
                    <FaFilter />
                  </div>
                  <h4 className="empty-title">No results found</h4>
                  <p className="empty-text">
                    Try adjusting your filters to see more reports.
                  </p>
                </Col>
              ) : (
                issues.map((issue) => (
                  <Col key={issue.id} md={6} lg={4}>
                    <IssueCard issue={issue} showReporter />
                  </Col>
                ))
              )}
            </Row>

            {pagination.pages > 1 && (
              <div className="pagination-wrap">
                <Pagination className="custom-pagination mb-0">
                  <Pagination.Prev
                    disabled={pagination.page === 1}
                    onClick={() => fetchIssues(pagination.page - 1)}
                  >
                    <FaChevronLeft />
                  </Pagination.Prev>

                  {[...Array(pagination.pages)].map((_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === pagination.page}
                      onClick={() => fetchIssues(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}

                  <Pagination.Next
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchIssues(pagination.page + 1)}
                  >
                    <FaChevronRight />
                  </Pagination.Next>
                </Pagination>
              </div>
            )}
          </div>
        ) : (
          <div className="fade-up">
            <Card className="map-shell">
              <div className="map-topbar">
                <div>
                  <p className="map-kicker">Live map</p>
                  <h4 className="map-title">Community issue map</h4>
                </div>

                <div className="map-legend">
                  <span className="legend-item">
                    <FaCircle className="legend-dot dot-new" />
                    New
                  </span>
                  <span className="legend-item">
                    <FaCircle className="legend-dot dot-progress" />
                    In progress
                  </span>
                  <span className="legend-item">
                    <FaCircle className="legend-dot dot-resolved" />
                    Resolved
                  </span>
                </div>
              </div>

              <Card className="map-card fade-up">
                <Card.Body className="p-0">
                  <MapContainer
                    center={mapCenter}
                    zoom={12}
                    style={{ height: '620px', width: '100%', zIndex: 1 }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {issues
                      .filter((issue) => issue.latitude && issue.longitude)
                      .map((issue) => (
                        <Marker
                          key={issue.id}
                          position={[issue.latitude, issue.longitude]}
                        >
                          <Popup className="custom-popup">
                            <div className="popup-content">
                              <div className="popup-kicker">
                                Report #{issue.id}
                              </div>

                              <h6 className="popup-title">{issue.title}</h6>

                              {issue.location_address && (
                                <p className="popup-address">{issue.location_address}</p>
                              )}

                              <span className={`popup-status ${getStatusClass(issue.status)}`}>
                                {issue.status.replace('_', ' ')}
                              </span>

                              <Link to={`/issues/${issue.id}`} className="popup-btn">
                                View Details
                              </Link>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </Card.Body>
              </Card>
            </Card>
          </div>
        )}
      </Container>

      <style>{`
        .public-dashboard-page {
          min-height: 100vh;
          padding: 48px 0;
          background: linear-gradient(
            180deg,
            #eef2ef 0%,
            #e3ebe6 100%
          );
        }

        .dashboard-hero {
          margin-bottom: 40px;
        }

        .hero-kicker {
          color: var(--sage-green);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .hero-title {
          font-size: 2.7rem;
          font-weight: 800;
          color: #171717;
          margin-bottom: 10px;
        }

        .hero-subtitle {
          color: #6b7280;
          max-width: 620px;
          margin-bottom: 0;
          line-height: 1.7;
        }

        .view-switcher {
          display: inline-flex;
          gap: 10px;
          background: rgba(255,255,255,0.75);
          border: 1px solid #e6ebe7;
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .switch-btn {
          border: none !important;
          background: transparent !important;
          color: #4b5563 !important;
          border-radius: 12px !important;
          padding: 10px 18px !important;
          font-weight: 700 !important;
          box-shadow: none !important;
          transition: all 0.2s ease;
        }

        .switch-btn.active {
          background: #171717 !important;
          color: white !important;
        }

        .switch-btn:hover {
          background: rgba(119,138,119,0.12) !important;
          color: #171717 !important;
        }

        .switch-btn.active:hover {
          background: #171717 !important;
          color: white !important;
        }

        .filters-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(8px);
        }

        .filter-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .filter-group {
          border-radius: 14px;
          overflow: hidden;
        }

        .filter-icon {
          background: white;
          border: 1px solid #dde5df;
          border-right: none;
          color: var(--sage-green);
        }

        .filter-input {
          border: 1px solid #dde5df !important;
          border-left: none !important;
          box-shadow: none !important;
          padding: 12px 14px !important;
        }

        .filter-input:focus {
          box-shadow: none !important;
          border-color: var(--sage-green) !important;
        }

        .summary-box {
          height: 100%;
          min-height: 72px;
          border-radius: 16px;
          background: #f7faf8;
          border: 1px solid #e7ece8;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .summary-number {
          font-size: 1.8rem;
          font-weight: 800;
          color: #171717;
          line-height: 1;
        }

        .summary-label {
          margin-top: 4px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          font-weight: 700;
        }

        .pagination-wrap {
          display: flex;
          justify-content: center;
          margin-top: 42px;
        }

        .custom-pagination .page-link {
          border: none !important;
          color: #333;
          font-weight: 700;
          margin: 0 4px;
          background: transparent;
          border-radius: 10px !important;
          box-shadow: none !important;
        }

        .custom-pagination .page-item.active .page-link {
          background-color: var(--sage-green) !important;
          color: white !important;
        }

        .custom-pagination .page-link:hover {
          background: rgba(119,138,119,0.15);
          color: #171717;
        }

        /* PREMIUM MAP */
        .map-shell {
          border: none;
          border-radius: 24px;
          background: transparent;
        }

        .map-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .map-kicker {
          margin-bottom: 4px;
          color: var(--sage-green);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 12px;
          font-weight: 700;
        }

        .map-title {
          margin: 0;
          font-weight: 800;
          color: #171717;
        }

        .map-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          background: rgba(255,255,255,0.72);
          border: 1px solid #e7ece8;
          padding: 10px 14px;
          border-radius: 14px;
          box-shadow: 0 8px 22px rgba(0,0,0,0.04);
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
        }

        .legend-dot {
          font-size: 11px;
        }

        .dot-new {
          color: #5f7f67;
        }

        .dot-progress {
          color: #a87608;
        }

        .dot-resolved {
          color: #2f7d48;
        }

        .map-card {
          border: none;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(0,0,0,0.09);
          background: white;
        }

        .leaflet-container {
          filter: grayscale(0.08) contrast(1.03) saturate(0.95);
        }

        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 18px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.14);
          padding: 2px;
        }

        .custom-popup .leaflet-popup-tip {
          box-shadow: none;
        }

        .popup-content {
          padding: 8px;
          min-width: 210px;
        }

        .popup-kicker {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          color: var(--sage-green);
          margin-bottom: 6px;
        }

        .popup-title {
          font-weight: 800;
          margin-bottom: 8px;
          color: #171717;
          line-height: 1.35;
        }

        .popup-address {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .popup-status {
          display: inline-flex;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
          text-transform: capitalize;
        }

        .status-new {
          background: #e9f0eb;
          color: #5f7f67;
        }

        .status-progress {
          background: #f3efe3;
          color: #a87608;
        }

        .status-resolved {
          background: #e7f4eb;
          color: #2f7d48;
        }

        .status-rejected {
          background: #fbeaea;
          color: #b3261e;
        }

        .popup-btn {
          display: block;
          width: 100%;
          text-align: center;
          text-decoration: none;
          background: #171717;
          color: white;
          padding: 11px 14px;
          border-radius: 12px;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .popup-btn:hover {
          background: var(--sage-green);
          color: white;
        }

        .empty-icon {
          font-size: 42px;
          color: var(--sage-green);
          opacity: 0.55;
          margin-bottom: 14px;
        }

        .empty-title {
          font-weight: 800;
          color: #171717;
          margin-bottom: 8px;
        }

        .empty-text {
          color: #6b7280;
          margin-bottom: 0;
        }

        .fade-up {
          animation: fadeUp 0.45s ease;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .text-sage {
          color: var(--sage-green) !important;
        }

        .border-sage {
          border-color: var(--sage-green) !important;
        }
          [data-theme="dark"] .public-dashboard-page {
  background: linear-gradient(
    180deg,
    #0f1316 0%,
    #151b1f 100%
  );
}

[data-theme="dark"] .hero-title,
[data-theme="dark"] .map-title,
[data-theme="dark"] .summary-number,
[data-theme="dark"] .empty-title {
  color: #f3f4f6;
}

[data-theme="dark"] .hero-subtitle,
[data-theme="dark"] .filter-label,
[data-theme="dark"] .summary-label,
[data-theme="dark"] .empty-text,
[data-theme="dark"] .popup-address {
  color: #a1a1aa;
}

[data-theme="dark"] .view-switcher {
  background: rgba(24,29,33,0.86);
  border: 1px solid #2a3137;
  box-shadow: 0 10px 30px rgba(0,0,0,0.22);
}

[data-theme="dark"] .switch-btn {
  color: #c7cdd3 !important;
}

[data-theme="dark"] .switch-btn.active {
  background: #0f1113 !important;
  color: white !important;
}

[data-theme="dark"] .switch-btn:hover {
  background: rgba(140,171,146,0.10) !important;
  color: #f3f4f6 !important;
}

[data-theme="dark"] .filters-card {
  background: rgba(24,29,33,0.88);
  box-shadow: 0 12px 30px rgba(0,0,0,0.24);
}

[data-theme="dark"] .filter-icon {
  background: #11161a;
  border: 1px solid #2a3137;
  border-right: none;
  color: #8cab92;
}

[data-theme="dark"] .filter-input {
  background: #11161a !important;
  color: #f3f4f6 !important;
  border: 1px solid #2a3137 !important;
  border-left: none !important;
}

[data-theme="dark"] .summary-box {
  background: #1b2126;
  border: 1px solid #2a3137;
}

[data-theme="dark"] .custom-pagination .page-link {
  color: #d1d5db;
}

[data-theme="dark"] .custom-pagination .page-link:hover {
  background: rgba(140,171,146,0.12);
  color: #f3f4f6;
}

[data-theme="dark"] .map-legend {
  background: rgba(24,29,33,0.86);
  border: 1px solid #2a3137;
  box-shadow: 0 8px 22px rgba(0,0,0,0.18);
}

[data-theme="dark"] .legend-item {
  color: #d1d5db;
}

[data-theme="dark"] .map-card {
  background: #181d21;
  box-shadow: 0 18px 40px rgba(0,0,0,0.28);
}

[data-theme="dark"] .custom-popup .leaflet-popup-content-wrapper {
  background: #181d21;
}

[data-theme="dark"] .popup-kicker {
  color: #8cab92;
}

[data-theme="dark"] .popup-title {
  color: #f3f4f6;
}

[data-theme="dark"] .popup-btn {
  background: #0f1113;
}

[data-theme="dark"] .popup-btn:hover {
  background: #6f8f76;
}

      `}</style>
    </div>
  );
};

export default PublicDashboard;
