import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import {
  FaEdit,
  FaUserCog,
  FaSave,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaEye,
  FaChartPie,
  FaLayerGroup,
  FaFlag
} from 'react-icons/fa';
import { adminAPI, issuesAPI } from '../services/api';
import { toast } from 'react-toastify';


const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  });


  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalData, setModalData] = useState({
    status: '',
    priority: '',
    notes: ''
  });


  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchStatuses(), fetchPriorities()]);
      await fetchIssues();
      setLoading(false);
    };


    init();
  }, [filters]);


  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };


  const fetchStatuses = async () => {
    try {
      const res = await issuesAPI.getStatuses();
      const raw = Array.isArray(res.data) ? res.data : res.data.statuses || [];
      setStatuses(
        raw.map((s) =>
          typeof s === 'string'
            ? { value: s, label: s.replace('_', ' ').toUpperCase() }
            : s
        )
      );
    } catch (e) {
      console.error(e);
    }
  };


  const fetchPriorities = async () => {
    try {
      const res = await issuesAPI.getPriorities();
      const raw = Array.isArray(res.data) ? res.data : res.data.priorities || [];
      setPriorities(
        raw.map((p) =>
          typeof p === 'string'
            ? { value: p, label: p.toUpperCase() }
            : p
        )
      );
    } catch (e) {
      console.error(e);
    }
  };


  const fetchIssues = async (page = 1) => {
    try {
      const res = await adminAPI.getAllIssues({
        page,
        per_page: 10,
        ...filters
      });
      setIssues(res.data.issues || []);
    } catch (e) {
      toast.error('Error loading issues');
    }
  };


  const openModal = (issue) => {
    setSelectedIssue(issue);
    setModalData({
      status: issue.status,
      priority: issue.priority,
      notes: issue.admin_notes || ''
    });
    setShowModal(true);
  };


  const handleModalSave = async () => {
    if (!selectedIssue) return;


    try {
      await Promise.all([
        adminAPI.updateIssueStatus(selectedIssue.id, { status: modalData.status }),
        adminAPI.updateIssuePriority(selectedIssue.id, { priority: modalData.priority }),
        adminAPI.updateAdminNotes(selectedIssue.id, { notes: modalData.notes })
      ]);


      toast.success('Updated successfully');
      setShowModal(false);
      fetchStats();
      fetchIssues();
    } catch (e) {
      toast.error('Update failed');
    }
  };


  const filteredIssues = useMemo(() => {
    if (!searchTerm.trim()) return issues;


    return issues.filter((issue) => {
      const title = issue.title?.toLowerCase() || '';
      const id = String(issue.id || '');
      const priority = issue.priority?.toLowerCase() || '';
      const status = issue.status?.toLowerCase() || '';
      const q = searchTerm.toLowerCase();


      return (
        title.includes(q) ||
        id.includes(q) ||
        priority.includes(q) ||
        status.includes(q)
      );
    });
  }, [issues, searchTerm]);


  const getStatusBadge = (status) => {
    const map = {
      new: {
        className: 'status-pill status-new',
        label: 'New'
      },
      in_progress: {
        className: 'status-pill status-progress',
        label: 'In Progress'
      },
      resolved: {
        className: 'status-pill status-resolved',
        label: 'Resolved'
      },
      rejected: {
        className: 'status-pill status-rejected',
        label: 'Rejected'
      }
    };


    const current = map[status] || map.new;
    return <span className={current.className}>{current.label}</span>;
  };


  const getPriorityBadge = (priority) => {
    const map = {
      low: {
        className: 'priority-pill priority-low',
        label: 'Low'
      },
      medium: {
        className: 'priority-pill priority-medium',
        label: 'Medium'
      },
      high: {
        className: 'priority-pill priority-high',
        label: 'High'
      },
      urgent: {
        className: 'priority-pill priority-urgent',
        label: 'Urgent'
      }
    };


    const current = map[priority] || map.medium;
    return <span className={current.className}>{current.label}</span>;
  };


  const getCategoryLabel = (category) => {
    const categories = {
      roads: 'Roads',
      lighting: 'Lighting',
      sanitation: 'Sanitation',
      environment: 'Environment',
      water: 'Water',
      security: 'Security',
      parking: 'Parking',
      others: 'Others'
    };
    return categories[category] || category || 'Unspecified';
  };


  const categoryData = useMemo(() => {
    const counts = {};


    filteredIssues.forEach((issue) => {
      const key = issue.category || 'others';
      counts[key] = (counts[key] || 0) + 1;
    });


    const entries = Object.entries(counts)
      .map(([key, value]) => ({
        key,
        label: getCategoryLabel(key),
        value
      }))
      .sort((a, b) => b.value - a.value);


    return entries;
  }, [filteredIssues]);


  const totalCategoryReports = categoryData.reduce((sum, item) => sum + item.value, 0);
  const topCategory = categoryData[0];
  const topCategoryPercent = totalCategoryReports
    ? Math.round((topCategory?.value / totalCategoryReports) * 100)
    : 0;


  const resolvedCount = filteredIssues.filter((issue) => issue.status === 'resolved').length;
  const urgentCount = filteredIssues.filter((issue) => issue.priority === 'urgent').length;
  const pendingCount = filteredIssues.filter((issue) => issue.status === 'new').length;


  if (loading && !stats) {
    return (
      <div className="admin-loading">
        <Spinner animation="border" />
      </div>
    );
  }


  return (
    <div className="admin-dashboard-page">
      <Container>
        <div className="admin-hero">
          <div>
            <p className="admin-kicker">Administration</p>
            <h1 className="admin-title">
              <FaUserCog className="me-2" />
              Admin Dashboard
            </h1>
            <p className="admin-subtitle">
              Monitor reports, manage priorities, and keep everything under control.
            </p>
          </div>
        </div>


       
             


        {/* NEW SUMMARY BAR */}
        <Card className="insights-card modern-insights mb-4">
          <Card.Body>
            <Row className="align-items-center g-4">
              <Col lg={4}>
                <div className="insight-circle-wrap">
                  <div
                    className="insight-circle"
                    style={{
                      background: `conic-gradient(#778a77 0 ${topCategoryPercent}%, #e7ece8 ${topCategoryPercent}% 100%)`
                    }}
                  >
                 <div className="insight-circle-inner">
  <span className="insight-circle-number">{topCategoryPercent}%</span>
  <span className="insight-circle-label">Top category</span>
  <span className="insight-circle-sub">
    {topCategory ? topCategory.label : 'No data'}
  </span>
</div>
                  </div>
                </div>
              </Col>


              <Col lg={8}>
                <div className="insight-header">
                  <p className="insight-kicker">Report insights</p>
                 <h4 className="insight-title">Report overview & category breakdown</h4>
                </div>


               


                <Row className="g-3 mb-3">
  <Col md={6} xl={3}>
    <div className="insight-mini">
      <span className="insight-mini-icon">
        <FaClipboardList />
      </span>
      <div>
        <small>Total reports</small>
        <strong>{filteredIssues.length}</strong>
      </div>
    </div>
  </Col>


  <Col md={6} xl={3}>
    <div className="insight-mini">
      <span className="insight-mini-icon">
        <FaCheckCircle />
      </span>
      <div>
        <small>Resolved reports</small>
        <strong>{resolvedCount}</strong>
      </div>
    </div>
  </Col>


  <Col md={6} xl={3}>
    <div className="insight-mini">
      <span className="insight-mini-icon">
        <FaClock />
      </span>
      <div>
        <small>Pending reports</small>
        <strong>{pendingCount}</strong>
      </div>
    </div>
  </Col>


  <Col md={6} xl={3}>
    <div className="insight-mini">
      <span className="insight-mini-icon">
        <FaLayerGroup />
      </span>
      <div>
        <small>Top category</small>
        <strong>{topCategory ? topCategory.label : 'No data'}</strong>
      </div>
    </div>
  </Col>
</Row>


                <div className="category-bars">
                  {categoryData.length === 0 ? (
                    <p className="category-empty mb-0">No category data available for the current list.</p>
                  ) : (
                    categoryData.slice(0, 4).map((item) => {
                      const percent = totalCategoryReports
                        ? Math.round((item.value / totalCategoryReports) * 100)
                        : 0;


                      return (
                        <div className="category-bar-item" key={item.key}>
                          <div className="category-bar-top">
                            <span>{item.label}</span>
                            <span>{item.value} report{item.value > 1 ? 's' : ''}</span>
                          </div>
                          <div className="category-bar-track">
                            <div
                              className="category-bar-fill"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>


                <div className="insight-footer-note">
                  Pending now: <strong>{pendingCount}</strong> · Based on the currently loaded reports.
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>


        <Card className="filters-card mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col lg={4} md={6}>
                <Form.Label className="filter-label">Status</Form.Label>
                <Form.Select
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.value
                    })
                  }
                >
                  <option value="">All Status</option>
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>


              <Col lg={4} md={6}>
                <Form.Label className="filter-label">Priority</Form.Label>
                <Form.Select
                  className="filter-select"
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priority: e.target.value
                    })
                  }
                >
                  <option value="">All Priority</option>
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>


              <Col lg={4} md={12}>
                <Form.Label className="filter-label">Search</Form.Label>
                <InputGroup className="search-group">
                  <InputGroup.Text className="search-icon-wrap">
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by title, id, status..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>


        <div className="table-meta">
          <div className="table-meta-left">
            Showing <strong>{filteredIssues.length}</strong> issue{filteredIssues.length !== 1 ? 's' : ''}
          </div>
          <div className="table-meta-right">
            Updated just now
          </div>
        </div>


        <Card className="issues-table-card">
          <Card.Body className="p-0">
            <Table responsive hover className="modern-admin-table mb-0">
              <thead>
                <tr>
                  <th className="ps-4">ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>


              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No matching issues found.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td className="ps-4 issue-id">#{issue.id}</td>
                      <td className="issue-title-cell">{issue.title}</td>
                      <td>{getPriorityBadge(issue.priority)}</td>
                      <td>{getStatusBadge(issue.status)}</td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end align-items-center gap-2">
                          <Button
                            as={Link}
                            to={`/issues/${issue.id}`}
                            className="edit-btn"
                            title="View Details"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            className="edit-btn"
                            onClick={() => openModal(issue)}
                            title="Edit Status & Priority"
                          >
                            <FaEdit />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>


      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
      >
        <Modal.Body className="admin-modal-body">
          <h4 className="modal-title">Edit Issue #{selectedIssue?.id}</h4>


          <Form.Group className="mb-3">
            <Form.Label className="modal-label">Status</Form.Label>
            <Form.Select
              className="modal-select"
              value={modalData.status}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  status: e.target.value
                })
              }
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>


          <Form.Group className="mb-3">
            <Form.Label className="modal-label">Priority</Form.Label>
            <Form.Select
              className="modal-select"
              value={modalData.priority}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  priority: e.target.value
                })
              }
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>


          <Form.Group className="mb-4">
            <Form.Label className="modal-label">Admin Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              className="modal-textarea"
              value={modalData.notes}
              onChange={(e) =>
                setModalData({
                  ...modalData,
                  notes: e.target.value
                })
              }
            />
          </Form.Group>


          <Button className="save-btn w-100" onClick={handleModalSave}>
            <FaSave className="me-2" />
            Save Changes
          </Button>
        </Modal.Body>
      </Modal>


      <style>{`
        .admin-dashboard-page {
          min-height: 100vh;
          padding: 42px 0;
          background: linear-gradient(
            180deg,
            #eef2ef 0%,
            #e3ebe6 100%
          );
        }


        .admin-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            180deg,
            #eef2ef 0%,
            #e3ebe6 100%
          );
        }


        .admin-hero {
          margin-bottom: 28px;
        }


        .admin-kicker {
          margin-bottom: 6px;
          color: #778a77;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
        }


        .admin-title {
          margin: 0;
          font-size: 2.2rem;
          font-weight: 800;
          color: #161616;
          display: flex;
          align-items: center;
        }


        .admin-subtitle {
          margin-top: 10px;
          margin-bottom: 0;
          color: #6b7280;
          max-width: 650px;
        }




     


       


     


   .premium-insights {
  border: none;
  border-radius: 28px;
  padding: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f7faf8 100%);
  box-shadow: 0 18px 45px rgba(0,0,0,0.06);
  overflow: hidden;
}


.insight-circle-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
}


.insight-circle {
  width: 210px;
  height: 210px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 10px 30px rgba(119,138,119,0.18);
}


.insight-circle-inner {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(255,255,255,0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px #edf1ed;
}


.insight-circle-number {
  font-size: 2.4rem;
  font-weight: 800;
  color: #171717;
  line-height: 1;
}


.insight-circle-label {
  margin-top: 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  color: #6b7280;
  font-weight: 800;
  text-align: center;
}


.insight-circle-sub {
  margin-top: 6px;
  font-size: 0.9rem;
  color: #778a77;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
}


.insight-header {
  margin-bottom: 18px;
}


.insight-kicker {
  margin-bottom: 4px;
  color: #778a77;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: 800;
}


.insight-title {
  margin: 0;
  font-weight: 800;
  font-size: 2rem;
  line-height: 1.15;
  color: #171717;
}


.insight-mini {
  min-height: 96px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.85);
  border: 1px solid #e8eeea;
  box-shadow: 0 8px 20px rgba(0,0,0,0.03);
  transition: all 0.25s ease;
}


.insight-mini:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.05);
}


.insight-mini-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(119,138,119,0.14);
  color: #778a77;
  flex-shrink: 0;
  font-size: 1rem;
}


.insight-mini small {
  display: block;
  color: #6b7280;
  font-size: 11px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  font-weight: 800;
}


.insight-mini strong {
  display: block;
  color: #171717;
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.2;
}


.category-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}


.category-bar-item {
  width: 100%;
}


.category-bar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: #374151;
  font-weight: 700;
}


.category-bar-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #ecf1ed;
  overflow: hidden;
}


.category-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6f8f76 0%, #9db3a1 100%);
  box-shadow: 0 4px 12px rgba(111,143,118,0.25);
}


.insight-footer-note {
  margin-top: 18px;
  color: #6b7280;
  font-size: 0.93rem;
  font-weight: 500;
}


       
       










        .category-empty {
          color: #6b7280;
        }


        .filter-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          margin-bottom: 8px;
        }


        .filter-select,
        .modal-select,
        .modal-textarea,
        .search-input {
          border-radius: 12px !important;
          border: 1px solid #dde4de !important;
          padding: 12px 14px !important;
          box-shadow: none !important;
        }


        .filter-select:focus,
        .modal-select:focus,
        .modal-textarea:focus,
        .search-input:focus {
          border-color: #778a77 !important;
        }


        .search-group {
          border-radius: 12px;
          overflow: hidden;
        }


        .search-icon-wrap {
          background: white;
          border: 1px solid #dde4de;
          border-right: none;
          color: #778a77;
        }


        .search-input {
          border-left: none !important;
        }


        .table-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 0 4px;
          font-size: 0.9rem;
          color: #6b7280;
        }


        .table-meta-left strong {
          color: #171717;
        }


        .modern-admin-table {
          border-collapse: separate;
          border-spacing: 0;
        }


        .modern-admin-table thead th {
          background: #f8faf8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          border-bottom: 1px solid #edf1ed;
          padding-top: 16px;
          padding-bottom: 16px;
        }


        .modern-admin-table tbody td {
          padding-top: 18px;
          padding-bottom: 18px;
          vertical-align: middle;
          border-bottom: 1px solid #f0f2f0;
        }


        .modern-admin-table tbody tr:hover {
          background: #fafcfb;
        }


        .issue-id {
          color: #6b7280;
          font-weight: 600;
        }


        .issue-title-cell {
          font-weight: 700;
          color: #1a1a1a;
        }


        .status-pill,
        .priority-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2px;
          text-transform: none;
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


        .priority-low {
          background: #efefef;
          color: #666666;
        }


        .priority-medium {
          background: #e9f0eb;
          color: #5f7f67;
        }


        .priority-high {
          background: #fff1df;
          color: #d97706;
        }


        .priority-urgent {
          background: #fdeaea;
          color: #b3261e;
        }


        .edit-btn {
          background: #171717 !important;
          border: none !important;
          color: white !important;
          border-radius: 10px;
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: none !important;
        }


        .edit-btn:hover,
        .edit-btn:focus,
        .edit-btn:active {
          background: #778a77 !important;
          color: white !important;
          box-shadow: none !important;
        }


        .admin-modal-body {
          padding: 24px;
        }


        .modal-title {
          font-weight: 800;
          margin-bottom: 20px;
          color: #1a1a1a;
        }


        .modal-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
          margin-bottom: 8px;
        }


        .save-btn {
          background: #171717 !important;
          border: none !important;
          border-radius: 12px;
          padding: 12px 16px;
          font-weight: 700;
          box-shadow: none !important;
          transition: all 0.2s ease;
        }


        .save-btn:hover,
        .save-btn:focus,
        .save-btn:active {
          background: #778a77 !important;
          color: white !important;
          box-shadow: none !important;
        }


        [data-theme="dark"] .admin-dashboard-page,
        [data-theme="dark"] .admin-loading {
          background: linear-gradient(
            180deg,
            #0f1316 0%,
            #151b1f 100%
          );
        }


        [data-theme="dark"] .admin-title,
        [data-theme="dark"] .insight-title {
          color: #f3f4f6;
        }


        [data-theme="dark"] .admin-subtitle,
        [data-theme="dark"] .insight-footer-note,
        [data-theme="dark"] .category-empty {
          color: #a1a1aa;
        }


       
         


        [data-theme="dark"] .icon-sage,
        [data-theme="dark"] .insight-mini-icon {
          background: rgba(140,171,146,0.12);
          color: #9fc0a7;
        }


        [data-theme="dark"] .insights-card,
        [data-theme="dark"] .filters-card,
        [data-theme="dark"] .issues-table-card {
          background: #181d21;
          box-shadow: 0 12px 30px rgba(0,0,0,0.28);
        }


        [data-theme="dark"] .insight-circle {
          background: conic-gradient(#8cab92 0 ${topCategoryPercent}%, #2b343b ${topCategoryPercent}% 100%) !important;
        }


        [data-theme="dark"] .insight-circle-inner {
          background: #11161a;
          box-shadow: inset 0 0 0 1px #2b343b;
        }


        [data-theme="dark"] .insight-circle-number {
          color: #f3f4f6;
        }


        [data-theme="dark"] .insight-circle-label,
        [data-theme="dark"] .insight-mini small,
        [data-theme="dark"] .filter-label,
        [data-theme="dark"] .modal-label {
          color: #9ca3af;
        }


        [data-theme="dark"] .insight-mini {
          background: #11161a;
          border: 1px solid #2b343b;
        }


        [data-theme="dark"] .insight-mini strong,
        [data-theme="dark"] .category-bar-top {
          color: #f3f4f6;
        }


        [data-theme="dark"] .category-bar-track {
          background: #2b343b;
        }


        [data-theme="dark"] .category-bar-fill {
          background: linear-gradient(90deg, #8cab92, #6f8f76);
        }


        [data-theme="dark"] .filter-select,
        [data-theme="dark"] .modal-select,
        [data-theme="dark"] .modal-textarea,
        [data-theme="dark"] .search-input {
          background: #11161a !important;
          color: #f3f4f6 !important;
          border: 1px solid #2b343b !important;
        }


        [data-theme="dark"] .search-icon-wrap {
          background: #11161a;
          border: 1px solid #2b343b;
          border-right: none;
          color: #8cab92;
        }


        [data-theme="dark"] .table-meta {
          color: #9ca3af;
        }


        [data-theme="dark"] .table-meta-left strong {
          color: #f3f4f6;
        }


        [data-theme="dark"] .modern-admin-table thead th {
          background: #1d2429;
          color: #9ca3af;
          border-bottom: 1px solid #2b343b;
        }


        [data-theme="dark"] .modern-admin-table tbody td {
          background: #181d21;
          color: #e5e7eb;
          border-bottom: 1px solid #262e35;
        }


        [data-theme="dark"] .modern-admin-table tbody tr:hover td {
          background: #222a30;
        }


        [data-theme="dark"] .issue-id {
          color: #9ca3af;
        }


        [data-theme="dark"] .issue-title-cell {
          color: #f3f4f6;
        }


        [data-theme="dark"] .priority-low {
          background: #2c3136;
          color: #c3c7cc;
        }


        [data-theme="dark"] .priority-medium {
          background: #243129;
          color: #b7d0bc;
        }


        [data-theme="dark"] .priority-high {
          background: #3a2d1f;
          color: #f3c983;
        }


        [data-theme="dark"] .priority-urgent {
          background: #3a2020;
          color: #f2a3a3;
        }


        [data-theme="dark"] .admin-modal-body {
          background: #181d21;
        }


        [data-theme="dark"] .modal-title {
          color: #f3f4f6;
        }
          .insight-circle-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #778a77;
  font-weight: 700;
  text-align: center;
  max-width: 80px;
  line-height: 1.3;
}


.insight-mini {
  min-height: 88px;
}


.insight-mini strong {
  display: block;
  font-size: 1.05rem;
  margin-top: 2px;
}
  [data-theme="dark"] .insight-circle-sub {
  color: #9fc0a7;
}
 
      `}</style>
    </div>
  );
};


export default AdminDashboard;



