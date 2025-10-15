// Category 功能在新数据库架构中已被移除
// 此文件保留为存根以避免破坏可能的依赖

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

export const CategoryModel = {
  // 创建分类
  async create(data: CreateCategoryInput): Promise<Category> {
    console.warn('Category feature is disabled in the new database architecture');
    throw new Error('Category feature is disabled');
  },

  // 获取用户的所有分类
  async getByUserId(userId: string): Promise<Category[]> {
    console.warn('Category feature is disabled in the new database architecture');
    return [];
  },

  // 获取单个分类
  async getById(id: string, userId: string): Promise<Category | null> {
    console.warn('Category feature is disabled in the new database architecture');
    return null;
  },

  // 更新分类
  async update(
    id: string,
    userId: string,
    data: Partial<CreateCategoryInput>
  ): Promise<Category> {
    console.warn('Category feature is disabled in the new database architecture');
    throw new Error('Category feature is disabled');
  },

  // 删除分类
  async delete(id: string, userId: string): Promise<boolean> {
    console.warn('Category feature is disabled in the new database architecture');
    return false;
  },

  // 获取分类下的图片数量
  async getImageCount(categoryId: string, userId: string): Promise<number> {
    console.warn('Category feature is disabled in the new database architecture');
    return 0;
  },
};