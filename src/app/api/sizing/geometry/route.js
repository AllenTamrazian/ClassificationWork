import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { options } from '../../auth/[...nextauth]/options';

export async function POST(req) {
  if (req.method !== 'POST') {
    return new NextResponse(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  }

  try {
    // Get the user session
    const session = await getServerSession(options);
    if (!session || !session.user || !session.user.id || isNaN(session.user.id) || session.user.id <= 0) {
      return new NextResponse(JSON.stringify({ message: 'Not Authenticated or invalid userId' }), { status: 403 });
    }

    const body = await req.json();
    console.log('Received payload:', JSON.stringify(body, null, 2));

    const { geometries, quadrant } = body;

    // Validate inputs
    if (!geometries || !Array.isArray(geometries) || geometries.length === 0) {
      return new NextResponse(JSON.stringify({ message: 'Missing or invalid geometries array' }), { status: 400 });
    }
    if (!quadrant || typeof quadrant !== 'object') {
      return new NextResponse(JSON.stringify({ message: 'Missing or invalid quadrant object' }), { status: 400 });
    }

    // Validate quadrant fields
    const invalidFields = [];
    if (quadrant.width === undefined || quadrant.width === null) {
      invalidFields.push('width: missing');
    } else if (isNaN(quadrant.width) || quadrant.width <= 0) {
      invalidFields.push('width: must be a positive number');
    }
    if (quadrant.height === undefined || quadrant.height === null) {
      invalidFields.push('height: missing');
    } else if (isNaN(quadrant.height) || quadrant.height <= 0) {
      invalidFields.push('height: must be a positive number');
    }
    if (quadrant.quadrantNumber === undefined || quadrant.quadrantNumber === null) {
      invalidFields.push('quadrantNumber: missing');
    } else if (isNaN(quadrant.quadrantNumber) || quadrant.quadrantNumber <= 0) {
      invalidFields.push('quadrantNumber: must be a positive number');
    }
    if (!quadrant.image || typeof quadrant.image !== 'object') {
      invalidFields.push('image: missing or invalid');
    } else {
      if (quadrant.image.id === undefined || quadrant.image.id === null) {
        invalidFields.push('image.id: missing');
      } else if (isNaN(quadrant.image.id) || quadrant.image.id <= 0) {
        invalidFields.push('image.id: must be a positive number');
      }
      if (quadrant.image.numQuadrants === undefined || quadrant.image.numQuadrants === null) {
        invalidFields.push('image.numQuadrants: missing');
      } else if (isNaN(quadrant.image.numQuadrants) || quadrant.image.numQuadrants <= 0) {
        invalidFields.push('image.numQuadrants: must be a positive number');
      }
    }

    if (invalidFields.length > 0) {
      return new NextResponse(JSON.stringify({
        message: `Invalid quadrant data: ${invalidFields.join(', ')}`
      }), { status: 400 });
    }

    const userId = 3;
    const imageId = Number(quadrant.image.id);
    const results = await saveGeometries(geometries, userId, imageId, quadrant);

    return new NextResponse(JSON.stringify({ message: 'Geometries stored successfully', results }), { status: 200 });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new NextResponse(JSON.stringify({
      message: 'Internal Server Error',
      error: error.message
    }), { status: 500 });
  }
}

async function saveGeometries(geometries, userId, imageId, quadrant) {
  const { width, height, quadrantNumber, image } = quadrant;
  const n = Math.sqrt(image.numQuadrants);
  if (isNaN(n) || n <= 0) {
    throw new Error('Invalid numQuadrants: must yield a positive square root');
  }
  const imageHeight = n * height;
  const quadrantIndex = quadrantNumber - 1;
  const qx = quadrantIndex % n;
  const qy = Math.floor(quadrantIndex / n);

  const queries = await Promise.all(geometries.map(async (geometry, index) => {
    // Validate geometry
    if (!geometry.coordinates || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      throw new Error(`Invalid geometry at index ${index}: missing or empty coordinates`);
    }

    let coordinates = geometry.coordinates[0];
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      throw new Error(`Invalid geometry at index ${index}: POLYGON requires at least 3 points`);
    }

    // Ensure closed POLYGON
    if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
      coordinates = [...coordinates, coordinates[0]];
    }

    // Transform coordinates
    const globalCoordinates = coordinates.map(([x, y], ptIndex) => {
      if (isNaN(x) || isNaN(y)) {
        throw new Error(`Invalid coordinates at index ${index}, point ${ptIndex}: x or y is NaN`);
      }
      const gx = Math.round(qx * width + x);
      const gy = imageHeight - Math.round(qy * height + y);
      if (isNaN(gx) || isNaN(gy)) {
        throw new Error(`Invalid coordinates at index ${index}, point ${ptIndex}: transformed to NaN`);
      }
      return `${gx} ${gy}`;
    }).join(', ');

    const wkt = `POLYGON((${globalCoordinates}))`;

    // Validate WKT format
    if (!wkt.match(/^POLYGON\s*\(\s*\([^)]+\)\s*\)$/)) {
      throw new Error(`Invalid WKT at index ${index}: malformed POLYGON`);
    }

    // Log payload for debugging
    console.log(`Sending to Java service [geometry ${index}]:`, { userId, imageId, wkt });

    // Send to Java web service
    const res = await fetch('http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/sizing/geometry', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        wkt,
        imageId
      }),
    });

    let responseBody;
    try {
      responseBody = await res.json();
    } catch {
      responseBody = { error: await res.text() || 'Unknown error' };
    }

    if (!res.ok) {
      console.error(`Java service error [geometry ${index}]:`, responseBody);
      throw new Error(`Java service error: ${responseBody.error || responseBody.message || res.statusText}`);
    }

    console.log(`Java service response [geometry ${index}]:`, responseBody);
    return responseBody;
  }));

  return queries;
}