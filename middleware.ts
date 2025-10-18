import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 获取 token 来验证用户是否已登录
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 定义需要保护的路由
  const protectedPaths = ["/dashboard"];

  // 定义登录后应该重定向的路由（仅登录页，不包括首页）
  const authPaths = ["/auth/signin"];

  // 检查当前路径是否需要保护
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 检查是否在认证相关页面
  const isAuthPath = authPaths.some((path) => pathname === path);

  // 如果是保护路由且未登录，重定向到登录页
  if (isProtected && !token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 如果已登录且在登录页，重定向到 dashboard
  // 移除首页的自动重定向，让用户可以访问首页
  if (token && isAuthPath) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*|public).*)",
  ],
};
