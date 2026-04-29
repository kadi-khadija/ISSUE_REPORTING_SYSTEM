import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { FaMapMarkerAlt, FaCamera, FaUpload, FaTimes, FaArrowLeft, FaArrowRight, FaLocationArrow } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { toast } from 'react-toastify';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPosition([lat, lng]);
      if (onLocationSelected) {
        onLocationSelected(lat, lng);
      }
    },
  });

  return position ? <Marker position={position} /> : null;
};

const ReportIssue = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [position, setPosition] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'others',
    zipcode: '35059',
    location_address: '',
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});

  const mapCenter = [36.7538, 3.0588];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await issuesAPI.getCategories();
      setCategories(response.data.categories);
    } catch {
      console.log('failed to load categories');
    }
  };

  const MapUpdater = ({ position }) => {
    const map = useMapEvents({});
    useEffect(() => {
      if (position) {
        map.flyTo(position, 16);
      }
    }, [position, map]);
    return null;
  };

  const handleLocationSelected = async (lat, lng) => {
    try {
      toast.info('Auto-detecting location details...', { autoClose: 1500 });
      
      // Use Nominatim for detailed street names (OpenStreetMap)
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`);
      const data = await response.json();
      
      if (data && data.address) {
        // Collect detailed street/road address
        const road = data.address.road || data.address.pedestrian || '';
        const suburb = data.address.suburb || data.address.residential || data.address.neighbourhood || '';
        
        const addrParts = [road, suburb].filter(Boolean);
        const autoAddress = addrParts.length > 0 ? addrParts.join(', ') : data.display_name.split(',')[0];
        
        const postcode = data.address.postcode;
        
        // Dictionary for smart commune detection even if postcode is wrong or missing
        const nameToZip = {
          "boumerdes": "35059", "boumerdès": "35059",
          "corso": "35014",
          "tidjelabine": "35021",
          "boudouaou": "35003",
          "boudouaou el bahri": "35037",
          "zemmouri": "35012",
          "dellys": "35004",
          "djinet": "35210",
          "leghata": "35026",
          "afir": "35110",
          "ouled moussa": "35011",
          "hammadi": "35015",
          "khemis el khechna": "35010",
          "ouled hedadj": "35052",
          "thenia": "35005", "thénia": "35005",
          "larbatache": "35017",
          "bouzegza keddara": "35038",
          "ammal": "35031",
          "beni amrane": "35006",
          "souk el had": "35480",
          "isser": "35230", "issers": "35230",
          "si mustapha": "35028",
          "timezrit": "35027",
          "chabet el ameur": "35008",
          "bordj menaiel": "35200", "bordj ménaïel": "35200",
          "naciria": "35018",
          "ouled aissa": "35050", "ouled aïssa": "35050",
          "baghlia": "35130",
          "sidi daoud": "35150",
          "taourga": "35140",
          "ben choud": "35033"
        };
        
        const validZipcodes = Object.values(nameToZip);
        let detectedZip = prev => prev.zipcode; // function fallback
        
        // 1. Try exact postcode
        if (postcode && validZipcodes.includes(postcode)) {
            detectedZip = postcode;
        } else {
            // 2. Smart Name Match against Town/City/Village from OSM
            const fieldsToCheck = [data.address?.town, data.address?.village, data.address?.city, data.address?.county, data.address?.suburb, data.address?.municipality];
            for (let field of fieldsToCheck) {
                if (field) {
                    const cleanField = field.toLowerCase().trim();
                    
                    // Direct Match
                    if (nameToZip[cleanField]) {
                        detectedZip = nameToZip[cleanField];
                        break;
                    }
                    
                    // Partial Match
                    for (const [name, zip] of Object.entries(nameToZip)) {
                        if (cleanField.includes(name)) {
                            detectedZip = zip;
                            break;
                        }
                    }
                }
            }
        }
        
        setFormData(prev => ({
            ...prev,
            location_address: autoAddress ? `${autoAddress}` : prev.location_address,
            zipcode: (typeof detectedZip === 'string') ? detectedZip : prev.zipcode
        }));
      }
    } catch (e) {
      console.error('Reverse geocoding failed', e);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.info('Detecting your current location...', { autoClose: 2000 });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        handleLocationSelected(lat, lng);
      },
      () => {
        toast.error('Failed to get your location. Please check permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > 5) {
      toast.warning('Maximum 5 images');
      return;
    }

    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [
          ...prev,
          { preview: reader.result, name: file.name }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description is too short';
    }

    if (!formData.category) {
      newErrors.category = 'Please choose a category';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      if (position) {
        submitData.append('latitude', position[0]);
        submitData.append('longitude', position[1]);
      }

      images.forEach((img) => {
        submitData.append('images', img);
      });

      const response = await issuesAPI.create(submitData);

      toast.success('Issue reported successfully');
      navigate(`/issues/${response.data.issue.id}`);
    } catch {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page min-vh-100 py-5">
      <Container>
        <Row className="justify-content-center">
          <Col lg={11}>
            {/* HEADER */}
            <div className="report-header d-flex justify-content-between align-items-end mb-5 flex-wrap gap-3">
              <div>
                <p className="report-kicker mb-1">Citizen Report</p>
                <h2 className="page-title mb-2">Report an Issue</h2>
                <p className="page-subtitle mb-0">
                  Help improve your city by submitting a clear and accurate report.
                </p>
              </div>

              <Button
                variant="outline-dark"
                className="back-btn"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Back
              </Button>
            </div>

            <Form onSubmit={handleSubmit}>
              <Row className="g-4">
                {/* LEFT SIDE */}
                <Col lg={7}>
                  <Card className="modern-card form-card p-4 p-md-5 h-100">
                    <div className="section-head mb-4">
                      <h5 className="section-title mb-1">Issue Information</h5>
                      <p className="section-subtitle mb-0">
                        Provide the main details of the issue you want to report.
                      </p>
                    </div>

                    <Form.Group className="mb-4">
                      <Form.Label className="label">Issue Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Describe the problem..."
                        className={`input-modern ${errors.title ? 'is-invalid' : ''}`}
                      />
                      {errors.title && <div className="field-error mt-2">{errors.title}</div>}
                    </Form.Group>

                    <Row className="mb-4">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="label">Category</Form.Label>
                          <Form.Select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`input-modern ${errors.category ? 'is-invalid' : ''}`}
                          >
                            {categories.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </Form.Select>
                          {errors.category && <div className="field-error mt-2">{errors.category}</div>}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="label">Commune</Form.Label>
                          <Form.Select
                            name="zipcode"
                            value={formData.zipcode}
                            onChange={handleChange}
                            className="input-modern"
                          >
                            <option value="35059">Boumerdès</option>
                            <option value="35014">Corso</option>
                            <option value="35021">Tidjelabine</option>
                            <option value="35003">Boudouaou / El Kharrouba</option>
                            <option value="35037">Boudouaou El Bahri</option>
                            <option value="35012">Zemmouri</option>
                            <option value="35004">Dellys</option>
                            <option value="35210">Djinet</option>
                            <option value="35026">Leghata</option>
                            <option value="35110">Afir</option>
                            <option value="35011">Ouled Moussa</option>
                            <option value="35015">Hammadi</option>
                            <option value="35010">Khemis El Khechna</option>
                            <option value="35052">Ouled Hedadj</option>
                            <option value="35005">Thenia</option>
                            <option value="35017">Larbatache</option>
                            <option value="35038">Bouzegza Keddara</option>
                            <option value="35031">Ammal</option>
                            <option value="35006">Beni Amrane</option>
                            <option value="35480">Souk El Had</option>
                            <option value="35230">Isser</option>
                            <option value="35028">Si Mustapha</option>
                            <option value="35027">Timezrit</option>
                            <option value="35008">Chabet El Ameur</option>
                            <option value="35200">Bordj Menaiel</option>
                            <option value="35018">Naciria</option>
                            <option value="35050">Ouled Aissa</option>
                            <option value="35130">Baghlia</option>
                            <option value="35150">Sidi Daoud</option>
                            <option value="35140">Taourga</option>
                            <option value="35033">Ben Choud</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label className="label">Address Details</Form.Label>
                      <Form.Control
                        type="text"
                        name="location_address"
                        value={formData.location_address}
                        onChange={handleChange}
                        placeholder="Street, district..."
                        className="input-modern"
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label className="label">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={7}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Explain the problem clearly..."
                        className={`input-modern textarea-modern ${errors.description ? 'is-invalid' : ''}`}
                      />
                      {errors.description && (
                        <div className="field-error mt-2">{errors.description}</div>
                      )}
                    </Form.Group>
                  </Card>
                </Col>

                {/* RIGHT SIDE */}
                <Col lg={5}>
                  <div className="d-flex flex-column gap-4 h-100">
                    {/* MAP */}
                    <Card className="modern-card map-card overflow-hidden" style={{ position: 'relative' }}>
                      <div className="card-topbar d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center gap-2">
                          <span className="topbar-icon">
                            <FaMapMarkerAlt />
                          </span>
                          <span>Pin Location</span>
                        </div>
                        
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="locate-me-btn d-flex align-items-center gap-1"
                          onClick={getUserLocation}
                        >
                          <FaLocationArrow size={12} />
                          Locate Me
                        </Button>
                      </div>

                      <div className="map-note">
                        Click on the map to select the exact location.
                      </div>
                      
                      <MapContainer center={mapCenter} zoom={13} style={{ height: '270px' }}>
                        {position && <MapUpdater position={position} />}
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPicker 
                           position={position} 
                           setPosition={setPosition} 
                           onLocationSelected={handleLocationSelected} 
                        />
                      </MapContainer>
                    </Card>

                    {/* PHOTOS */}
                    <Card className="modern-card p-4 flex-grow-1 upload-card">
                      <div className="section-head mb-3">
                        <h5 className="section-title mb-1">Evidence Photos</h5>
                        <p className="section-subtitle mb-0">
                          Upload up to 5 photos to support your report.
                        </p>
                      </div>

                      <div
                        className="upload-box"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="upload-icon-wrap">
                          <FaUpload size={18} />
                        </div>

                        <h6 className="upload-title mb-2">Upload images</h6>
                        <p className="upload-text mb-0">
                          Click here to select photos from your device
                        </p>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          accept="image/*"
                          multiple
                          hidden
                        />
                      </div>

                      {imagePreviews.length > 0 && (
                        <div className="preview-grid">
                          {imagePreviews.map((img, index) => (
                            <div key={index} className="preview-img">
                              <img src={img.preview} alt="preview" />

                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="submit-btn mt-4"
                        disabled={loading}
                      >
                        {loading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <>
                            Submit Report
                            <FaArrowRight className="ms-2" />
                          </>
                        )}
                      </Button>
                    </Card>
                  </div>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>

      <style>{`
        .report-page {
          background: linear-gradient(
            180deg,
            #eef2ef 0%,
            #e3ebe6 100%
          );
        }

        .report-kicker {
          color: var(--primary);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .page-title {
          font-size: 2.4rem;
          font-weight: 800;
          color: #161616;
          letter-spacing: -1px;
        }

        .page-subtitle {
          color: #6b7280;
          max-width: 560px;
          line-height: 1.7;
        }

        .modern-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 14px 34px rgba(0,0,0,0.06);
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(6px);
        }

        .form-card,
        .upload-card {
          transition: all 0.25s ease;
        }

        .form-card:hover,
        .upload-card:hover,
        .map-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 42px rgba(0,0,0,0.08);
        }

        .section-head {
          border-bottom: 1px solid #edf1ed;
          padding-bottom: 12px;
        }

        .section-title {
          font-weight: 800;
          color: #161616;
          margin: 0;
        }

        .section-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
        }

        .label {
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .input-modern {
          background: #f7f9f8 !important;
          border: 1px solid #e2e8e3 !important;
          border-radius: 14px !important;
          padding: 13px 15px !important;
          box-shadow: none !important;
          color: #1a1a1a !important;
          transition: all 0.2s ease;
        }

        .textarea-modern {
          resize: none;
        }

        .input-modern:focus {
          background: #ffffff !important;
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(111, 143, 118, 0.10) !important;
        }

        .field-error {
          color: #b3261e;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .back-btn {
          border-radius: 12px !important;
          padding: 11px 18px !important;
          font-weight: 600;
          box-shadow: none !important;
        }

        .back-btn:hover {
          background: #171717 !important;
          color: white !important;
          border-color: #171717 !important;
        }

        .card-topbar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #6f8f76, #5f7d66);
          color: white;
          padding: 14px 18px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .topbar-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .map-note {
          padding: 12px 16px;
          font-size: 0.9rem;
          color: #6b7280;
          background: #f8faf8;
          border-bottom: 1px solid #eef2ef;
        }

        .upload-box {
          border: 2px dashed #d7dfd9;
          border-radius: 18px;
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          background: #fafcfb;
          transition: all 0.25s ease;
        }

        .upload-box:hover {
          border-color: var(--primary);
          background: #f5faf7;
        }

        .upload-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(111,143,118,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px auto;
          color: var(--primary);
        }

        .upload-title {
          font-weight: 700;
          color: #171717;
        }

        .upload-text {
          font-size: 0.92rem;
          color: #6b7280;
          line-height: 1.6;
        }

        .preview-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .preview-img {
          position: relative;
        }

        .preview-img img {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid #e4e9e5;
          box-shadow: 0 6px 14px rgba(0,0,0,0.05);
        }

        .preview-img button {
          position: absolute;
          top: -7px;
          right: -7px;
          background: #b3261e;
          color: white;
          border: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submit-btn {
          background: #171717 !important;
          border: none !important;
          border-radius: 14px !important;
          font-weight: 700 !important;
          padding: 13px 18px !important;
          box-shadow: none !important;
          transition: all 0.25s ease;
        }

        .submit-btn:hover,
        .submit-btn:focus {
          background: var(--primary) !important;
          color: white !important;
          transform: translateY(-1px);
        }

        .leaflet-container {
          z-index: 1;
        }
          [data-theme="dark"] .report-page {
  background: linear-gradient(
    180deg,
    #0f1316 0%,
    #151b1f 100%
  );
}

[data-theme="dark"] .page-title,
[data-theme="dark"] .section-title,
[data-theme="dark"] .upload-title {
  color: #f3f4f6;
}

[data-theme="dark"] .page-subtitle,
[data-theme="dark"] .section-subtitle,
[data-theme="dark"] .label,
[data-theme="dark"] .map-note,
[data-theme="dark"] .upload-text {
  color: #a1a1aa;
}

[data-theme="dark"] .modern-card {
  background: rgba(24,29,33,0.92);
  box-shadow: 0 14px 34px rgba(0,0,0,0.24);
}

[data-theme="dark"] .section-head {
  border-bottom: 1px solid #2a3137;
}

[data-theme="dark"] .input-modern {
  background: #11161a !important;
  border: 1px solid #2a3137 !important;
  color: #f3f4f6 !important;
}

[data-theme="dark"] .input-modern::placeholder {
  color: #8b949e;
}

[data-theme="dark"] .input-modern:focus {
  background: #181d21 !important;
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(111, 143, 118, 0.18) !important;
}

[data-theme="dark"] .back-btn {
  color: #f3f4f6 !important;
  border-color: #384047 !important;
}

[data-theme="dark"] .back-btn:hover {
  background: #0f1113 !important;
  color: white !important;
  border-color: #0f1113 !important;
}

[data-theme="dark"] .card-topbar {
  background: linear-gradient(135deg, #6f8f76, #5f7d66);
}

[data-theme="dark"] .map-note {
  background: #1b2126;
  border-bottom: 1px solid #2a3137;
}

[data-theme="dark"] .upload-box {
  border: 2px dashed #384047;
  background: #11161a;
}

[data-theme="dark"] .upload-box:hover {
  border-color: #8cab92;
  background: #171d21;
}

[data-theme="dark"] .upload-icon-wrap {
  background: rgba(140,171,146,0.12);
  color: #8cab92;
}

[data-theme="dark"] .preview-img img {
  border: 1px solid #2a3137;
  box-shadow: 0 6px 14px rgba(0,0,0,0.18);
}

[data-theme="dark"] .submit-btn {
  background: #0f1113 !important;
}

[data-theme="dark"] .submit-btn:hover,
[data-theme="dark"] .submit-btn:focus {
  background: var(--primary) !important;
}

      `}</style>
    </div>
  );
};

export default ReportIssue;
