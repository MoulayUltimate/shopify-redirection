import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const email = (credentials.email as string).toLowerCase().trim();

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log('Auth: User not found', email);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            console.log('Auth: Invalid password', email);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (e) {
          console.error('Auth error:', e);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
});
