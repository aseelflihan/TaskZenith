// src/lib/auth.ts
import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// Ensure environment variables are set, providing a clear error message if not.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleClientId || !googleClientSecret || !nextAuthSecret) {
  throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or NEXTAUTH_SECRET environment variables');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        idToken: { label: 'ID Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;
        
        // Use the new API route for verification
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/verify-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken: credentials.idToken }),
        });

        if (!res.ok) {
          console.error('API verification failed:', await res.text());
          return null;
        }

        const user = await res.json();
        return user;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: nextAuthSecret,
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/handle-signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user }),
        });
        if (!res.ok) {
            console.error('SignIn handling failed:', await res.text());
            return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) token.id = user.id;
      if (account?.provider === 'google' && user.email) {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/get-jwt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email }),
        });
        if (res.ok) {
            const data = await res.json();
            token.id = data.id;
        } else {
            console.error('JWT handling failed:', await res.text());
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};