// Mock environment variables for testing
try {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    // Only load jest-dom in jsdom environment
    require('@testing-library/jest-dom')
  }
} catch {}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
process.env.DIRECT_URL = process.env.TEST_DIRECT_URL || process.env.DIRECT_URL

// Global test setup
beforeAll(() => {
  console.log('🧪 Test suite starting...')
})

afterAll(() => {
  console.log('✅ Test suite completed')
})
