import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { adminAuth } from '@/lib/firebase-admin';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const firebaseUser = await adminAuth.getUserByEmail(user.email);
          console.log(`User ${user.email} found in Firebase. Updating profile.`);
          await adminAuth.updateUser(firebaseUser.uid, {
            displayName: user.name,
            photoURL: user.image,
          });
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log(`User ${user.email} not found. Creating new user in Firebase.`);
            await adminAuth.createUser({
              uid: user.id,
              email: user.email,
              displayName: user.name,
              photoURL: user.image,
              emailVerified: true,
            });
          } else {
            console.error("SIGN-IN FAILED: An unexpected error occurred with Firebase:", error);
            return false;
          }
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { uid: string; name?: string | null; email?: string | null; image?: string | null }).uid = token.uid as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };