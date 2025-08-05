import NextAuth from "next-auth";
import { authOptions } from "./config";

// NextAuth v4 不使用 handlers
export default NextAuth(authOptions);

// 为了兼容性，导出一个 auth 函数
export { authOptions };
