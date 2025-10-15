import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthLight } from '@/lib/auth-light'
import { getMockAuth } from '@/lib/auth-mock'
import { decryptApiKey } from '@/app/lib/crypto'

export async function GET(request: Request, ctx: { params: { id: string } }) {
  try {
    let user = await getAuthLight(request)
    if (!user && process.env.NODE_ENV === 'development') {
      user = await getMockAuth()
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keyId = ctx.params?.id
    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    const key = await prisma.apiKey.findFirst({ where: { id: keyId, ownerUserId: user.uuid, NOT: { status: 'deleted' } } })
    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const meta: any = key.meta || {}
    const encryptedKey: string | undefined = meta?.key_encrypted || meta?.keyEncrypted
    if (!encryptedKey) {
      return NextResponse.json({ code: 'NO_ENCRYPTED_KEY', error: 'This API key cannot be revealed. Please create a new key.' }, { status: 422 })
    }

    let fullKey: string
    try {
      fullKey = decryptApiKey(encryptedKey, key.id)
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 })
    }

    // Masked display for UI; avoid logging full key anywhere
    const masked = key.prefix ? `${key.prefix}...****` : `${fullKey.substring(0, 7)}...****`

    return NextResponse.json({
      success: true,
      apiKey: {
        id: key.id,
        title: key.name || 'Untitled Key',
        apiKey: masked,
        fullKey,
        createdAt: key.createdAt,
        status: key.status || 'active',
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to show API key' }, { status: 500 })
  }
}
