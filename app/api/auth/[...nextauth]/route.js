import NextAuth from "next-auth";
import { authOptions } from "@/app/auth/config.ts";
console.log("NextAuth loaded")
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };