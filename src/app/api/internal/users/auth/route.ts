import { NextRequest, NextResponse } from "next/server";
import { validateApiAccess } from "@/middleware/apiAuth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

interface AuthRequest {
  email: string;
  name?: string;
  image?: string;
  provider: string;
}

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    isActive: boolean;
  };
  error?: string;
  statusCode?: number;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  // Validate API access for internal route (Hub can call this)
  const validation = validateApiAccess(request, "internal");
  if (!validation.isValid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body: AuthRequest = await request.json();
    const { email, name, image, provider } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email domain is whitelisted
    const emailDomain = email.split("@")[1];
    const whitelistedDomain = await prisma.whitelistedDomain.findFirst({
      where: {
        domain: emailDomain,
        isActive: true,
      },
    });

    if (!whitelistedDomain) {
      return NextResponse.json(
        {
          success: false,
          error: "Domain not authorized for this system",
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    if (existingUser) {
      // Check if user is active and not PENDING
      if (!existingUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: "Account is deactivated. Please contact administrator.",
            statusCode: 403,
          },
          { status: 403 }
        );
      }

      if (existingUser.role === UserRole.PENDING) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Account is pending approval. Please contact administrator for access.",
            statusCode: 403,
          },
          { status: 403 }
        );
      }

      // Update existing user's last login time
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          lastLoginAt: new Date(),
          // Optionally update name/image from OAuth if they've changed
          ...(name && name !== existingUser.name && { name }),
          ...(image && { image }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      console.log(`User signed in: ${email} with role ${updatedUser.role}`);

      return NextResponse.json(
        {
          success: true,
          user: updatedUser,
        },
        { status: 200 }
      );
    } else {
      // Create new user with PENDING role
      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || null,
          image: image || null,
          role: UserRole.PENDING, // New users start as PENDING
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      console.log(
        `New user registered: ${email} with PENDING role - requires approval`
      );

      // Return with specific message for new PENDING users
      return NextResponse.json(
        {
          success: false,
          error:
            "Account created but requires administrator approval. Please contact your administrator for access.",
          statusCode: 403,
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error in user authentication:", error);
    return NextResponse.json(
      { success: false, error: "Authentication service unavailable" },
      { status: 500 }
    );
  }
}
