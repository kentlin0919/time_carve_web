import { Portfolio, PortfolioMedia, PortfolioType } from '@/lib/domain/portfolio/entity';
import { PortfolioRepository } from '@/lib/domain/portfolio/repository';
import { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export class SupabasePortfolioRepository implements PortfolioRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  async getById(id: string): Promise<Portfolio | null> {
    const { data, error } = await this.client
      .from('portfolios')
      .select(`
        *,
        portfolio_media (*),
        portfolio_tags (
          tags (name)
        ),
        type:portfolio_types (*)
      `) // Added portfolio_types join

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
    const { data, error } = await this.client
      .from('portfolios')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get portfolios by teacher: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    }

    return data.map((item: any) => this.mapToEntity(item));
  }

  async getPublishedPortfolios(limit: number = 10): Promise<Portfolio[]> {
    const { data, error } = await this.client
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

    return data.map((item: any) => this.mapToEntity(item));
  }

  async create(data: Partial<Portfolio>): Promise<Portfolio> {
    // Exclude virtual fields and undefined values
    const { media, tags, type, ...dbData } = data;

    // Ensure strict type for insert
    const insertData: any = { ...dbData };

    const { data: result, error } = await this.client
      .from('portfolios')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create portfolio: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return this.mapToEntity(result);
  }

  async update(id: string, data: Partial<Portfolio>): Promise<Portfolio> {
    console.log('[Repo] Updating portfolio:', id);
    const { media, tags, ...dbData } = data;

    // Filter out fields that should not be updated directly or are join relations
    const {
      id: _id,
      teacher_id,
      created_at,
      updated_at,
      views_count,
      likes_count,
      portfolio_media, // Join field to exclude
      portfolio_tags,  // Join field to exclude
      type,            // Join field to exclude
      ...editableFields
    } = dbData as any;

    const updateData = { ...editableFields };
    console.log('[Repo] Update payload:', JSON.stringify(updateData, null, 2));

    const { data: result, error } = await this.client
      .from('portfolios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Repo] Update error:', error);
      throw new Error(`Failed to update portfolio: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    }
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('portfolios')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete portfolio: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  async addMedia(data: Partial<PortfolioMedia>): Promise<PortfolioMedia> {
    const { data: result, error } = await this.client
      .from('portfolio_media')
      .insert(data as any)
      .select()
      .single();

    if (error) throw new Error(`Failed to add media: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return result as PortfolioMedia;
  }

  async deleteMedia(id: string): Promise<void> {
    const { error } = await this.client
      .from('portfolio_media')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete media: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  async updateMediaOrder(id: string, order: number): Promise<void> {
    const { error } = await this.client
      .from('portfolio_media')
      .update({ sort_order: order })
      .eq('id', id);

    if (error) throw new Error(`Failed to update media order: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  async updateTags(portfolioId: string, tagIds: string[]): Promise<void> {
    // 1. Delete existing tags
    await this.client
      .from('portfolio_tags')
      .delete()
      .eq('portfolio_id', portfolioId);

    if (tagIds.length === 0) return;

    // 2. Insert new tags
    const { error } = await this.client
      .from('portfolio_tags')
      .insert(
        tagIds.map(tagId => ({
          portfolio_id: portfolioId,
          tag_id: tagId
        }))
      );

    if (error) throw new Error(`Failed to update tags: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  // Types
  async getTypesByTeacherId(teacherId: string): Promise<PortfolioType[]> {
    const { data, error } = await this.client
      .from('portfolio_types')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get portfolio types: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return data as PortfolioType[] || [];
  }

  async createType(data: Partial<PortfolioType>): Promise<PortfolioType> {
    const { data: result, error } = await this.client
      .from('portfolio_types')
      .insert(data as any)
      .select()
      .single();

    if (error) throw new Error(`Failed to create type: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return result as PortfolioType;
  }

  async updateType(id: string, data: Partial<PortfolioType>): Promise<PortfolioType> {
    const { data: result, error } = await this.client
      .from('portfolio_types')
      .update(data as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update type: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return result as PortfolioType;
  }

  async deleteType(id: string): Promise<void> {
    const { error } = await this.client
      .from('portfolio_types')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete type: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  private mapToEntity(data: any): Portfolio {
    return {
      ...data,
      status: data.status as any,
      tags: data.portfolio_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [],
      media: data.portfolio_media || [],
      type: data.type || null // Map joined type
    };
  }
}
