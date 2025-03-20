import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. robots.txt)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",

    // Always protect all pages under the app directory
    "/",
    "/(.*)",

    // Explicitly protect all API routes
    "/api/(.*)",
    "/trpc/(.*)",
  ],
};
