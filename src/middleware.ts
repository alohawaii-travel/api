import { NextRequest, NextResponse } from "next/server";
import { validateApiAccess } from "./middleware/apiAuth";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow access to auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check API key for all API routes (external and internal)
  if (pathname.startsWith("/api/external") || pathname.startsWith("/api/internal")) {
    const routeType = pathname.startsWith("/api/internal") ? "internal" : "external";
    const apiValidation = validateApiAccess(req, routeType);
    
    if (!apiValidation.isValid) {
      console.error(`🚫 API key validation failed for ${pathname}: ${apiValidation.error}`);
      return NextResponse.json(
        { 
          success: false, 
          error: apiValidation.error,
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }
    
    console.log(`✅ API key validation passed for ${pathname}`);
  }

  // Additional auth check for internal routes
  if (pathname.startsWith("/api/internal")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check for admin role on admin routes
    if (
      pathname.startsWith("/api/internal/admin") &&
      !["ADMIN", "SUPER_ADMIN"].includes(token.role as string)
    ) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
