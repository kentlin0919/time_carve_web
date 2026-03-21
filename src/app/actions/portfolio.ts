'use server';

import { SupabasePortfolioRepository } from '@/lib/infrastructure/portfolio/SupabasePortfolioRepository';
import { Portfolio } from '@/lib/domain/portfolio/entity';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// 每次呼叫時建立新的 Repository 實例以獲取最新的 session
async function getRepository() {
  const supabase = await createClient();
  return new SupabasePortfolioRepository(supabase);
}

// Helper to sanitize filenames for Supabase Storage
function sanitizeFileName(originalName: string): string {
  // Extract extension
  const parts = originalName.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const name = parts.join('.');

  // Sanitize name: keep only a-z A-Z 0-9 - _
  const safeName = name.replace(/[^a-zA-Z0-9\-_]/g, '');

  // If safeName is empty (e.g. all Chinese), use a default
  // We use a short random string to avoid collisions if multiple files are named "image.png" (though timestamp helps)
  const finalName = safeName || 'unnamed';

  return ext ? `${finalName}.${ext}` : finalName;
}

export async function getTeacherPortfolios(teacherId: string) {
  const repository = await getRepository();
  return await repository.getByTeacherId(teacherId);
}

export async function getPortfolioById(id: string) {
  const repository = await getRepository();
  return await repository.getById(id);
}

export async function createPortfolio(data: Partial<Portfolio>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Quick fetch teacher id
  const { data: teacher } = await supabase
    .from('teacher_info')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!teacher) throw new Error('Teacher profile not found');

  const repository = await getRepository();
  const newPortfolio = await repository.create({
    ...data,
    teacher_id: teacher.id
  });

  revalidatePath('/teacher/portfolio');
  return newPortfolio;
}

export async function updatePortfolio(id: string, data: Partial<Portfolio>) {
  const repository = await getRepository();
  const updated = await repository.update(id, data);
  revalidatePath('/teacher/portfolio');
  revalidatePath(`/teacher/portfolio/${id}`);
  return updated;
}

export async function deletePortfolio(id: string) {
  const repository = await getRepository();
  await repository.delete(id);
  revalidatePath('/teacher/portfolio');
}

export async function uploadPortfolioMedia(formData: FormData) {
  const file = formData.get('file') as File;
  const portfolioId = formData.get('portfolioId') as string;
  const description = formData.get('description') as string | null;

  if (!file || !portfolioId) throw new Error('Missing file or portfolio ID');

  const supabase = await createClient();
  const fileName = `${portfolioId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { data, error } = await supabase.storage
    .from('portfolio-media')
    .upload(fileName, file);

  if (error) {
    console.error("uploadPortfolioMedia storage upload failed", {
      portfolioId,
      fileName,
      originalFileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      error,
    });
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('portfolio-media')
    .getPublicUrl(fileName);

  const repository = await getRepository();
  try {
    return await repository.addMedia({
      portfolio_id: portfolioId,
      file_url: publicUrl,
      file_type: file.type.startsWith('video') ? 'video' : 'image',
      description: description || null,
      sort_order: 0
    });
  } catch (error) {
    console.error("uploadPortfolioMedia database insert failed", {
      portfolioId,
      fileName,
      publicUrl,
      fileType: file.type,
      error,
    });
    throw error;
  }
}

export async function updatePortfolioMedia(mediaId: string, data: { description?: string | null, sort_order?: number }) {
  const repository = await getRepository();
  // We need to extend repository to support updateMedia, but for now let's see if we can add it to repo or use direct supbase
  // Since we are in actions, we can just use repository. 
  // Wait, I need to check if repository has updateMedia. If not I should add it.
  // For now I'll use repository.updateMedia if it exists or add it.
  // actually let's check repository first. 
  // Assuming I will add it to repository.

  // Let's implement it directly here if repository doesn't have it, OR better, add to repository.
  // But to be safe and quick, I can use the supabase client directly here for the update if repository is strict.
  // However, sticking to pattern:
  const supabase = await createClient();
  const { error } = await supabase
    .from('portfolio_media')
    .update(data)
    .eq('id', mediaId);

  if (error) throw error;

  revalidatePath('/teacher/portfolio');
}

export async function deletePortfolioMedia(mediaId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('portfolio_media')
    .delete()
    .eq('id', mediaId);

  if (error) throw error;

  revalidatePath('/teacher/portfolio');
}

export async function uploadPortfolioCoverImage(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) throw new Error('Missing file');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const fileName = `covers/${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { data, error } = await supabase.storage
    .from('portfolio-media')
    .upload(fileName, file, {
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('portfolio-media')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Portfolio Types Actions
export async function getPortfolioTypes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const repository = await getRepository();
  // Assuming teacher_id is same as user.id as per schema
  return await repository.getTypesByTeacherId(user.id);
}

export async function createPortfolioType(data: { name: string, sort_order?: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const repository = await getRepository();
  const result = await repository.createType({
    ...data,
    teacher_id: user.id
  });
  revalidatePath('/teacher/portfolio/types');
  revalidatePath('/teacher/portfolio'); // Also revalidate main list/edit forms likely to use this
  return result;
}

export async function updatePortfolioType(id: string, data: { name?: string, sort_order?: number }) {
  const repository = await getRepository();
  const result = await repository.updateType(id, data);
  revalidatePath('/teacher/portfolio/types');
  revalidatePath('/teacher/portfolio');
  return result;
}

export async function deletePortfolioType(id: string) {
  const repository = await getRepository();
  await repository.deleteType(id);
  revalidatePath('/teacher/portfolio/types');
  revalidatePath('/teacher/portfolio');
}

/**
 * Upload an image from rich text editor content
 * Returns the public URL of the uploaded image
 */
export async function uploadContentImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;

  if (!file) throw new Error('Missing file');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const fileName = `content/${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage
    .from('portfolio-media')
    .upload(fileName, file, {
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('portfolio-media')
    .getPublicUrl(fileName);

  return publicUrl;
}
