import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Carousel, Image, Modal } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaUser, FaTrash, FaArrowLeft, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

/* FIX Leaflet icons */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const IssueDetail = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    setLoading(true);

    try {

      const response = await issuesAPI.getById(id);
      setIssue(response.data.issue);

    } catch {

      toast.error('Signalement introuvable');
      navigate('/issues');

    } finally {

      setLoading(false);

    }
  };

const getStatusBadge = (status) => {

const config = {

new: { label: 'New', class:'status-new' },
in_progress: { label: 'In Progress', class:'status-progress' },
resolved: { label: 'Resolved', class:'status-resolved' },
rejected: { label: 'Rejected', class:'status-rejected' },

};

const s = config[status] || config.new;

return (
<span className={`status-pill ${s.class}`}>
{s.label}
</span>
);

};

  const formatDate = (dateString) => {

    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  };

  const canModify = user && (user.id === issue?.user_id || isAdmin);

  if (loading) return <Loading fullPage />;
  if (!issue) return null;

  const hasLocation = issue.latitude && issue.longitude;
  const mapCenter = hasLocation ? [issue.latitude, issue.longitude] : [36.7538, 3.0588];

  return (

    <div className="issue-detail-page min-vh-100 py-5">

      <Container>

        {/* TOP BAR */}

        <div className="d-flex justify-content-between align-items-center mb-4">

          <Button
            as={Link}
            to="/issues"
            variant="link"
            className="back-btn"
          >
            <FaArrowLeft className="me-2" />
            Back to issues
          </Button>

         

        </div>


        <Row className="g-4">

          {/* MAIN COLUMN */}

          <Col lg={8} className="sidebar-col">

            <Card className="modern-card mb-4">

              {/* IMAGE CAROUSEL */}

              {issue.images && issue.images.length > 0 ? (

                <Carousel indicators={issue.images.length > 1}>

                  {issue.images.map((img, idx) => (

                    <Carousel.Item key={img.id}>

                     <div className="carousel-wrapper image-frame">

                      <Image
  src={`http://localhost:5000/uploads/${img.file_path}`}
  alt={`Issue ${idx + 1}`}
  className="carousel-image clickable-image"
  onClick={() => {
    setSelectedImage(`http://localhost:5000/uploads/${img.file_path}`);
    setShowImage(true);
  }}
/>

                      </div>

                    </Carousel.Item>

                  ))}

                </Carousel>

              ) : (

                <div className="no-image">

                  <FaExclamationTriangle size={40} />

                  <p>No image available</p>

                </div>

              )}

              <Card.Body className="p-4 p-md-5">

                {/* TITLE */}

                <div className="mb-4">

                  <h6 className="text-sage small fw-bold text-uppercase mb-2">
                    {issue.category}
                  </h6>

                  <h1 className="issue-title">
                    {issue.title}
                  </h1>

                </div>


                {/* DESCRIPTION */}

                <div className="mb-5">

                  <h6 className="section-title">
                    Description
                  </h6>

                  <p className="issue-description">
                    {issue.description || 'No description provided.'}
                  </p>

                </div>


                {/* MAP */}

                {hasLocation && (

                  <div>

                    <h6 className="section-title">
                      <FaMapMarkerAlt className="me-2 text-sage" />
                      Location
                    </h6>

                    {issue.location_address && (
                      <p className="location-address">
                        {issue.location_address}
                      </p>
                    )}

                    <div className="map-wrapper">

                      <MapContainer
                        center={mapCenter}
                        zoom={16}
                        style={{ height: '100%', width: '100%' }}
                      >

                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={mapCenter}>
                          <Popup>{issue.title}</Popup>
                        </Marker>

                      </MapContainer>

                    </div>

                  </div>

                )}

              </Card.Body>

            </Card>

          </Col>


          {/* SIDEBAR */}

          <Col lg={4}>

            {/* STATUS CARD */}

            <Card className="modern-card mb-4">

              <Card.Header className="status-header">
                Issue Status
              </Card.Header>

              <Card.Body className="text-center p-4">

                <div className="mb-4">

                  <small className="text-muted d-block mb-2">
                    Current Status
                  </small>

                  {getStatusBadge(issue.status)}

                </div>

                <hr />

                <div className="text-start mt-4">

                  <div className="info-row">

                    <div className="info-icon">
                      <FaClock />
                    </div>

                    <div>

                      <small className="info-label">
                        Submitted
                      </small>

                      <span className="info-value">
                        {formatDate(issue.created_at)}
                      </span>

                    </div>

                  </div>

                  <div className="info-row">

                    <div className="info-icon">
                      <FaUser />
                    </div>

                    <div>

                      <small className="info-label">
                        Reporter
                      </small>

                      <span className="info-value">
                        {issue.reporter_name}
                      </span>

                    </div>

                  </div>

                </div>

              </Card.Body>

            </Card>


            {/* ADMIN CARD */}

            {isAdmin && (

              <Card className="modern-card admin-card mb-4">

                <Card.Body className="p-4">

                  <h6 className="fw-bold mb-3">
                    Admin Panel
                  </h6>

                  <Button
                    as={Link}
                    to={`/admin?issue=${issue.id}`}
                    className="admin-btn w-100"
                  >
                    Manage Issue
                    <FaExternalLinkAlt className="ms-2 small" />
                  </Button>

                </Card.Body>

              </Card>

            )}


            {/* ADMIN NOTE */}

            {issue.admin_notes && (isAdmin || user?.id === issue.user_id) && (

              <Card className="modern-card bg-sage text-white mb-4">

                <Card.Body>

                  <h6 className="fw-bold mb-2">
                    Municipality Comment
                  </h6>

                  <p className="small m-0">
                    "{issue.admin_notes}"
                  </p>

                </Card.Body>

              </Card>

            )}

          </Col>

        </Row>

      </Container>


      {/* STYLES */}
<Modal
show={showImage}
onHide={() => setShowImage(false)}
centered
size="lg"
>

<Modal.Body className="p-0">

<img
src={selectedImage}
alt="Issue"
className="w-100"
/>

</Modal.Body>

</Modal>
      <style>{`

.issue-detail-page{

background: linear-gradient(
180deg,
#eef2ef 0%,
#e3ebe6 100%
);

}

/* cards */

.modern-card{

border:none;
border-radius:14px;
box-shadow:0 8px 22px rgba(0,0,0,0.06);
transition:all .25s ease;

}

.modern-card:hover{

transform:translateY(-2px);
box-shadow:0 12px 30px rgba(0,0,0,0.08);

}

/* title */

.issue-title{

font-weight:700;
font-size:32px;
letter-spacing:-0.5px;

}

/* section */

.section-title{

font-weight:600;
font-size:14px;
text-transform:uppercase;
margin-bottom:15px;
border-bottom:1px solid #eee;
padding-bottom:6px;

}

/* description */

.issue-description{

color:#555;
line-height:1.8;
font-size:16px;

}

/* carousel */

.carousel-wrapper{

height:420px;
overflow:hidden;

}

.carousel-image{

width:100%;
height:100%;
object-fit:cover;
transition:transform .4s ease;

}

.carousel:hover img{

transform:scale(1.02);

}

/* no image */

.no-image{

height:250px;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
background:#999;
color:white;

}

/* map */

.map-wrapper{

height:350px;
border-radius:10px;
overflow:hidden;
border:1px solid #e5e7eb;

}

.leaflet-container{

filter:grayscale(.4) contrast(1.1);

}

/* sidebar */

.status-header{

background:#111;
color:white;
text-align:center;
font-weight:600;

}

.status-badge{

padding:8px 16px;
font-size:12px;
letter-spacing:1px;

}

.status-pill{

padding:6px 14px;
border-radius:20px;
font-size:12px;
font-weight:600;

}

.status-new{
background:#eef3f0;
color:#6f8f76;
}

.status-progress{
background:#fff6e5;
color:#c58a00;
}

.status-resolved{
background:#e6f4ea;
color:#2e7d32;
}

.status-rejected{
background:#fdeaea;
color:#c62828;
}
/* info */

.info-row{

display:flex;
align-items:center;
margin-bottom:18px;

}

.info-icon{

width:36px;
height:36px;
background:#f3f5f4;
display:flex;
align-items:center;
justify-content:center;
border-radius:8px;
margin-right:12px;
color:#6f8f76;

}

.info-label{

font-size:11px;
text-transform:uppercase;
color:#999;
display:block;

}

.info-value{

font-weight:600;
font-size:14px;

}

/* buttons */

.back-btn{

text-decoration:none;
color:#333;
font-weight:600;

}

.delete-btn{

border-radius:8px;

}

.admin-btn{

background:#6f8f76;
border:none;
font-weight:600;

}

.admin-btn:hover{

background:#5b7862;

}

/* theme */

.text-sage{

color:#6f8f76;

}

.bg-sage{

background:#6f8f76;

}
.sidebar-col{
position:sticky;
top:100px;
height:fit-content;}
.carsousel-image{
width:100%;
height:100%;
object-fit:cover;
transition:transform .5s ease;
}
.carousel-wrapper:hover .carousel-image{
transform:scale(1.04);
      }
.image-frame{

border:1px solid #e4e7e5;
border-radius:12px;
overflow:hidden;
box-shadow:0 6px 18px rgba(0,0,0,0.06);

}

.clickable-image{

cursor:pointer;

}

.clickable-image:hover{

opacity:0.95;

}
[data-theme="dark"] .issue-detail-page {
  background: linear-gradient(
    180deg,
    #0f1316 0%,
    #151b1f 100%
  );
}

[data-theme="dark"] .modern-card {
  background: #181d21;
  box-shadow: 0 8px 22px rgba(0,0,0,0.28);
}

[data-theme="dark"] .issue-title {
  color: #f3f4f6;
}

[data-theme="dark"] .section-title {
  color: #e5e7eb;
  border-bottom: 1px solid #2a3137;
}

[data-theme="dark"] .issue-description {
  color: #a1a1aa;
}

[data-theme="dark"] .no-image {
  background: #2b3137;
  color: #f3f4f6;
}

[data-theme="dark"] .map-wrapper {
  border: 1px solid #2a3137;
}

[data-theme="dark"] .status-header {
  background: #0f1113;
  color: white;
}

[data-theme="dark"] .info-icon {
  background: #232a2f;
  color: #8cab92;
}

[data-theme="dark"] .info-label {
  color: #9ca3af;
}

[data-theme="dark"] .info-value {
  color: #f3f4f6;
}

[data-theme="dark"] .back-btn {
  color: #e5e7eb;
}

[data-theme="dark"] .back-btn:hover {
  color: #8cab92;
}

[data-theme="dark"] .image-frame {
  border: 1px solid #2a3137;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}

[data-theme="dark"] .text-sage {
  color: #8cab92 !important;
}

[data-theme="dark"] .bg-sage {
  background: #6f8f76 !important;
}

.
`}</style>

    </div>

  );

};

export default IssueDetail;