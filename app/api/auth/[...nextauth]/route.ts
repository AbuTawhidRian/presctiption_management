import NextAuth,{AuthOptions} from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { debug } from "console";

export const authOptions: AuthOptions = {
  //configure the adapter to use prisma
  adapter: PrismaAdapter(db),

  //configure the providers
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      //this is the main login logic
      async authorize(credentials) {
        //check if email and password are provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }
        //find the user by email
        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password");
        }

        //compare the provided password with the hashed password
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        //if the password is incorrect, throw an error
        if (!isPasswordCorrect) {
          throw new Error("Invalid email or password");
        }

        //if everything is fine, return the user object
        //we remove the password before returning the user
        const { hashedPassword, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  //use json web token for session management
  session: {
    strategy: "jwt",
  },

  //callbacks to controll what is in the token and session
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      //on sign in, add the user to the token and id
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      //add id and role to the session object, so we can access it on the client side
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  //set the secret from the .env file
  secret: process.env.NEXTAUTH_SECRET,

  //set the custom login page
  pages: {
    signIn: "/login",
  },

  //Enable debug mode in development
  debug: process.env.NODE_ENV === "development",
};

//export the NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
