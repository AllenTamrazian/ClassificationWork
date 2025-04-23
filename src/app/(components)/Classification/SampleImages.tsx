import React from 'react';

const SampleImages: React.FC = () => {
  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '10px' }}>
        Classification References
      </h4>
      <img
        src="/classificationSamples.png"
        alt="Classification Reference"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default SampleImages;