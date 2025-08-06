import { getServerSession } from "next-auth";
import { authOptions } from "./config";

export async function auth() {
  return await getServerSession(authOptions);
}