// D:\applications\tasks\TaskZenith\src\app\api\auth\[...nextauth]\route.ts
// -- CORRECTED CODE FOR REDIRECT ISSUE --

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
                        emailVerified: true
                    });
                } else {
                    console.error("SignIn Error:", error);
                    return false;
                }
            }
        }
        return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        
        if (account?.provider === "google" && user.email) {
           try {
             const firebaseUser = await adminAuth.getUserByEmail(user.email);
             token.id = firebaseUser.uid;
           } catch (error) {
             console.error("Error fetching firebase user in JWT callback:", error);
           }
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

    // --- START: CORRECTED REDIRECT LOGIC ---
    async redirect({ url, baseUrl }) {
      // This function now robustly handles redirection.

      // If the user is trying to go to a relative path within the app, allow it.
      // This is important for deep linking (e.g., trying to access /dashboard/reports before login).
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If the user is being redirected to a URL on the same host, allow it.
      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // This is the default case. After any successful login (from Google or Credentials),
      // or in any other unspecified scenario, the user will be safely
      // redirected to the dashboard. This is the new, reliable default.
      return `${baseUrl}/dashboard`;
    }
    // --- END: CORRECTED REDIRECT LOGIC ---
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };