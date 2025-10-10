import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthLight } from '@/lib/auth-light'
import { getMockAuth } from '@/lib/auth-mock'
import { decryptApiKey } from '@/app/lib/crypto'
import crypto from 'crypto'

function hashApiKey(rawKey: string): string {
  const pepper = process.env.ENCRYPTION_KEY || ''
  return crypto.createHash('sha256').update(rawKey + pepper).digest('hex')
}

export async function POST(request: Request) {
  try {
    let user = await getAuthLight(request)
    if (!user && process.env.NODE_ENV === 'development') {
      user = await getMockAuth()
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.uuid

    const existingActive = await prisma.apiKey.findFirst({ where: { ownerUserId: userId, status: 'active' } })

    // Find an available key from pool
    const availableKey = await prisma.apiKey.findFirst({ where: { ownerUserId: null, status: 'active' }, orderBy: { createdAt: 'desc' } })
    if (!availableKey) {
      return NextResponse.json(
        { error: 'No available API keys. Please contact support.' },
        { status: 503 }
      )
    }

    const meta = (availableKey.meta || {}) as any
    const encryptedKey: string | undefined = meta?.key_encrypted || meta?.keyEncrypted
    if (!encryptedKey) {
      return NextResponse.json(
        { code: 'POOL_KEY_INVALID', error: 'Invalid API key configuration: missing encrypted key. Please contact support.' },
        { status: 500 }
      )
    }

    let actualKey: string
    try {
      actualKey = decryptApiKey(encryptedKey, availableKey.id)
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to decrypt API key. Please contact support.' },
        { status: 500 }
      )
    }

    const computedHash = hashApiKey(actualKey)
    if (availableKey.keyHash && availableKey.keyHash !== computedHash) {
      return NextResponse.json(
        { error: 'Key integrity check failed. Please contact support.' },
        { status: 500 }
      )
    }
    if (availableKey.prefix && !actualKey.startsWith(availableKey.prefix)) {
      return NextResponse.json(
        { error: 'Key prefix mismatch. Please contact support.' },
        { status: 500 }
      )
    }

    // Claim new key first
    const updated = await prisma.apiKey.updateMany({
      where: { id: availableKey.id, ownerUserId: null, status: 'active' },
      data: {
        ownerUserId: userId,
        name: existingActive?.name || 'My API Key',
      }
    })
    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'The API key was assigned to another user. Please try again.' },
        { status: 409 }
      )
    }

    // Soft-delete old active (if any)
    if (existingActive) {
      await prisma.apiKey.update({ where: { id: existingActive.id }, data: { status: 'deleted' } })
    }

    const result = await prisma.apiKey.findUnique({ where: { id: availableKey.id } })
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to retrieve the assigned API key.' },
        { status: 500 }
      )
    }

    const masked = result.prefix ? `${result.prefix}...****` : `${actualKey.substring(0, 7)}...****`

    return NextResponse.json({
      success: true,
      apiKey: {
        id: result.id,
        title: result.name || 'My API Key',
        apiKey: masked,
        fullKey: actualKey,
        createdAt: result.createdAt,
        status: result.status,
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to rotate API key'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
