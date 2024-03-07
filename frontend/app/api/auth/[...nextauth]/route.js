import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()


export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
    callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true
    },
    async redirect({ url, baseUrl }) {
      return baseUrl
    },
    async session({ session, user, token }) {
      if (session?.user) {
        session.user.id = user.id;
        // Fetch the user from the Prisma database
        try {
          const prismaUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
    
          if (!prismaUser) {
            console.error(`User with id ${user.id} not found in the database.`);
            return session;
          }
          if (prismaUser.secret) {
            session.user.secret = prismaUser.secret;
          }
          // Assign the background and useBackground fields to session.user
          if (prismaUser.background && prismaUser.useBackground) {
            session.user.background = prismaUser.background;
            session.user.useBackground = prismaUser.useBackground;
          } else {
            console.error(`User with id ${user.id} does not have background or useBackground fields.`);
          }
        } catch (error) {
          console.error(`Error fetching user from the database: ${error.message}`);
        }
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
  // Choose how you want to save the user session.
  // The default is `"jwt"`, an encrypted JWT (JWE) stored in the session cookie.
  // If you use an `adapter` however, we default it to `"database"` instead.
  // You can still force a JWT session by explicitly defining `"jwt"`.
  // When using `"database"`, the session cookie will only contain a `sessionToken` value,
  // which is used to look up the session in the database.
  strategy: "database",

  // Seconds - How long until an idle session expires and is no longer valid.
  maxAge: 30 * 24 * 60 * 60, // 30 days

  // Seconds - Throttle how frequently to write to database to extend a session.
  // Use it to limit write operations. Set to 0 to always update the database.
  // Note: This option is ignored if using JSON Web Tokens
  updateAge: 24 * 60 * 60, // 24 hours
  
},
adapter: PrismaAdapter(prisma),
pages: {
    signIn: '/auth/signin',
  //  signOut: '/auth/signout',
  //  error: '/auth/error', // Error code passed in query string as ?error=
  //  verifyRequest: '/auth/verify-request', // (used for check email message)
  //  newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
