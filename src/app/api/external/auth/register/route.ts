import { NextRequest, NextResponse } from "next/server";
import { validateApiAccess } from "@/middleware/apiAuth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/types/database";

interface RequestBody {
  email: string;
  name?: string;
  image?: string;
  provider: string;
}

export async function POST(request: NextRequest) {
  // Validate API access for external route
  const validation = validateApiAccess(request, "external");
  if (!validation.isValid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body: RequestBody = await request.json();
    const { email, name, image, provider } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    let user;

    if (existingUser) {
      // Update existing user's last login time
      user = await prisma.user.update({
        where: { email },
        data: {
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

      console.log(`User logged in: ${email} with role ${user.role}`);
    } else {
      // Create new user with PENDING role
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          image: image || null,
          role: UserRole.PENDING, // Set role to PENDING for new users
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

      console.log(`New user registered: ${email} with PENDING role`);
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
      },
      { status: existingUser ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error in user registration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process registration" },
      { status: 500 }
    );
  }
}
