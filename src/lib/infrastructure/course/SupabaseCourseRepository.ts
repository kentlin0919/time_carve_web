
import { Course, CourseSection } from "@/lib/domain/course/entity";
import { CourseRepository } from "@/lib/domain/course/repository";
import { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export class SupabaseCourseRepository implements CourseRepository {
  private supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.supabase = client || createClient();
  }

  async getAllPublicCourses(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from("courses")
      .select("*, course_tags(tags(name)), teacher_info!inner(is_public)")
      .eq("is_active", true)
      .eq("teacher_info.is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public courses:", error);
      return [];
    }

    return data.map(this.mapToEntity);
  }

  async getTeacherCourses(teacherId: string): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from("courses")
      .select("*, course_tags(tags(name))")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
      return [];
    }

    return data.map(this.mapToEntity);
  }

  async getCourse(id: string): Promise<Course | null> {
    const { data, error } = await this.supabase
      .from("courses")
      .select("*, course_tags(tags(name))")
      .eq("id", id)
      .single();

    if (error) return null;
    return this.mapToEntity(data);
  }

  async getByIds(ids: string[]): Promise<Course[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from("courses")
      .select("*, course_tags(tags(name))")
      .in("id", ids);

    if (error) {
      console.error("Error fetching courses by IDs:", error);
      return [];
    }

    return data.map(this.mapToEntity);
  }

  async createCourse(course: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course | null> {
    const { data, error } = await this.supabase
      .from("courses")
      .insert({
        teacher_id: course.teacherId,
        title: course.title,
        description: course.desc,
        content: course.content,
        course_type: course.courseType,
        duration_minutes: course.durationMinutes,
        price: course.price,
        image_url: course.imageUrl,
        location: course.location,
        is_active: course.isActive,
        sections: course.sections as any, // Cast to any for JSONB
        expected_learning_outcomes: course.expectedLearningOutcomes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating course:", error);
      return null;
    }

    if (course.tags && course.tags.length > 0) {
      await this.saveTags(data.id, course.teacherId, course.tags);
    }

    return this.getCourse(data.id);
  }

  async updateCourse(id: string, course: Partial<Course>): Promise<Course | null> {
    const updateData: any = {};
    if (course.title !== undefined) updateData.title = course.title;
    if (course.desc !== undefined) updateData.description = course.desc;
    if (course.content !== undefined) updateData.content = course.content;
    if (course.courseType !== undefined) updateData.course_type = course.courseType;
    if (course.durationMinutes !== undefined) updateData.duration_minutes = course.durationMinutes;
    if (course.price !== undefined) updateData.price = course.price;
    if (course.imageUrl !== undefined) updateData.image_url = course.imageUrl;
    if (course.location !== undefined) updateData.location = course.location;
    if (course.isActive !== undefined) updateData.is_active = course.isActive;
    if (course.sections !== undefined) updateData.sections = course.sections;
    if (course.expectedLearningOutcomes !== undefined) updateData.expected_learning_outcomes = course.expectedLearningOutcomes;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("courses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating course:", error);
      return null;
    }

    if (course.tags !== undefined) {
      // Need teacherId. Fallback to existing data's teacher_id if not in partial update
      let teacherId = course.teacherId;
      if (!teacherId && data) {
        teacherId = data.teacher_id || undefined;
      }
      if (teacherId) {
        await this.saveTags(id, teacherId, course.tags);
      }
    }

    return this.getCourse(id);
  }

  private async saveTags(courseId: string, teacherId: string, tags: { text: string }[]) {
    // 1. Resolve Tag IDs (create if not exists)
    const tagIds: string[] = [];

    for (const tag of tags) {
      const tagName = tag.text.trim();
      if (!tagName) continue;

      // Check existence: Search for my tag OR a global tag
      const { data: existingTags } = await this.supabase
        .from("tags")
        .select("id, teacher_id")
        .or(`teacher_id.eq.${teacherId},teacher_id.is.null`)
        .eq("name", tagName);

      let targetTagId: string | null = null;

      if (existingTags && existingTags.length > 0) {
        targetTagId = existingTags[0].id;
      } else {
        // Create new personal tag
        const { data: newTag, error } = await this.supabase
          .from("tags")
          .insert({ teacher_id: teacherId, name: tagName })
          .select("id")
          .single();

        if (newTag) targetTagId = newTag.id;
        else if (error) console.error("Error creating tag:", error);
      }

      if (targetTagId) {
        tagIds.push(targetTagId);
      }
    }

    // 2. Sync course_tags
    // First, remove all existing tags for this course
    await this.supabase.from("course_tags").delete().eq("course_id", courseId);

    // Then insert new links
    if (tagIds.length > 0) {
      // De-duplicate tag IDs in case logic pushed same ID twice
      const uniqueTagIds = Array.from(new Set(tagIds));
      const links = uniqueTagIds.map(tagId => ({
        course_id: courseId,
        tag_id: tagId
      }));
      const { error } = await this.supabase.from("course_tags").insert(links);
      if (error) console.error("Error linking tags:", error);
    }
  }

  async deleteCourse(id: string): Promise<void> {
    const { error } = await this.supabase.from("courses").delete().eq("id", id);
    if (error) console.error("Error deleting course:", error);
  }

  private mapToEntity(data: any): Course {
    const mappedTags = data.course_tags?.map((item: any) => ({
      text: item.tags?.name || "",
      icon: "label"
    })).filter((t: any) => t.text) || [];

    return {
      id: data.id,
      teacherId: data.teacher_id,
      title: data.title,
      desc: data.description || "",
      content: data.content || "",
      courseType: data.course_type,
      durationMinutes: data.duration_minutes,
      price: data.price,
      imageUrl: data.image_url,
      location: data.location,
      isActive: data.is_active,
      status: data.is_active ? "active" : "draft",
      sections: (data.sections as CourseSection[]) || [],
      expectedLearningOutcomes: data.expected_learning_outcomes || [],

      // Default UI fields
      icon: "school",
      iconColor: "blue",
      tags: mappedTags,
      priceUnit: "小時",

      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
