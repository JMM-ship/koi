import { getSupabaseClient } from "./db";

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

export const ImageModel = {
  // 创建图片记录
  async create(data: CreateImageInput): Promise<Image> {
    const supabase = getSupabaseClient();
    const { data: image, error } = await supabase
      .from("images")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return image;
  },

  // 获取用户的所有图片
  async getByUserId(
    userId: string,
    categoryId?: string | null,
    limit = 50,
    offset = 0
  ): Promise<{ images: Image[]; total: number }> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("images")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId === null) {
      // 查询未分类的图片
      query = query.is("category_id", null);
    } else if (categoryId) {
      // 查询特定分类的图片
      query = query.eq("category_id", categoryId);
    }

    const { data: images, error, count } = await query;

    if (error) throw error;
    return { images: images || [], total: count || 0 };
  },

  // 获取单个图片
  async getById(id: string, userId: string): Promise<Image | null> {
    const supabase = getSupabaseClient();
    const { data: image, error } = await supabase
      .from("images")
      .select()
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return image;
  },

  // 更新图片信息
  async update(
    id: string,
    userId: string,
    data: Partial<CreateImageInput>
  ): Promise<Image> {
    const supabase = getSupabaseClient();
    const { data: image, error } = await supabase
      .from("images")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return image;
  },

  // 删除图片
  async delete(id: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("images")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  },

  // 批量删除图片
  async deleteMany(ids: string[], userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("images")
      .delete()
      .in("id", ids)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  },
};