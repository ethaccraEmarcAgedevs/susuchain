import { NextRequest, NextResponse } from "next/server";
import { IronSession, SessionOptions, getIronSession } from "iron-session";

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "development_secret_change_me_please_32_chars_min",
  cookieName: "siwe_session",
  cookieOptions: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

type SessionData = {
  address?: string;
  chainId?: number;
  authenticated?: boolean;
};

async function getSession(req: NextRequest, res: NextResponse): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);
  if (session.authenticated) {
    return NextResponse.json({ address: session.address, chainId: session.chainId, authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
