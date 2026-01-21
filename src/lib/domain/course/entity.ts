
export interface CourseSection {
  id: string; // UUID
  title: string;
  learningObjective?: string; // 學習目標
  keyPoints?: string[]; // 單元重點 (可動態新增多個)
  duration?: number; // minutes
  isFree?: boolean; // Can be viewed without purchasing
  content?: string; // HTML or Markdown content
  assets?: {
    type: "video" | "pdf" | "link";
    url: string;
    title: string;
  }[];
}

export interface Course {
  id: string;
  teacherId: string;
  title: string;
  desc?: string;
  content?: string; // Rich text content
  courseType: string; // 'online' | 'offline' | 'hybrid'
  durationMinutes: number;
  price?: number;
  location?: string;
  isActive: boolean;
  sections?: CourseSection[]; // JSONB
  imageUrl?: string | null;
  expectedLearningOutcomes?: string[]; // 預期學習成果
  
  // UI Fields (Optional or derived)
  icon?: string;
  iconColor?: string;
  tags?: { icon: string; text: string }[];
  priceUnit?: string;
  status?: "active" | "draft" | "archived";

  createdAt: string;
  updatedAt: string;
}
