import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      uuid?: string
      email?: string | null
      name?: string | null
      nickname?: string
      image?: string | null
      avatar_url?: string
      created_at?: string
      role?: string
    }
  }

  interface User {
    id?: string
    uuid?: string
    email?: string | null
    name?: string | null
    nickname?: string
    image?: string | null
    avatar_url?: string
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      uuid?: string
      email?: string
      nickname?: string
      avatar_url?: string
      created_at?: string
      role?: string
    }
  }
}