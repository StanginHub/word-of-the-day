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

    const response = await fetch(`${baseUrl}/api/cron/fetch-word`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        data,
      },
      { status: response.status }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
