import { type NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/server/proxy-to-backend";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/account/rate-limit");
}
