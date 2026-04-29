import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loading = ({ text = 'Loading...', fullPage = false }) => {
  // We use the sage green color defined in your index.css
  const sageColor = '#778a77';

  if (fullPage) {
    return (
      <div 
        className="d-flex flex-column justify-content-center align-items-center" 
        style={{ minHeight: '80vh', backgroundColor: '#f8f9fa' }}
      >
        <Spinner 
          animation="border" 
          style={{ color: sageColor, width: '3rem', height: '3rem', borderWeight: '5px' }} 
        />
        <p className="mt-4 fw-bold text-uppercase tracking-wider" style={{ color: '#1a1a1a', letterSpacing: '1px' }}>
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center p-4">
      <Spinner animation="grow" size="sm" style={{ backgroundColor: sageColor }} className="me-2" />
      <Spinner animation="grow" size="sm" style={{ backgroundColor: sageColor }} className="me-2" />
      <Spinner animation="grow" size="sm" style={{ backgroundColor: sageColor }} />
    </div>
  );
};

export default Loading;