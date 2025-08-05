import { getSupabaseClient } from "./db";

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
    const supabase = getSupabaseClient();
    const { data: category, error } = await supabase
      .from("categories")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return category;
  },

  // 获取用户的所有分类
  async getByUserId(userId: string): Promise<Category[]> {
    const supabase = getSupabaseClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select()
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return categories || [];
  },

  // 获取单个分类
  async getById(id: string, userId: string): Promise<Category | null> {
    const supabase = getSupabaseClient();
    const { data: category, error } = await supabase
      .from("categories")
      .select()
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return category;
  },

  // 更新分类
  async update(
    id: string,
    userId: string,
    data: Partial<CreateCategoryInput>
  ): Promise<Category> {
    const supabase = getSupabaseClient();
    const { data: category, error } = await supabase
      .from("categories")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return category;
  },

  // 删除分类
  async delete(id: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  },

  // 获取分类下的图片数量
  async getImageCount(categoryId: string, userId: string): Promise<number> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from("images")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId)
      .eq("user_id", userId);

    if (error) throw error;
    return count || 0;
  },
};