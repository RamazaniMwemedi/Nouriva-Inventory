import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { eq } from 'drizzle-orm';
import { db, sellers } from './db';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID!,
      clientSecret: process.env.NEXT_PUBLIC_AUTH_GOOGLE_SECRET!
    })
  ],
  callbacks: {
    // SignIn callback
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      // Check if seller exists
      const existingSeller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.email, user.email))
        .limit(1);

      let sellerId: number;

      if (existingSeller.length === 0) {
        // If seller doesn't exist, insert a new seller and get the new ID
        const newSeller = await db
          .insert(sellers)
          .values({
            sellerName: user.name!,
            email: user.email!,
            contactPhone: '',
            passwordHash: '',
            role: 'seller',
            address: '',
            companyName: '',
            websiteUrl: '',
            country: '',
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning({ id: sellers.id }); // Return the ID of the inserted seller

        sellerId = newSeller[0].id;
      } else {
        // Seller exists, get their ID
        sellerId = existingSeller[0].id;
      }

      // Store the seller ID in the token for use in the session
      user.id = String(sellerId); // Add the seller ID to the user object
      return true;
    },

    // JWT callback
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id as string; // Use the seller's database ID
      }
      return token;
    },

    // Session callback
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.id) {
        if (session.user) {
          session.user.id = token.id as string; // Ensure `id` is typed as a string
        }
      }
      return session;
    }
  }
});
