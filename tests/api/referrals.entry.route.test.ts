import { GET as referralEntry } from '@/app/r/[code]/route'

describe('GET /r/[code] - set referral cookie and redirect', () => {
  test('sets cookie and redirects to signin with ref param', async () => {
    const req = new Request('http://localhost/r/AB2CD')
    const res: any = await referralEntry(req as any, { params: { code: 'AB2CD' } } as any)

    // NextResponse implements .headers
    const setCookie = res.headers.get('set-cookie') || ''
    const location = res.headers.get('location') || ''

    expect(setCookie.toLowerCase()).toContain('referral_code=AB2CD'.toLowerCase())
    expect(location).toContain('/auth/signin')
    expect(location).toContain('ref=AB2CD')
  })
})

