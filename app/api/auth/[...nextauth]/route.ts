import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Le mot de passe est maintenant récupéré depuis les variables d'environnement
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "default-password";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Dashboard Access",
      credentials: {
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          return null;
        }

        // Vérification du mot de passe avec la variable d'environnement
        if (credentials.password === DASHBOARD_PASSWORD) {
          return {
            id: "1",
            name: "Dashboard Admin",
            role: "admin"
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: '/dashboard',
    signOut: '/',
    error: '/dashboard',
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 1 jour
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "tokeshare-dashboard-secret",
};

// Handler pour NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 