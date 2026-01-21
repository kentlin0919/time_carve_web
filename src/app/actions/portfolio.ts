'use server';

import { SupabasePortfolioRepository } from '@/lib/infrastructure/portfolio/SupabasePortfolioRepository';
import { Portfolio } from '@/lib/domain/portfolio/entity';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const repository = new SupabasePortfolioRepository();

export async function getTeacherPortfolios(teacherId: string) {
  return await repository.getByTeacherId(teacherId);
}

export async function getPortfolioById(id: string) {
  return await repository.getById(id);
}

export async function createPortfolio(data: Partial<Portfolio>) {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();
  
  // Get teacher ID from user ID
  // Ideally this should be handled by a service or context, but for MVP we fetch it here or assume caller passes it?
  // Actually, secure way is to fetch teacher_id related to auth.uid()
  
  if (!user) throw new Error('Unauthorized');
  
  // Quick fetch teacher id
  const { data: teacher } = await (await supabase)
    .from('teacher_info')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!teacher) throw new Error('Teacher profile not found');

  const newPortfolio = await repository.create({
    ...data,
    teacher_id: teacher.id
  });

  revalidatePath('/teacher/portfolio');
  return newPortfolio;
}

export async function updatePortfolio(id: string, data: Partial<Portfolio>) {
  const updated = await repository.update(id, data);
  revalidatePath('/teacher/portfolio');
  revalidatePath(`/teacher/portfolio/${id}`);
  return updated;
}

export async function deletePortfolio(id: string) {
  await repository.delete(id);
  revalidatePath('/teacher/portfolio');
}

export async function uploadPortfolioMedia(formData: FormData) {
  const file = formData.get('file') as File;
  const portfolioId = formData.get('portfolioId') as string;
  
  if (!file || !portfolioId) throw new Error('Missing file or portfolio ID');

  const supabase = await createClient();
  const fileName = `${portfolioId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('portfolio-media') // Need to create this bucket!
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('portfolio-media')
    .getPublicUrl(fileName);

  return await repository.addMedia({
    portfolio_id: portfolioId,
    file_url: publicUrl,
    file_type: file.type.startsWith('video') ? 'video' : 'image',
    sort_order: 0
  });
}

export async function uploadPortfolioCoverImage(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) throw new Error('Missing file');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Unauthorized');

  const fileName = `covers/${user.id}/${Date.now()}-${file.name}`;

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
