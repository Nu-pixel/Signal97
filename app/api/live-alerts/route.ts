import { NextResponse } from "next/server";

const API_BASE = process.env.S97_VM_API_BASE || "http://136.114.207.90:8000";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/alerts/live?limit=100`, {
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { alerts: [], ok: false, error: `VM API error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = text ? JSON.parse(text) : { alerts: [] };
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { alerts: [], ok: false, error: `Cannot reach VM API (${e?.message ?? "unknown"})` },
      { status: 502 }
    );
  }
}
