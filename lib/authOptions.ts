// lib/authOptions.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!DASHBOARD_PASSWORD) {
  throw new Error('DASHBOARD_PASSWORD env variable is required');
}
if (!NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET env variable is required');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Dashboard Access',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        if (credentials.password === DASHBOARD_PASSWORD) {
          return { id: '1', name: 'Dashboard Admin', role: 'admin' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/dashboard',
    signOut: '/',
    error: '/dashboard',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
  secret: NEXTAUTH_SECRET,
};
