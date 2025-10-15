import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/config";
import { headers } from "next/headers";

export async function getAuth(request?: Request) {
  // 如果传入了 request，尝试从 request headers 获取 session
  // 否则使用 getServerSession
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return null;
  }

  // 返回用户信息
  // session.user 应该包含 uuid, email, nickname, avatar_url 等字段
  const user = session.user as any;
  return {
    uuid: user.id || user.id || user.email, // 优先使用 uuid
    email: user.email,
    name: user.nickname || user.name,
    image: user.avatar_url || user.image,
    role: user.role || 'user',
    planType: user.planType || 'free',
    totalCredits: user.totalCredits || 0
  };
}

export async function requireAuth(request?: Request) {
  const user = await getAuth(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}