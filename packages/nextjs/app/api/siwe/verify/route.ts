import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { SiweMessage } from "siwe";

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
  // iron-session expects a traditional req/res object; on app router we can pass headers manually
  // but getIronSession supports NextRequest/NextResponse in recent versions
  // If types mismatch, cast to any.
  // @ts-expect-error next types
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);

  const { message, signature } = (await req.json()) as { message: string; signature: string };
  if (!message || !signature) {
    return NextResponse.json({ ok: false, error: "Missing message or signature" }, { status: 400 });
  }

  const nonceCookie = cookies().get("siwe_nonce")?.value;
  if (!nonceCookie) {
    return NextResponse.json({ ok: false, error: "Missing nonce" }, { status: 400 });
  }

  try {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature, nonce: nonceCookie });

    if (!fields.success) {
      return NextResponse.json({ ok: false, error: "Invalid SIWE signature" }, { status: 401 });
    }

    session.address = siweMessage.address;
    session.chainId = Number(siweMessage.chainId);
    session.authenticated = true;
    await session.save();

    // clear nonce cookie once used
    cookies().set("siwe_nonce", "", { maxAge: 0, path: "/" });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SIWE verify error", err);
    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 500 });
  }
}
