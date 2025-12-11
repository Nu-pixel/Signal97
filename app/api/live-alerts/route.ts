import { NextResponse } from "next/server";

// Hard-code the VM API base through the SSH tunnel
const API_BASE = "http://127.0.0.1:8000";

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
