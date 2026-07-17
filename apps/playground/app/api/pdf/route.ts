import { NextRequest } from "next/server";

export const runtime = "nodejs";

function isAllowedPdfUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;

    const host = url.hostname.toLowerCase();
    return !(
      host === "localhost" ||
      host === "::1" ||
      host === "0.0.0.0" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const initialUrl = request.nextUrl.searchParams.get("url");
  if (!initialUrl || !isAllowedPdfUrl(initialUrl)) {
    return Response.json({ error: "Provide a public HTTP(S) PDF URL." }, { status: 400 });
  }

  try {
    let url = initialUrl;
    let upstream: Response | null = null;

    for (let redirects = 0; redirects <= 3; redirects++) {
      upstream = await fetch(url, {
        redirect: "manual",
        headers: { Accept: "application/pdf" },
      });
      if (upstream.status < 300 || upstream.status >= 400) break;

      const location = upstream.headers.get("location");
      if (!location) break;
      url = new URL(location, url).toString();
      if (!isAllowedPdfUrl(url)) {
        return Response.json({ error: "PDF redirect target is not public." }, { status: 400 });
      }
    }

    if (!upstream?.ok || !upstream.body) {
      return Response.json(
        { error: `Upstream PDF request failed (${upstream?.status ?? 502}).` },
        { status: upstream?.status || 502 },
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/pdf",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "Could not fetch PDF URL." }, { status: 502 });
  }
}
