// src/lib/auth.ts
import { type NextAuthOptions, type Account, type User } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// Ensure environment variables are set, providing a clear error message if not.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleClientId || !googleClientSecret || !nextAuthSecret) {
  throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or NEXTAUTH_SECRET environment variables');
}

// Function to refresh the access token
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    console.log('🔄 Attempting to refresh access token...');
    
    if (!token.refreshToken) {
      console.error('❌ No refresh token available');
      throw new Error('No refresh token available');
    }

    const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
      client_id: googleClientId!,
      client_secret: googleClientSecret!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    });

    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('❌ Token refresh failed:', refreshedTokens);
      throw refreshedTokens;
    }

    console.log('✅ Access token refreshed successfully');
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid profile email https://www.googleapis.com/auth/calendar.events"
        }
      }
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
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: Account | null }): Promise<JWT> {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        if (account.provider === 'google') {
          token.accessToken = account.access_token;
          // Persist the refresh token
          if (account.refresh_token) {
            token.refreshToken = account.refresh_token;
          }
          token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : 0;
          
          // Fetch internal user ID
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
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};