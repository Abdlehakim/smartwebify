// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  // Extend the built-in session and user objects
  interface Session {
      user: {
        _id: string;
        name?: string | null;
        email?: string | null;
        role?: string | null; 
      } & DefaultSession['user'];
    }

  interface User {
    // This is what is returned by your `authorize` or OAuth providers
    valid?: boolean;
  }
}

// Extend the JWT interface as well
declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      valid?: boolean;
    };
  }
}
