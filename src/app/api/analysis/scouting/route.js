import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const res = await fetch("http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/analysis/scouting", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch accepted values");
    }

    const acceptedValues = await res.json();

    return new NextResponse(JSON.stringify(acceptedValues), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error calculating accepted values:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function POST(req) {
  try {
    const { acceptedValues } = await req.json();
    console.log("Accepted Values:", acceptedValues);

    const res = await fetch("http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/analysis/scouting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(acceptedValues),
    });

    if (!res.ok) {
      throw new Error("Failed to update images");
    }

    const updateResponse = await res.json();

    return new NextResponse(JSON.stringify(updateResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating images:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}