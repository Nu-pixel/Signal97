import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    S97_VM_API_BASE: process.env.S97_VM_API_BASE ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  });
}
