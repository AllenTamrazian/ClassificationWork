import React, { useEffect, useState } from 'react';
import { Circle, Line, Rect, Image as KonvaImage, Stage, Layer } from 'react-konva';
import useImage from 'use-image';

function DisplayRock({ rock }) {
  const [location, setLocation] = useState(null);
  const [longestLine, setLongestLine] = useState(null);
  const [distance, setDistance] = useState(null);
  const [image] = useImage(rock ? rock.imageURL : null, 'Anonymous');
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;

  // Debug rock prop
  useEffect(() => {
    console.log('Rock prop:', rock);
  }, [rock]);

  useEffect(() => {
    if (rock && rock.location) {
      const parsedLocation = parseWKTPoint(rock.location);
      setLocation(parsedLocation);
    } else {
      setLocation(null);
    }
  }, [rock]);

  useEffect(() => {
    if (rock && rock.longest_line) {
      const parsedLine = parseWKTLine(rock.longest_line);
      setLongestLine(parsedLine);
    } else {
      setLongestLine(null);
    }
  }, [rock]);

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
      const adjustedX = x / 1500 * stageWidth;
      const adjustedY = (1000 - y) / 1000 * stageHeight;
      return { x: adjustedX, y: adjustedY };
    } catch (error) {
      console.error('Error parsing WKT point:', error, wktPoint);
      return null;
    }
  }

  function parseWKTLine(wktLine) {
    if (!wktLine || typeof wktLine !== 'string' || !wktLine.startsWith('LINESTRING(')) {
      console.warn('Invalid WKT line:', wktLine);
      return null;
    }

    try {
      const cleanedData = wktLine.match(/\d+\.\d+|\d+/g)?.map(Number) || [];
      if (cleanedData.length < 4) {
        console.warn('Insufficient points in WKT line:', cleanedData);
        return null;
      }
      const adjustedX1 = cleanedData[0] / 1500 * stageWidth;
      const adjustedX2 = cleanedData[2] / 1500 * stageWidth;
      const adjustedY1 = (1000 - cleanedData[1]) / 1000 * stageHeight;
      const adjustedY2 = (1000 - cleanedData[3]) / 1000 * stageHeight;
      return { x1: adjustedX1, y1: adjustedY1, x2: adjustedX2, y2: adjustedY2 };
    } catch (error) {
      console.error('Error parsing WKT line:', error, wktLine);
      return null;
    }
  }

  return (
    <Stage width={stageWidth} height={stageHeight}>
      <Layer>
        {image && (
          <KonvaImage
            image={image}
            x={0}
            y={0}
            width={stageWidth}
            height={stageHeight}
          />
        )}
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