import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSession, SessionOptions } from "iron-session";

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "development_secret_change_me_please_32_chars_min",
  cookieName: "siwe_session",
  cookieOptions: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  },
};

type SessionData = {
  address?: string;
  chainId?: number;
  authenticated?: boolean;
};

async function getSession(req: NextRequest, res: NextResponse): Promise<IronSession<SessionData>> {
  // @ts-expect-error next types
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);
  session.destroy();
  return NextResponse.json({ ok: true });
}
