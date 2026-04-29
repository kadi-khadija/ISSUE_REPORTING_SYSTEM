import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Spinner, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaPlus,
  FaEye,
  FaTrash,
  FaFilter,
  FaClipboardList,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
  FaSearch
} from 'react-icons/fa';

import { issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    in_progress: 0,
    resolved: 0
  });

  const [filter, setFilter] = useState({ status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchIssues();
  }, [filter.status]);

  const fetchIssues = async (page = 1) => {
    setLoading(true);

    try {
      const params = { page, per_page: 10 };
      if (filter.status) params.status = filter.status;

      const response = await issuesAPI.getMy(params);

      setIssues(response.data.issues);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total
      });

      const statsData = {
        total: response.data.total,
        new: 0,
        in_progress: 0,
        resolved: 0
      };

      response.data.issues.forEach((issue) => {
        if (issue.status === 'new') statsData.new++;
        if (issue.status === 'in_progress') statsData.in_progress++;
        if (issue.status === 'resolved') statsData.resolved++;
      });

      setStats(statsData);
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue?')) return;

    try {
      await issuesAPI.delete(id);
      toast.success('Deleted');
      fetchIssues(pagination.page);
    } catch {
      toast.error('Error');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      new: { label: 'New', class: 'badge-new' },
      in_progress: { label: 'In Progress', class: 'badge-progress' },
      resolved: { label: 'Resolved', class: 'badge-resolved' },
      rejected: { label: 'Rejected', class: 'badge-rejected' }
    };

    const s = config[status] || config.new;
    return <span className={`status-badge ${s.class}`}>{s.label}</span>;
  };

  const filteredIssues = useMemo(() => {
    if (!searchTerm.trim()) return issues;

    return issues.filter((issue) => {
      const q = searchTerm.toLowerCase();
      const title = issue.title?.toLowerCase() || '';
      const category = issue.category?.toLowerCase() || '';
      const status = issue.status?.toLowerCase() || '';
      const id = String(issue.id || '');

      return (
        title.includes(q) ||
        category.includes(q) ||
        status.includes(q) ||
        id.includes(q)
      );
    });
  }, [issues, searchTerm]);

  return (
    <div className="dashboard-page py-5">
      <Container>
        {/* HEADER */}
        <Row className="mb-5 align-items-end">
          <Col>
            <h5 className="text-sage fw-bold text-uppercase mb-1 dashboard-kicker">
              Overview
            </h5>
            <h2 className="fw-bold m-0 dashboard-title">My Dashboard</h2>
            <p className="text-muted mt-2 dashboard-subtitle">
              Welcome back, <strong>{user?.username}</strong>
            </p>
          </Col>

          <Col xs="auto">
            <Button as={Link} to="/report" className="btn-main">
              <FaPlus className="me-2" />
              New Report
            </Button>
          </Col>
        </Row>

        {/* STATS */}
        <Row className="mb-5 g-4">
          {[
            { label: 'Total', value: pagination.total, icon: <FaClipboardList />, variant: 'dark' },
            { label: 'New', value: stats.new, icon: <FaExclamationCircle />, variant: 'sage' },
            { label: 'In Progress', value: stats.in_progress, icon: <FaClock />, variant: 'light' },
            { label: 'Resolved', value: stats.resolved, icon: <FaCheckCircle />, variant: 'white' }
          ].map((stat, idx) => (
            <Col key={idx} sm={6} lg={3}>
              <Card className={`stat-card stat-${stat.variant}`}>
                <Card.Body>
                  <div className="stat-top">
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-number">{stat.value}</div>
                  </div>
                  <div className="stat-label">{stat.label}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* TABLE */}
        <Card className="table-card">
          <Card.Header className="table-header">
            <div className="table-header-row">
              <div className="table-title">
                <FaFilter className="me-2 text-sage" />
                Reports
              </div>

              <div className="table-tools">
                <InputGroup className="search-group">
                  <InputGroup.Text className="search-icon-wrap">
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search reports..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Form.Select
                  className="filter-select"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </Form.Select>
              </div>
            </div>
          </Card.Header>

          <div className="table-meta">
            <span>
              Showing <strong>{filteredIssues.length}</strong> report{filteredIssues.length !== 1 ? 's' : ''}
            </span>
            <span>Updated just now</span>
          </div>

          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner />
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-5 empty-state">
                <p>No reports found</p>
                <Button as={Link} to="/report" className="btn-main">
                  Create one
                </Button>
              </div>
            ) : (
              <Table className="modern-table mb-0" responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>
                        <Link to={`/issues/${issue.id}`} className="title-link">
                          {issue.title}
                        </Link>
                      </td>

                      <td>
                        <span className="category-tag">{issue.category}</span>
                      </td>

                      <td>{getStatusBadge(issue.status)}</td>

                      <td className="date-cell">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </td>

                      <td className="text-center action-cell">
                        <div className="d-flex justify-content-center align-items-center gap-2">
                          <Button
                            as={Link}
                            to={`/issues/${issue.id}`}
                            size="sm"
                            className="icon-btn"
                          >
                            <FaEye />
                          </Button>

                          <Button
                            size="sm"
                            className="icon-btn danger"
                            onClick={() => handleDelete(issue.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      <style>{`
        .dashboard-page {
          background: linear-gradient(
            180deg,
            #eef2ef 0%,
            #e3ebe6 100%
          );
          min-height: 100vh;
        }

        .dashboard-kicker {
          letter-spacing: 2px;
          font-size: 12px;
        }

        .dashboard-title {
          font-size: 2.2rem;
          color: #161616;
        }

        .dashboard-subtitle {
          max-width: 500px;
        }

        .btn-main {
          background: var(--primary);
          border-radius: 999px;
          border: none;
          font-weight: 600;
          padding: 12px 20px;
          transition: all 0.25s ease;
          box-shadow: none !important;
        }

        .btn-main:hover,
        .btn-main:focus,
        .btn-main:active {
          background: #5f7f67 !important;
          color: white !important;
          transform: translateY(-2px);
          box-shadow: none !important;
        }

        .stat-card {
          border-radius: 18px;
          border: none;
          transition: 0.25s;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.08);
        }

        .stat-dark {
          background: #1a1a1a;
          color: white;
        }

        .stat-sage {
          background: var(--primary);
          color: white;
        }

        .stat-light {
          background: #f3f4f6;
          color: #1a1a1a;
        }

        .stat-white {
          background: white;
          border: 1px solid #e5e7eb;
          color: #1a1a1a;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.18);
          font-size: 17px;
        }

        .stat-light .stat-icon,
        .stat-white .stat-icon {
          background: rgba(0,0,0,0.05);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          opacity: 0.75;
          letter-spacing: 1px;
        }

        .table-card {
          border-radius: 18px;
          overflow: hidden;
          border: none;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
        }

        .table-header {
          background: #f6f8f7;
          border-bottom: 1px solid #e7ece8;
          padding: 18px 20px;
        }

        .table-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .table-title {
          font-weight: 700;
          color: #1a1a1a;
          display: flex;
          align-items: center;
        }

        .table-tools {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-group {
          min-width: 240px;
          border-radius: 12px;
          overflow: hidden;
        }

        .search-icon-wrap {
          background: white;
          border: 1px solid #dde4de;
          border-right: none;
          color: var(--primary);
        }

        .search-input {
          border: 1px solid #dde4de !important;
          border-left: none !important;
          box-shadow: none !important;
        }

        .search-input:focus {
          box-shadow: none !important;
          border-color: #cfd8d1 !important;
        }

        .filter-select {
          min-width: 180px;
          border-radius: 12px !important;
          border: 1px solid #dde4de !important;
          box-shadow: none !important;
        }

        .filter-select:focus {
          box-shadow: none !important;
          border-color: var(--primary) !important;
        }

        .table-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          font-size: 0.88rem;
          color: #6b7280;
          background: white;
          border-bottom: 1px solid #f0f2f0;
        }

        .modern-table thead th {
          background: #fafbfa;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid #edf1ed;
          padding: 16px 20px;
        }

        .modern-table th:last-child,
        .modern-table td:last-child {
          text-align: center !important;
          width: 150px;
        }

        .modern-table tbody td {
          padding: 18px 20px;
          border-bottom: 1px solid #f0f2f0;
          vertical-align: middle;
          transition: background-color 0.25s ease;
        }

        .modern-table tbody tr:hover td {
          background-color: #e9f0eb !important;
        }

        .title-link {
          font-weight: 700;
          color: #1a1a1a;
          text-decoration: none;
        }

        .title-link:hover {
          color: var(--primary);
        }

        .category-tag {
          background: #eef3f0;
          color: #486152;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .date-cell {
          color: #6b7280;
          font-size: 14px;
        }

        .action-cell {
          min-width: 150px;
        }

        .icon-btn {
          background: #1a1a1a;
          color: white;
          border: none;
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .icon-btn:hover,
        .icon-btn:focus {
          background: var(--primary);
          color: white;
          transform: translateY(-1px);
          box-shadow: none !important;
        }

        .icon-btn.danger {
          background: #1a1a1a;
          color: white;
        }

        .icon-btn.danger:hover,
        .icon-btn.danger:focus {
          background: #b3261e;
          color: white;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .badge-new {
          background: rgba(111,143,118,0.18);
          color: var(--primary);
        }

        .badge-progress {
          background: #f3efe4;
          color: #9d7a12;
        }

        .badge-resolved {
          background: #e7f4eb;
          color: #2e7d32;
        }

        .badge-rejected {
          background: #fdeaea;
          color: #b3261e;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 16px;
        }

        .text-sage {
          color: var(--primary) !important;
        }
          [data-theme="dark"] .dashboard-page {
  background: linear-gradient(
    180deg,
    #0f1316 0%,
    #151b1f 100%
  );
}

[data-theme="dark"] .dashboard-title {
  color: #f3f4f6;
}

[data-theme="dark"] .dashboard-subtitle {
  color: #a1a1aa !important;
}

[data-theme="dark"] .stat-dark {
  background: #0f1113;
  color: white;
}

[data-theme="dark"] .stat-sage {
  background: #6f8f76;
  color: white;
}

[data-theme="dark"] .stat-light {
  background: #1a2025;
  color: #f3f4f6;
}

[data-theme="dark"] .stat-white {
  background: #1a2025;
  border: 1px solid #2c343b;
  color: #f3f4f6;
}

[data-theme="dark"] .stat-light .stat-icon,
[data-theme="dark"] .stat-white .stat-icon {
  background: rgba(255,255,255,0.06);
  color: #d1d5db;
}

[data-theme="dark"] .table-card {
  background: #181d21;
  box-shadow: 0 12px 30px rgba(0,0,0,0.35);
}

[data-theme="dark"] .table-header {
  background: #1d2429;
  border-bottom: 1px solid #2b343b;
}

[data-theme="dark"] .table-title {
  color: #f3f4f6;
}

[data-theme="dark"] .table-meta {
  background: #181d21;
  color: #9ca3af;
  border-bottom: 1px solid #2b343b;
}

[data-theme="dark"] .search-icon-wrap {
  background: #11161a;
  border: 1px solid #2b343b;
  border-right: none;
  color: var(--primary);
}

[data-theme="dark"] .search-input {
  background: #11161a !important;
  color: #f3f4f6 !important;
  border: 1px solid #2b343b !important;
  border-left: none !important;
}

[data-theme="dark"] .search-input::placeholder {
  color: #8b949e;
}

[data-theme="dark"] .filter-select {
  background: #11161a !important;
  color: #f3f4f6 !important;
  border: 1px solid #2b343b !important;
}

[data-theme="dark"] .modern-table thead th {
  background: #1d2429;
  color: #9ca3af;
  border-bottom: 1px solid #2b343b;
}

[data-theme="dark"] .modern-table tbody td {
  background: #181d21;
  border-bottom: 1px solid #262e35;
  color: #e5e7eb;
}

[data-theme="dark"] .modern-table tbody tr:hover td {
  background-color: #222a30 !important;
}

[data-theme="dark"] .title-link {
  color: #f3f4f6;
}

[data-theme="dark"] .title-link:hover {
  color: var(--primary);
}

[data-theme="dark"] .category-tag {
  background: #243129;
  color: #b7d0bc;
}

[data-theme="dark"] .date-cell {
  color: #9ca3af;
}

[data-theme="dark"] .empty-state p {
  color: #9ca3af;
}

      `}</style>
    </div>
  );
};

export default Dashboard;
