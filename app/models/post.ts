import { prisma } from "./db";
import { Post as PrismaPost } from "@prisma/client";

export enum PostStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
}

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaPost(post: any): any {
  return {
    uuid: post.uuid,
    slug: post.slug || null,
    title: post.title || null,
    description: post.description || null,
    content: post.content || null,
    status: post.status || null,
    coverUrl: post.cover_url || null,
    authorName: post.author_name || null,
    authorAvatarUrl: post.author_avatar_url || null,
    locale: post.locale || null,
  };
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaPost(post: PrismaPost | null): any | undefined {
  if (!post) return undefined;
  
  return {
    id: post.id,
    uuid: post.uuid,
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.content,
    created_at: post.createdAt.toISOString(),
    updated_at: post.updatedAt.toISOString(),
    status: post.status,
    cover_url: post.coverUrl,
    author_name: post.authorName,
    author_avatar_url: post.authorAvatarUrl,
    locale: post.locale,
  };
}

export async function insertPost(post: any) {
  try {
    const data = await prisma.post.create({
      data: toPrismaPost(post),
    });
    return fromPrismaPost(data);
  } catch (error) {
    throw error;
  }
}

export async function updatePost(uuid: string, post: Partial<any>) {
  try {
    const updateData: any = {};
    if (post.slug !== undefined) updateData.slug = post.slug;
    if (post.title !== undefined) updateData.title = post.title;
    if (post.description !== undefined) updateData.description = post.description;
    if (post.content !== undefined) updateData.content = post.content;
    if (post.status !== undefined) updateData.status = post.status;
    if (post.cover_url !== undefined) updateData.coverUrl = post.cover_url;
    if (post.author_name !== undefined) updateData.authorName = post.author_name;
    if (post.author_avatar_url !== undefined) updateData.authorAvatarUrl = post.author_avatar_url;
    if (post.locale !== undefined) updateData.locale = post.locale;
    
    const data = await prisma.post.update({
      where: { uuid },
      data: updateData,
    });
    return fromPrismaPost(data);
  } catch (error) {
    throw error;
  }
}

export async function findPostByUuid(uuid: string): Promise<any | undefined> {
  try {
    const post = await prisma.post.findUnique({
      where: { uuid },
    });
    return fromPrismaPost(post);
  } catch (error) {
    return undefined;
  }
}

export async function findPostBySlug(slug: string): Promise<any | undefined> {
  try {
    const post = await prisma.post.findFirst({
      where: { slug },
    });
    return fromPrismaPost(post);
  } catch (error) {
    return undefined;
  }
}

export async function getPosts(
  page: number = 1,
  limit: number = 50,
  status?: string
): Promise<any[] | undefined> {
  try {
    const posts = await prisma.post.findMany({
      where: status ? { status } : undefined,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return posts.map(fromPrismaPost);
  } catch (error) {
    return undefined;
  }
}

export async function getPostsTotal(status?: string): Promise<number | undefined> {
  try {
    const count = await prisma.post.count({
      where: status ? { status } : undefined,
    });
    return count;
  } catch (error) {
    return undefined;
  }
}

export async function deletePost(uuid: string) {
  try {
    const data = await prisma.post.delete({
      where: { uuid },
    });
    return fromPrismaPost(data);
  } catch (error) {
    throw error;
  }
}