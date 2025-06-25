import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";
import { UserRole } from "@/types/database";
import { GoogleProfile } from "@/types";

// Extend NextAuth types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      domain?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    domain?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    domain?: string | null;
  }
}

// Domain whitelist utility
async function isDomainWhitelisted(domain: string): Promise<boolean> {
  // Check environment variable first
  const envWhitelist = process.env.API_DOMAIN_WHITELIST?.split(",") || [];
  if (envWhitelist.includes(domain)) return true;

  // Check database
  const whitelistedDomain = await prisma.whitelistedDomain.findUnique({
    where: { domain, isActive: true },
  });

  return !!whitelistedDomain;
}

// Extract domain from email
function extractDomain(email: string): string {
  return email.split("@")[1];
}

export const authOptions: NextAuthOptions = {
  // Note: Without Prisma adapter, sessions will be JWT-based only
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile;
        const domain = googleProfile.hd || extractDomain(googleProfile.email);

        // Check if domain is whitelisted
        const isWhitelisted = await isDomainWhitelisted(domain);

        if (!isWhitelisted) {
          console.log(
            `Rejected login attempt from non-whitelisted domain: ${domain}`
          );
          return false;
        }

        // Update or create user with domain info
        try {
          // Check if this is an existing user
          const existingUser = await prisma.user.findUnique({
            where: { email: googleProfile.email },
          });

          if (existingUser) {
            // Update existing user info but don't change role
            await prisma.user.update({
              where: { email: googleProfile.email },
              data: {
                name: googleProfile.name,
                image: googleProfile.picture,
                lastLoginAt: new Date(),
              },
            });
          } else {
            // Create new user with PENDING role
            await prisma.user.create({
              data: {
                email: googleProfile.email,
                name: googleProfile.name,
                image: googleProfile.picture,
                role: UserRole.PENDING, // Explicitly set to PENDING for new users
                lastLoginAt: new Date(),
              },
            });
          }
        } catch (error) {
          console.error("Error creating/updating user:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Fetch fresh user data from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true, isActive: true },
        });

        if (dbUser && dbUser.isActive) {
          // Convert Prisma UserRole to our custom UserRole enum
          token.role = dbUser.role as unknown as UserRole;
          token.sub = dbUser.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        // Remove domain as it's not in our schema
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
