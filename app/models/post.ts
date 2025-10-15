// Post 功能在新数据库架构中已被移除
// 此文件保留为存根以避免破坏可能的依赖

export enum PostStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
}

export async function insertPost(post: any) {
  console.warn('Post feature is disabled in the new database architecture');
  return undefined;
}

export async function getAllPosts(
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  console.warn('Post feature is disabled in the new database architecture');
  return [];
}

export async function getPublishedPosts(
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  console.warn('Post feature is disabled in the new database architecture');
  return [];
}