import { NextRequest, NextResponse } from "next/server";

// App Router segment config — disable body size limit for this route
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path?.join("/") ?? "";
  const search = req.nextUrl.search ?? "";
  const url = `${BACKEND}/${path}${search}`;

  // Forward all headers except host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") headers.set(key, value);
  });

  const isBodyless = ["GET", "HEAD"].includes(req.method);

  try {
    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body: isBodyless ? undefined : (req.body as BodyInit),
      // @ts-expect-error duplex required for streaming request bodies
      duplex: "half",
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[proxy] Backend unreachable:", err);
    return NextResponse.json(
      { detail: "Backend unreachable. Make sure FastAPI is running on port 8000." },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
