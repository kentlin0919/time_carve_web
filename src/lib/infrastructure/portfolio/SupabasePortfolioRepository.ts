import { createClient } from '@/lib/supabase/client';
import { Portfolio, PortfolioMedia } from '@/lib/domain/portfolio/entity';
import { PortfolioRepository } from '@/lib/domain/portfolio/repository';
import { Database } from '@/types/database.types';

export class SupabasePortfolioRepository implements PortfolioRepository {
  private supabase = createClient();

  async getById(id: string): Promise<Portfolio | null> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_media (*),
        portfolio_tags (
          tags (name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching portfolio:', error);
      return null;
    }

    if (!data) return null;

    return this.mapToEntity(data);
  }

  async getByTeacherId(teacherId: string): Promise<Portfolio[]> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(item => this.mapToEntity(item));
  }

  async getPublishedPortfolios(limit: number = 10): Promise<Portfolio[]> {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select(`
        *,
        teacher:teacher_info(
           id,
           user:user_info(name, avatar_url),
           title
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
       console.error(error);
       return [];
    }

    return data.map(item => this.mapToEntity(item));
  }

  async create(data: Partial<Portfolio>): Promise<Portfolio> {
    // Exclude virtual fields and undefined values
    const { media, tags, ...dbData } = data;
    
    // Ensure strict type for insert
    const insertData: any = { ...dbData };

    const { data: result, error } = await this.supabase
      .from('portfolios')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<Portfolio>): Promise<Portfolio> {
    const { media, tags, ...dbData } = data;
     const updateData: any = { ...dbData };

    const { data: result, error } = await this.supabase
      .from('portfolios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('portfolios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async addMedia(data: Partial<PortfolioMedia>): Promise<PortfolioMedia> {
    const { data: result, error } = await this.supabase
      .from('portfolio_media')
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;
    return result as PortfolioMedia;
  }

  async deleteMedia(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('portfolio_media')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateMediaOrder(id: string, order: number): Promise<void> {
    const { error } = await this.supabase
      .from('portfolio_media')
      .update({ sort_order: order })
      .eq('id', id);

    if (error) throw error;
  }

  async updateTags(portfolioId: string, tagIds: string[]): Promise<void> {
    // 1. Delete existing tags
    await this.supabase
      .from('portfolio_tags')
      .delete()
      .eq('portfolio_id', portfolioId);

    if (tagIds.length === 0) return;

    // 2. Insert new tags
    const { error } = await this.supabase
      .from('portfolio_tags')
      .insert(
        tagIds.map(tagId => ({
          portfolio_id: portfolioId,
          tag_id: tagId
        }))
      );

    if (error) throw error;
  }

  private mapToEntity(data: any): Portfolio {
    return {
      ...data,
      status: data.status as any,
      tags: data.portfolio_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [],
      media: data.portfolio_media || []
    };
  }
}
