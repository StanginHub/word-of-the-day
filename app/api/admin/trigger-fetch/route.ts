import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Simple check - you can add a password later
  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get("trigger");

  if (trigger !== "run-fetch-word") {
    return NextResponse.json(
      { error: "Invalid trigger parameter" },
      { status: 403 }
    );
  }

  try {
    // Call the actual cron endpoint with POST
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const cronSecret = process.env.CRON_SECRET || "dev-secret";

    console.log("Triggering fetch with URL:", baseUrl);
    console.log("CRON_SECRET exists:", !!process.env.CRON_SECRET);

    const response = await fetch(`${baseUrl}/api/cron/fetch-word`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log("Fetch response status:", response.status);
    console.log("Fetch response data:", data);

    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        data,
      },
      { status: response.status }
    );
  } catch (err) {
    console.error("Trigger fetch error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Also support POST method for consistency
  return GET(request);
}
