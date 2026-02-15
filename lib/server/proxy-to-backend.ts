import { NextRequest, NextResponse } from "next/server";

import { getBackendBaseUrl } from "@/lib/server/backend-url";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length"
]);

function copyRequestHeaders(source: Headers): Headers {
  const headers = new Headers();

  for (const [key, value] of source.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  return headers;
}

function copyResponseHeaders(source: Headers): Headers {
  const headers = new Headers();

  const sourceWithCookies = source as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies = sourceWithCookies.getSetCookie?.() || [];
  for (const cookie of setCookies) {
    headers.append("set-cookie", cookie);
  }

  for (const [key, value] of source.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      continue;
    }

    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.append(key, value);
    }
  }

  return headers;
}

export async function proxyToBackend(request: NextRequest, pathname: string): Promise<NextResponse> {
  const targetUrl = new URL(pathname, `${getBackendBaseUrl()}/`);
  targetUrl.search = request.nextUrl.search;

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const requestHeaders = copyRequestHeaders(request.headers);

  const upstreamResponse = await fetch(targetUrl, {
    method,
    headers: requestHeaders,
    body,
    redirect: "manual",
    cache: "no-store"
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: copyResponseHeaders(upstreamResponse.headers)
  });
}
