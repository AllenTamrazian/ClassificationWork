import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { options } from "../../auth/[...nextauth]/options";

export async function GET(req) {
  try {
    // Ensure user is authenticated
    const session = await getServerSession(options);
    if (!session) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }

    // Fetch from Java web service
    const res = await fetch("http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/classifying");
    const rocks = await res.json();

    // Normalize imageURL to a string
    const normalizedRocks = rocks.map(rock => ({
      ...rock,
      image: {
        ...rock.image,
        imageURL: rock.image?.imageURL?.string || rock.image?.imageURL || null
      }
    }));

    // Log the first rock entry to check data
    console.log("Normalized first rock:", JSON.stringify(normalizedRocks[0], null, 2));

    // Return the normalized data
    return new NextResponse(JSON.stringify(normalizedRocks), { status: 200 });
  } catch (error) {
    console.error("Error fetching rocks", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
        requestBody: req.body
      }),
      { status: 500 }
    );
  }
}