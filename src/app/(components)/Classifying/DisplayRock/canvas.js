import React, { useEffect, useState } from 'react';
import { Circle, Line, Rect, Image as KonvaImage, Stage, Layer } from 'react-konva';
import useImage from 'use-image';

function DisplayRock({ rock }) {
  // All hooks at the top
  // Handle imageURL as object or string
  const rawImageUrl = rock?.image?.imageURL || rock?.image?.imageurl || rock?.imageurl || rock?.image?.url;
  const imageUrl = typeof rawImageUrl === 'object' && rawImageUrl?.string ? rawImageUrl.string : rawImageUrl;
  const [image, status] = useImage(imageUrl, 'Anonymous');
  const [location, setLocation] = useState(null);
  const [longestLine, setLongestLine] = useState(null);
  const [distance, setDistance] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 540 });

  // Debug rock prop and image
  useEffect(() => {
    console.log('Rock prop:', JSON.stringify(rock, null, 2));
    console.log('Raw Image URL:', JSON.stringify(rawImageUrl, null, 2));
    console.log('Normalized Image URL:', imageUrl);
    console.log('Image Status:', status);
    console.log('Konva Image:', image ? 'Loaded' : 'Not Loaded');
  }, [rock, rawImageUrl, imageUrl, status, image]);

  // Resize effect to preserve aspect ratio
  useEffect(() => {
    const resizeHandler = () => {
      const rockWidth = rock?.width || 960;
      const rockHeight = rock?.height || 540;
      const rockAspectRatio = rockWidth / rockHeight;

      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;

      const scale = Math.min(maxWidth / rockWidth, maxHeight / rockHeight);
      const scaledWidth = Math.max(1, rockWidth * scale);
      const scaledHeight = Math.max(1, rockHeight * scale);

      setDimensions({ width: scaledWidth, height: scaledHeight });

      console.log('Rock Aspect Ratio:', rockAspectRatio);
      console.log('Rendered Aspect Ratio:', scaledWidth / scaledHeight);
      console.log('Scaled Dimensions:', { width: scaledWidth, height: scaledHeight });
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();
    return () => window.removeEventListener('resize', resizeHandler);
  }, [rock?.width, rock?.height]);

  // Parse WKT point
  useEffect(() => {
    if (rock && rock.location) {
      const parsedLocation = parseWKTPoint(rock.location);
      setLocation(parsedLocation);
    } else {
      setLocation(null);
    }
  }, [rock, dimensions]);

  // Parse WKT line
  useEffect(() => {
    if (rock && rock.longest_line) {
      const parsedLine = parseWKTLine(rock.longest_line);
      setLongestLine(parsedLine);
    } else {
      setLongestLine(null);
    }
  }, [rock, dimensions]);

  // Set distance
  useEffect(() => {
    if (rock && rock.distance) {
      setDistance(rock.distance);
    } else {
      setDistance(null);
    }
  }, [rock]);

  function parseWKTPoint(wktPoint) {
    if (!wktPoint || typeof wktPoint !== 'string' || !wktPoint.startsWith('POINT(')) {
      console.warn('Invalid WKT point:', wktPoint);
      return null;
    }

    try {
      const cleanedData = wktPoint.replace('POINT(', '').replace(')', '');
      const [x, y] = cleanedData.split(' ').map(Number);
      if (isNaN(x) || isNaN(y)) {
        console.warn('Invalid coordinates in WKT point:', cleanedData);
        return null;
      }
      const adjustedX = x / 1500 * dimensions.width;
      const adjustedY = (1000 - y) / 1000 * dimensions.height;
      return { x: adjustedX, y: adjustedY };
    } catch (error) {
      console.error('Error parsing WKT point:', error, wktPoint);
      return null;
    }
  }

  function parseWKTLine(wktLine) {
    if (!wktPoint || typeof wktPoint !== 'string' || !wktPoint.startsWith('LINESTRING(')) {
      console.warn('Invalid WKT line:', wktLine);
      return null;
    }

    try {
      const cleanedData = wktLine.match(/\d+\.\d+|\d+/g)?.map(Number) || [];
      if (cleanedData.length < 4) {
        console.warn('Insufficient points in WKT line:', cleanedData);
        return null;
      }
      const adjustedX1 = cleanedData[0] / 1500 * dimensions.width;
      const adjustedX2 = cleanedData[2] / 1500 * dimensions.width;
      const adjustedY1 = (1000 - cleanedData[1]) / 1000 * dimensions.height;
      const adjustedY2 = (1000 - cleanedData[3]) / 1000 * dimensions.height;
      return { x1: adjustedX1, y1: adjustedY1, x2: adjustedX2, y2: adjustedY2 };
    } catch (error) {
      console.error('Error parsing WKT line:', error, wktLine);
      return null;
    }
  }

  // Early returns for invalid states
  if (!rock) return <div>No rock data provided</div>;
  if (!imageUrl || imageUrl === 'null') return (
    <div>
      No valid image URL provided. Expected image.imageURL to be a string.
      <pre>{JSON.stringify(rock, null, 2)}</pre>
    </div>
  );
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return (
    <div>
      Failed to load image.
      <pre>URL: {imageUrl}</pre>
    </div>
  );
  if (!image) return <div>Image not loaded</div>;

  return (
    <Stage width={dimensions.width} height={dimensions.height}>
      <Layer>
        <KonvaImage
          image={image}
          x={0}
          y={0}
          width={dimensions.width}
          height={dimensions.height}
          alt="Rock Image"
        />
        {location && (
          <Circle
            x={location.x}
            y={location.y}
            radius={5}
            fill="red"
          />
        )}
        {longestLine && (
          <Line
            points={[longestLine.x1, longestLine.y1, longestLine.x2, longestLine.y2]}
            stroke="blue"
            strokeWidth={5}
          />
        )}
        {location && distance && (
          <Rect
            x={location.x - distance}
            y={location.y - distance}
            width={distance * 2}
            height={distance * 2}
            strokeWidth={1}
            stroke="black"
          />
        )}
      </Layer>
    </Stage>
  );
}

export default DisplayRock;