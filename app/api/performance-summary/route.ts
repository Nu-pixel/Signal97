import { NextResponse } from "next/server";

const API_BASE =
  process.env.S97_VM_API_BASE ||
  process.env.NEXT_PUBLIC_S97_VM_API_BASE ||
  "http://136.114.207.90:8000";

export async function GET() {
  try {
    // ✅ VM endpoint you confirmed works: /api/performance
    const res = await fetch(`${API_BASE}/api/performance`, { cache: "no-store" });
    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { summary: null, ok: false, error: `VM API error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = text ? JSON.parse(text) : { summary: null };
    return NextResponse.json({ ok: true, ...data });
  } catch (e: any) {
    return NextResponse.json(
      { summary: null, ok: false, error: `Cannot reach VM API (${e?.message ?? "unknown"})` },
      { status: 502 }
    );
  }
}
