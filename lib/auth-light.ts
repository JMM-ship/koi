import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function getAuthLight(request: Request): Promise<{ uuid: string; email?: string } | null> {
  try {
    const nextReq = new NextRequest(request.url, { headers: request.headers })
    const token = await getToken({ req: nextReq, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return null
    const tuser: any = (token as any).user || {}
    const uuid = tuser.id || tuser.uuid || (token as any).sub
    if (!uuid) return null
    return { uuid, email: tuser.email }
  } catch {
    return null
  }
}

