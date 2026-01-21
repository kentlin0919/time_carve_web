
export type PortfolioStatus = 'draft' | 'published' | 'archived';

export interface PortfolioMedia {
  id: string;
  portfolio_id: string;
  file_url: string;
  file_type: 'image' | 'video' | null;
  sort_order: number | null;
  created_at: string | null;
}

export interface Portfolio {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string | null;
  cover_image_url: string | null;
  status: PortfolioStatus;
  allow_comments: boolean | null;
  publish_at: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;

  // Virtual/Joined fields
  media?: PortfolioMedia[];
  tags?: string[]; // Simplified tag names
}
