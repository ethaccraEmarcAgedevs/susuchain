import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  // Store nonce in a temporary cookie for CSRF protection
  cookies().set("siwe_nonce", nonce, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 300, path: "/" });
  return new NextResponse(nonce, { status: 200 });
}
