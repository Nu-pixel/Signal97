import { NextResponse } from "next/server";

// VM public IP (no SSH tunnel needed now)
const API_BASE = "http://136.114.207.90:8000";

export async function GET() {
  console.log("Using API_BASE =", API_BASE);

  try {
    const res = await fetch(`${API_BASE}/alerts/live?limit=100`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("VM API error:", res.status, text);
      return NextResponse.json(
        { alerts: [], error: `VM API error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error calling VM API:", e);
    return NextResponse.json(
      { alerts: [], error: "Cannot reach VM API" },
      { status: 502 }
    );
  }
}
