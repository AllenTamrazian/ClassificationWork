import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const res = await fetch("http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/analysis/sizing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to process rock centers");
    }

    const result = await res.json();

    return new NextResponse(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error executing queries and updating images:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}