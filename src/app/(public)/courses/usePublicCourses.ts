import { useState, useEffect } from 'react';
import { Course } from '@/lib/domain/course/entity';
import { SupabaseCourseRepository } from '@/lib/infrastructure/course/SupabaseCourseRepository';

export function usePublicCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const courseRepo = new SupabaseCourseRepository();
        const publicCourses = await courseRepo.getAllPublicCourses();
        setCourses(publicCourses);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "載入課程失敗");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  return { courses, loading, error };
}
