import { prisma } from "./db";
import { Category as PrismaCategory } from "@prisma/client";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  user_id: string;
  name: string;
  color?: string;
  sort_order?: number;
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaCategory(category: PrismaCategory | null): Category | null {
  if (!category) return null;
  
  return {
    id: category.id,
    user_id: category.userId,
    name: category.name,
    color: category.color,
    sort_order: category.sortOrder,
    created_at: category.createdAt.toISOString(),
    updated_at: category.updatedAt.toISOString(),
  };
}

export const CategoryModel = {
  // 创建分类
  async create(data: CreateCategoryInput): Promise<Category> {
    try {
      const category = await prisma.category.create({
        data: {
          userId: data.user_id,
          name: data.name,
          color: data.color || 'blue',
          sortOrder: data.sort_order || 0,
        },
      });
      
      const result = fromPrismaCategory(category);
      if (!result) throw new Error("Failed to create category");
      return result;
    } catch (error) {
      throw error;
    }
  },

  // 获取用户的所有分类
  async getByUserId(userId: string): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          userId: userId,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      });
      
      return categories.map(fromPrismaCategory).filter(Boolean) as Category[];
    } catch (error) {
      throw error;
    }
  },

  // 获取单个分类
  async getById(id: string, userId: string): Promise<Category | null> {
    try {
      const category = await prisma.category.findFirst({
        where: {
          id: id,
          userId: userId,
        },
      });
      
      return fromPrismaCategory(category);
    } catch (error) {
      return null;
    }
  },

  // 更新分类
  async update(
    id: string,
    userId: string,
    data: Partial<CreateCategoryInput>
  ): Promise<Category> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order;
      
      const category = await prisma.category.update({
        where: {
          id: id,
          userId: userId,
        },
        data: updateData,
      });
      
      const result = fromPrismaCategory(category);
      if (!result) throw new Error("Failed to update category");
      return result;
    } catch (error) {
      throw error;
    }
  },

  // 删除分类
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.category.delete({
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

  // 获取分类下的图片数量
  async getImageCount(categoryId: string, userId: string): Promise<number> {
    try {
      const count = await prisma.image.count({
        where: {
          categoryId: categoryId,
          userId: userId,
        },
      });
      return count;
    } catch (error) {
      throw error;
    }
  },
};