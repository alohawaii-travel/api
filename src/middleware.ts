import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow access to auth routes
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Protect internal (admin) routes
    if (pathname.startsWith("/api/internal")) {
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }

      // Check for admin role on admin routes
      if (
        pathname.startsWith("/api/internal/admin") &&
        !["ADMIN", "SUPER_ADMIN"].includes(token.role)
      ) {
        return NextResponse.json(
          { success: false, message: "Admin access required" },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public external API routes
        if (pathname.startsWith("/api/external")) {
          return true;
        }

        // Allow auth routes
        if (pathname.startsWith("/api/auth")) {
          return true;
        }

        // Require token for internal routes
        if (pathname.startsWith("/api/internal")) {
          return !!token;
        }

        // Allow other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/api/:path*"],
};
