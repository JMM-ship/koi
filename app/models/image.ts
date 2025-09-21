// Image 功能在新数据库架构中已被移除
// 此文件保留为存根以避免破坏可能的依赖

export interface Image {
  id: string;
  user_id: string;
  file_url: string;
  thumbnail_url: string;
  name: string;
  category_id?: string;
  tags?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateImageInput {
  user_id: string;
  file_url: string;
  thumbnail_url: string;
  name: string;
  category_id?: string;
  tags?: string[];
  is_public?: boolean;
}

export const ImageModel = {
  // 创建图片记录
  async create(data: CreateImageInput): Promise<Image | null> {
    console.warn('Image feature is disabled in the new database architecture');
    return null;
  },

  // 获取用户的图片列表
  async getByUserId(
    userId: string,
    options?: {
      categoryId?: string;
      page?: number;
      pageSize?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'name';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ images: Image[]; total: number }> {
    console.warn('Image feature is disabled in the new database architecture');
    return { images: [], total: 0 };
  },

  // 获取单个图片
  async getById(id: string, userId: string): Promise<Image | null> {
    console.warn('Image feature is disabled in the new database architecture');
    return null;
  },

  // 更新图片信息
  async update(
    id: string,
    userId: string,
    data: Partial<CreateImageInput>
  ): Promise<Image | null> {
    console.warn('Image feature is disabled in the new database architecture');
    return null;
  },

  // 删除图片
  async delete(id: string, userId: string): Promise<boolean> {
    console.warn('Image feature is disabled in the new database architecture');
    return false;
  },

  // 批量删除图片
  async deleteMany(ids: string[], userId: string): Promise<number> {
    console.warn('Image feature is disabled in the new database architecture');
    return 0;
  },

  // 获取公开的图片列表
  async getPublicImages(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ images: Image[]; total: number }> {
    console.warn('Image feature is disabled in the new database architecture');
    return { images: [], total: 0 };
  },
};