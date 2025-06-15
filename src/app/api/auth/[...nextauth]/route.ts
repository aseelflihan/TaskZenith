// D:\applications\tasks\4\src\app\api\auth\[...nextauth]\route.ts

import NextAuth, { type NextAuthOptions } from 'next-auth';
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
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
            return null;
        }

        try {
          const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
          if (!decodedToken || !decodedToken.uid) {
            return null;
          }
          
          const userRecord = await adminAuth.getUser(decodedToken.uid);
          
          return {
            id: userRecord.uid,
            name: userRecord.displayName,
            email: userRecord.email,
            image: userRecord.photoURL,
          };

        } catch (error) {
          console.error("Firebase ID Token validation error:", error);
          return null;
        }
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/auth/signin',
  },

  callbacks: {
    // This callback ensures that a user record is created in Firebase Auth
    // when they sign in with Google for the first time.
    async signIn({ user, account }) {
        if (account?.provider === 'google' && user.email) {
            try {
                // Check if user already exists
                await adminAuth.getUserByEmail(user.email);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // If not, create them
                    await adminAuth.createUser({
                        uid: user.id, // Important: Use the id from the provider
                        email: user.email,
                        displayName: user.name,
                        photoURL: user.image,
                        emailVerified: true
                    });
                } else {
                    // For other errors, prevent sign in
                    return false;
                }
            }
        }
        // For all other cases (Credentials, Email link handled by Credentials),
        // we trust that the user record was already handled.
        return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        
        // If signing in with Google, we need to get the UID from Firebase Auth
        // as the `user.id` from the provider might differ from the Firebase UID
        if (account?.provider === "google" && user.email) {
           const firebaseUser = await adminAuth.getUserByEmail(user.email);
           token.id = firebaseUser.uid;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };