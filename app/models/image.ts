import { prisma } from "./db";
import { Image as PrismaImage } from "@prisma/client";

export interface Image {
  id: string;
  user_id: string;
  file_url: string;
  thumbnail_url: string;
  name: string;
  category_id?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateImageInput {
  user_id: string;
  file_url: string;
  thumbnail_url: string;
  name: string;
  category_id?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaImage(image: PrismaImage | null): Image | null {
  if (!image) return null;
  
  return {
    id: image.id,
    user_id: image.userId,
    file_url: image.fileUrl,
    thumbnail_url: image.thumbnailUrl,
    name: image.name,
    category_id: image.categoryId || undefined,
    file_size: image.fileSize || undefined,
    mime_type: image.mimeType || undefined,
    width: image.width || undefined,
    height: image.height || undefined,
    created_at: image.createdAt.toISOString(),
    updated_at: image.updatedAt.toISOString(),
  };
}

export const ImageModel = {
  // 创建图片记录
  async create(data: CreateImageInput): Promise<Image> {
    try {
      const image = await prisma.image.create({
        data: {
          userId: data.user_id,
          fileUrl: data.file_url,
          thumbnailUrl: data.thumbnail_url,
          name: data.name,
          categoryId: data.category_id || null,
          fileSize: data.file_size || null,
          mimeType: data.mime_type || null,
          width: data.width || null,
          height: data.height || null,
        },
      });
      
      const result = fromPrismaImage(image);
      if (!result) throw new Error("Failed to create image");
      return result;
    } catch (error) {
      throw error;
    }
  },

  // 获取用户的所有图片
  async getByUserId(
    userId: string,
    categoryId?: string | null,
    limit = 50,
    offset = 0
  ): Promise<{ images: Image[]; total: number }> {
    try {
      const where: any = {
        userId: userId,
      };

      if (categoryId === null) {
        // 查询未分类的图片
        where.categoryId = null;
      } else if (categoryId) {
        // 查询特定分类的图片
        where.categoryId = categoryId;
      }

      const [images, total] = await Promise.all([
        prisma.image.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.image.count({ where }),
      ]);

      return {
        images: images.map(fromPrismaImage).filter(Boolean) as Image[],
        total,
      };
    } catch (error) {
      throw error;
    }
  },

  // 获取单个图片
  async getById(id: string, userId: string): Promise<Image | null> {
    try {
      const image = await prisma.image.findFirst({
        where: {
          id: id,
          userId: userId,
        },
      });
      
      return fromPrismaImage(image);
    } catch (error) {
      return null;
    }
  },

  // 更新图片
  async update(
    id: string,
    userId: string,
    data: Partial<CreateImageInput>
  ): Promise<Image> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.category_id !== undefined) updateData.categoryId = data.category_id;
      if (data.file_size !== undefined) updateData.fileSize = data.file_size;
      if (data.mime_type !== undefined) updateData.mimeType = data.mime_type;
      if (data.width !== undefined) updateData.width = data.width;
      if (data.height !== undefined) updateData.height = data.height;
      
      const image = await prisma.image.update({
        where: {
          id: id,
          userId: userId,
        },
        data: updateData,
      });
      
      const result = fromPrismaImage(image);
      if (!result) throw new Error("Failed to update image");
      return result;
    } catch (error) {
      throw error;
    }
  },

  // 删除图片
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.image.delete({
        where: {
          id: id,
          userId: userId,
        },
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  // 批量删除图片
  async deleteMany(ids: string[], userId: string): Promise<number> {
    try {
      const result = await prisma.image.deleteMany({
        where: {
          id: {
            in: ids,
          },
          userId: userId,
        },
      });
      return result.count;
    } catch (error) {
      throw error;
    }
  },

  // 批量更新图片分类
  async updateCategory(
    imageIds: string[],
    categoryId: string | null,
    userId: string
  ): Promise<number> {
    try {
      const result = await prisma.image.updateMany({
        where: {
          id: {
            in: imageIds,
          },
          userId: userId,
        },
        data: {
          categoryId: categoryId,
        },
      });
      return result.count;
    } catch (error) {
      throw error;
    }
  },

  // 获取用户的图片总数
  async getTotalCount(userId: string): Promise<number> {
    try {
      const count = await prisma.image.count({
        where: {
          userId: userId,
        },
      });
      return count;
    } catch (error) {
      throw error;
    }
  },
};