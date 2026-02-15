import { type NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/server/proxy-to-backend";

type RouteContext = {
  params: Promise<{
    authRoutes: string[];
  }>;
};

async function handleRequest(request: NextRequest, context: RouteContext) {
  const { authRoutes } = await context.params;
  const joinedPath = authRoutes.join("/");
  return proxyToBackend(request, `/api/auth/${joinedPath}`);
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
