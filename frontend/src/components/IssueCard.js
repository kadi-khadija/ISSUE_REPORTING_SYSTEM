import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

const IssueCard = ({ issue }) => {
  const getCategoryLabel = (category) => {
    const categories = {
      roads: 'Roads & Routes',
      lighting: 'Public Lighting',
      sanitation: 'Sanitation',
      environment: 'Environment',
    };
    return categories[category] || 'General Issue';
  };

  const thumbnailImage = issue.images && issue.images.length > 0
    ? `http://localhost:5000/uploads/${issue.images[0].file_path}`
    : 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <Card className="issue-card h-100 border-0">
      {/* IMAGE */}
      <div className="issue-image-container">
        <Card.Img
          src={thumbnailImage}
          alt={issue.title}
          className="issue-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=Error';
          }}
        />

        {/* OVERLAY */}
        <div className="issue-overlay">
          <Link to={`/issues/${issue.id}`} className="overlay-btn">
            View report
          </Link>
        </div>
      </div>

      {/* BODY */}
      <Card.Body className="issue-body d-flex flex-column">
        {/* CATEGORY */}
        <span className="category-pill">
          {getCategoryLabel(issue.category)}
        </span>

        {/* TITLE */}
        <Card.Title className="issue-title">
          {issue.title}
        </Card.Title>

        {/* LOCATION */}
        {issue.location_address && (
          <div className="issue-location">
            <FaMapMarkerAlt className="me-2" />
            {issue.location_address}
          </div>
        )}

        {/* FOOTER LINK */}
        <Link
          to={`/issues/${issue.id}`}
          className="issue-link mt-auto"
        >
          <span>View details</span>
          <FaArrowRight className="ms-2" size={12} />
        </Link>
      </Card.Body>

      <style>{`
        /* CARD */
        .issue-card {
          border-radius: 18px;
          overflow: hidden;
          background: white;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .issue-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
        }

        /* IMAGE */
        .issue-image-container {
          position: relative;
          overflow: hidden;
          height: 210px;
        }

        .issue-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .issue-card:hover .issue-image {
          transform: scale(1.08);
        }

        /* OVERLAY */
        .issue-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .issue-card:hover .issue-overlay {
          opacity: 1;
        }

        .overlay-btn {
          background: white;
          color: #111;
          padding: 10px 18px;
          border-radius: 999px;
          font-weight: 700;
          text-decoration: none;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .overlay-btn:hover {
          background: var(--primary);
          color: white;
        }

        /* BODY */
        .issue-body {
          padding: 20px;
        }

        /* CATEGORY */
        .category-pill {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          background: #eef3f0;
          color: #486152;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        /* TITLE */
        .issue-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #171717;
          margin-bottom: 10px;
          line-height: 1.4;
        }

        /* LOCATION */
        .issue-location {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
        }

        /* LINK */
        .issue-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
          color: #171717;
          padding-top: 12px;
          border-top: 1px solid #f0f2f0;
          transition: all 0.2s ease;
        }

        .issue-link:hover {
          color: var(--primary);
        }

        /* DARK MODE */
        [data-theme="dark"] .issue-card {
          background: #181d21;
          box-shadow: 0 12px 30px rgba(0,0,0,0.28);
        }

        [data-theme="dark"] .issue-card:hover {
          box-shadow: 0 18px 40px rgba(0,0,0,0.35);
        }

        [data-theme="dark"] .issue-overlay {
          background: rgba(0,0,0,0.48);
        }

        [data-theme="dark"] .overlay-btn {
          background: #0f1113;
          color: #f3f4f6;
        }

        [data-theme="dark"] .overlay-btn:hover {
          background: var(--primary);
          color: white;
        }

        [data-theme="dark"] .category-pill {
          background: #243129;
          color: #b7d0bc;
        }

        [data-theme="dark"] .issue-title {
          color: #f3f4f6;
        }

        [data-theme="dark"] .issue-location {
          color: #a1a1aa;
        }

        [data-theme="dark"] .issue-link {
          color: #f3f4f6;
          border-top: 1px solid #2a3137;
        }

        [data-theme="dark"] .issue-link:hover {
          color: var(--primary);
        }
      `}</style>
    </Card>
  );
};

export default IssueCard;
