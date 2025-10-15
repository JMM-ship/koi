let capturedAuthorize: any

jest.mock('next-auth/providers/credentials', () => {
  return (options: any) => {
    capturedAuthorize = options.authorize
    return { id: 'credentials', name: 'credentials' }
  }
})

jest.mock('@/app/models/user', () => ({
  findUserByEmail: jest.fn(async () => undefined),
}))

jest.mock('@/app/models/db', () => ({
  prisma: {
    user: {
      create: jest.fn(async ({ data }: any) => ({ ...data, id: 'admin-id', avatarUrl: '' })),
      update: jest.fn(async ({ data }: any) => ({ ...data, id: 'admin-id' })),
    }
  }
}))

describe('Admin bootstrap on credentials login', () => {
  beforeAll(() => {
    // Import config after mocks so CredentialsProvider is intercepted
    jest.isolateModules(() => {
      require('@/app/auth/config')
    })
  })

  test('creates default admin when not exists and password matches', async () => {
    expect(typeof capturedAuthorize).toBe('function')
    const user = await capturedAuthorize({
      email: 'lijianjie@koi.com',
      password: 'Exitsea@2025',
      rememberMe: 'true'
    }, {} as any)
    expect(user).toBeTruthy()
    expect(user.role).toBe('admin')
    expect(user.email).toBe('lijianjie@koi.com')
  })
})
