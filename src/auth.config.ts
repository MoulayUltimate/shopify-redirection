import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname === "/";
      const isOnAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
} satisfies NextAuthConfig;
