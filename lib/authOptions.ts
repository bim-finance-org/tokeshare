// lib/authOptions.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { rateLimit } from '@/lib/ratelimit';

// The dashboard uses a single shared password, so the login endpoint is the
// prime brute-force target. NextAuth's `authorize` receives a plain-object
// `headers` map (not a Headers instance), so rebuild a minimal Request for
// rateLimit()'s IP extraction.
function requestFromAuthHeaders(headers?: Record<string, unknown>): Request {
  const h = new Headers();
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') h.set(key, value);
    }
  }
  return new Request('http://internal/auth/callback/credentials', { headers: h });
}

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
      async authorize(credentials, req) {
        if (!credentials?.password) return null;

        // Throttle by client IP before comparing the password: 5 attempts / min.
        const { success } = await rateLimit(requestFromAuthHeaders(req?.headers), {
          key: 'auth:login',
          limit: 5,
          windowSec: 60,
        });
        if (!success) {
          throw new Error('Trop de tentatives de connexion. Réessayez dans une minute.');
        }

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
