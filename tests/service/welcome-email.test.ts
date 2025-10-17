/** @jest-environment node */
import nodemailer from 'nodemailer'

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn(async () => ({ messageId: 'mid' })) })),
}))

describe('sendWelcomeEmail', () => {
  test('sends welcome email successfully', async () => {
    const { sendWelcomeEmail } = await import('@/app/lib/email')
    const res = await sendWelcomeEmail('to@test.com')
    expect(res.success).toBe(true)
    const transport = (nodemailer.createTransport as jest.Mock).mock.results[0].value
    expect(transport.sendMail).toHaveBeenCalled()
    const call = (transport.sendMail as jest.Mock).mock.calls[0][0]
    expect(call.subject).toMatch(/Welcome/i)
    expect(call.to).toBe('to@test.com')
  })

  test('handles transporter error', async () => {
    const { getEmailTransporter, sendWelcomeEmail } = await import('@/app/lib/email')
    const t = getEmailTransporter() as any
    t.sendMail = jest.fn(async () => { throw new Error('SMTP Down') })
    const res = await sendWelcomeEmail('to@test.com')
    expect(res.success).toBe(false)
    expect(String(res.error || '')).toMatch(/SMTP Down/)
  })
})
