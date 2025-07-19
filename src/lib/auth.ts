// src/lib/auth.ts
import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { adminAuth } from '@/lib/firebase-admin';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        idToken: { label: 'ID Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;
        try {
          const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
          if (!decodedToken?.uid) return null;

          const userRecord = await adminAuth.getUser(decodedToken.uid);
          return {
            id: userRecord.uid,
            name: userRecord.displayName,
            email: userRecord.email,
            image: userRecord.photoURL,
          };
        } catch (error) {
          console.error('Firebase ID Token validation error:', error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          await adminAuth.getUserByEmail(user.email);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            await adminAuth.createUser({
              uid: user.id,
              email: user.email,
              displayName: user.name,
              photoURL: user.image,
              emailVerified: true,
            });
          } else {
            console.error('SignIn Error:', error);
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) token.id = user.id;
      if (account?.provider === 'google' && user.email) {
        try {
          const firebaseUser = await adminAuth.getUserByEmail(user.email);
          token.id = firebaseUser.uid;
        } catch (error) {
          console.error('Error fetching firebase user in JWT callback:', error);
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