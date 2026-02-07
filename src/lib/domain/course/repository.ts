import { Course } from "./entity";

export interface CourseRepository {
  getAllPublicCourses(): Promise<Course[]>;
  getTeacherCourses(teacherId: string): Promise<Course[]>;
  getCourse(id: string): Promise<Course | null>;
  getByIds(ids: string[]): Promise<Course[]>;
  createCourse(course: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course | null>;
  updateCourse(id: string, course: Partial<Course>): Promise<Course | null>;
  deleteCourse(id: string): Promise<void>;
}
