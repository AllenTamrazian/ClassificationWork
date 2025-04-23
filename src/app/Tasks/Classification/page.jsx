"use client";

import React, { useEffect, useState } from 'react';
import OptionSelector from '../../(components)/Classification/OptionSelector';
import SampleImages from '../../(components)/Classification/SampleImages';
import dynamic from 'next/dynamic';

const DisplayImage = dynamic(() => import('../../(components)/Scouting/DisplayImage'), {
  ssr: false,
});

const ClassificationPage = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const cachedImages = localStorage.getItem('cachedImages');
        const imagesData = cachedImages ? JSON.parse(cachedImages) : null;
        const cacheIsValid = false;

        if (imagesData && cacheIsValid) {
          setImages(imagesData.data);
        } else {
          const response = await fetch('/api/images');
          if (!response.ok) {
            throw new Error(`Failed to fetch images: ${response.status}`);
          }
          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error('API response is not an array');
          }

          const normalizedImages = data.map(image => ({
            ...image,
            imageURL: image.imageURL?.string || image.imageURL || image.imageUrl || null,
          }));

          setImages(normalizedImages);
          localStorage.setItem(
            'cachedImages',
            JSON.stringify({
              data: normalizedImages,
              timestamp: new Date().getTime(),
            })
          );
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleSubmit = async (selectedOption) => {
    console.log('handleSubmit called with:', selectedOption); // Debug log
    if (images.length === 0 || !images[currentIndex]) {
      console.error('No valid image at currentIndex:', currentIndex);
      return;
    }

    const currentImage = images[currentIndex];
    const currentImageId = currentImage.id;

    console.log('Submitting:', { imageId: currentImageId, selectedOption });
    setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.max(1, images.length));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (images.length === 0 || !images[currentIndex]) {
    return <div>No images available. Check API response.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <DisplayImage image={images[currentIndex].imageURL} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SampleImages />
          <h4>Can you identify the shape that best captures the outline of the highlighted rock?</h4>
          <OptionSelector onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default ClassificationPage;