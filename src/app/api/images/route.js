import  prisma  from '../../lib/prisma';
import { NextResponse } from 'next/server';



// Handle GET request
export async function GET(req) {
  try {
    // Fetch all images from the "Image" table in the database
    const res = await fetch("http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/images");
    const images = await res.json();

    // If images are found, return them
    /*
    const images = rawImages.map((item) => ({
      id : item.id,
      imageURL: item.imageURL// use .string and fallback to empty string
    }));*/

    return NextResponse.json(images, {
      status: 200 // OK status
    });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching images", error }, { status: 500 });
  }
}

// Prevent POST requests as this function should only handle GET requests for fetching data
export async function POST(req) {
  return NextResponse.json(
    { error: "Method not allowed" },
    {
      status: 405 // Method Not Allowed status
    }
  );
}
