import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line } from 'react-konva';
import useImage from 'use-image';
import handleSubmit from '@/app/Tasks/Sizing/page';

const DisplayQuadrant = ({ quadrant, labels, setLabels }) => {
  // All hooks at the top
  const imageUrl = quadrant.image?.imageurl;
  const [konvaImage, status] = useImage(imageUrl);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('history')) || []);
  const [future, setFuture] = useState(() => JSON.parse(localStorage.getItem('future')) || []);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [dimensions, setDimensions] = useState({ width: quadrant.width, height: quadrant.height });

  // Reset points, history, and future when quadrant changes
  useEffect(() => {
    setPoints([]);
    setHistory([]);
    setFuture([]);
    localStorage.removeItem('history');
    localStorage.removeItem('future');
  }, [quadrant.id]);

  // Resize effect to preserve aspect ratio
  useEffect(() => {
    const resizeHandler = () => {
      const quadrantWidth = quadrant.width || 1920;
      const quadrantHeight = quadrant.height || 1080;
      const quadrantAspectRatio = quadrantWidth / quadrantHeight;

      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;

      const scale = Math.min(maxWidth / quadrantWidth, maxHeight / quadrantHeight);
      const scaledWidth = Math.max(1, quadrantWidth * scale); // Prevent zero/negative
      const scaledHeight = Math.max(1, quadrantHeight * scale); // Prevent zero/negative

      setDimensions({ width: scaledWidth, height: scaledHeight });

      console.log('Quadrant Aspect Ratio:', quadrantAspectRatio);
      console.log('Rendered Aspect Ratio:', scaledWidth / scaledHeight);
      console.log('Scaled Dimensions:', { width: scaledWidth, height: scaledHeight });
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();
    return () => window.removeEventListener('resize', resizeHandler);
  }, [quadrant.width, quadrant.height]);

  // LocalStorage effect
  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history));
    localStorage.setItem('future', JSON.stringify(future));
  }, [history, future]);

  // Debug logging
  console.log('Image URL:', imageUrl);
  console.log('Image Status:', status);
  console.log('Konva Image:', konvaImage ? 'Loaded' : 'Not Loaded');

  // Early returns after all hooks
  if (!imageUrl) return <div>No image URL provided</div>;
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load image</div>;
  if (!konvaImage) return <div>Image not loaded</div>;

  // Validate crop coordinates
  const crop = {
    x: Math.max(0, quadrant.x || 0),
    y: Math.max(0, quadrant.y || 0),
    width: Math.min(quadrant.width || 1920, 1920),
    height: Math.min(quadrant.height || 1080, 1080),
  };
  console.log('Crop values:', crop);

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const { x, y } = stage.getPointerPosition();
    setDrawing(true);
    setPoints([...points, { x: x / dimensions.width * quadrant.width, y: y / dimensions.height * quadrant.height }]);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const stage = e.target.getStage();
    const { x, y } = stage.getPointerPosition();
    setPoints([...points, { x: x / dimensions.width * quadrant.width, y: y / dimensions.height * quadrant.height }]);
  };

  const handleMouseUp = () => {
    setDrawing(false);
    if (points.length > 0) {
      setLabels([...labels, points]);
      setHistory([...history, labels]);
      setFuture([]);
      setPoints([]);
    }
  };

  const undo = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setFuture([labels, ...future]);
      setLabels(previous);
    }
  };

  const redo = () => {
    if (future.length > 0) {
      const next = future[0];
      setFuture(future.slice(1));
      setHistory([...history, labels]);
      setLabels(next);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          <Image
            image={konvaImage}
            width={dimensions.width}
            height={dimensions.height}
            crop={crop}
            alt="Quadrant Image"
          />
          {labels.map((label, i) => (
            <Line
              key={i}
              points={label.flatMap(p => [p.x / quadrant.width * dimensions.width, p.y / quadrant.height * dimensions.height])}
              stroke="red"
              strokeWidth={2}
              closed={true}
              fill="rgba(255, 0, 0, 0.5)"
            />
          ))}
          {drawing && (
            <Line
              points={points.flatMap(p => [p.x / quadrant.width * dimensions.width, p.y / quadrant.height * dimensions.height])}
              stroke="red"
              strokeWidth={2}
            />
          )}
        </Layer>
      </Stage>
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '30px' }}>
        <h4>Draw a circle for all rocks in this image</h4>
        <button style={{ margin: "10px", padding: "10px", borderRadius: "10px", background: "#c0c0c0", cursor: "pointer", width: '120px' }} onClick={undo}>Undo</button>
        <button style={{ margin: "10px", padding: "10px", borderRadius: "10px", background: "#c0c0c0", cursor: "pointer", width: '120px' }} onClick={redo}>Redo</button>
        <button style={{ margin: '10px', padding: '10px', borderRadius: '10px', background: '#007bff', color: '#fff', cursor: 'pointer', border: 'none', textDecoration: 'none', width: '120px' }} onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default DisplayQuadrant;