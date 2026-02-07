"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStudentCourses } from "./useStudentCourses";

export default function StudentCoursesPage() {
  const router = useRouter();
  const { courses, loading, error } = useStudentCourses();
  const [selectedHours, setSelectedHours] = useState<{ [key: string]: number }>(
    {}
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    courseType: "all",
    priceMin: "",
    priceMax: "",
    durationMin: "",
    durationMax: "",
    includeInquiry: true,
    selectedTags: [] as string[],
  });
  const [sortBy, setSortBy] = useState("created_desc");

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((course) => {
      course.tags?.forEach((tag) => {
        if (tag.text) set.add(tag.text);
      });
    });
    return Array.from(set).slice(0, 12);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    const priceMin = filters.priceMin ? Number(filters.priceMin) : null;
    const priceMax = filters.priceMax ? Number(filters.priceMax) : null;
    const durationMin = filters.durationMin ? Number(filters.durationMin) : null;
    const durationMax = filters.durationMax ? Number(filters.durationMax) : null;
    const selectedTags = new Set(filters.selectedTags);

    return courses.filter((course) => {
      if (keyword) {
        const haystack = `${course.title} ${course.desc ?? ""}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      if (filters.courseType !== "all") {
        if (course.courseType !== filters.courseType) return false;
      }

      if (!filters.includeInquiry && !course.price) return false;

      if (priceMin !== null) {
        if (!course.price || course.price < priceMin) return false;
      }

      if (priceMax !== null) {
        if (!course.price || course.price > priceMax) return false;
      }

      if (durationMin !== null && course.durationMinutes < durationMin)
        return false;
      if (durationMax !== null && course.durationMinutes > durationMax)
        return false;

      if (selectedTags.size > 0) {
        const courseTags = course.tags?.map((tag) => tag.text) ?? [];
        const hasMatch = courseTags.some((tag) => selectedTags.has(tag));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [courses, filters]);

  const sortedCourses = useMemo(() => {
    const list = [...filteredCourses];
    list.sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated_desc":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "price_asc":
          return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
        case "price_desc":
          return (b.price ?? -1) - (a.price ?? -1);
        case "duration_asc":
          return a.durationMinutes - b.durationMinutes;
        case "duration_desc":
          return b.durationMinutes - a.durationMinutes;
        case "title_asc":
          return a.title.localeCompare(b.title, "zh-Hant");
        default:
          return 0;
      }
    });
    return list;
  }, [filteredCourses, sortBy]);

  const handleHourChange = (courseId: string, delta: number) => {
    setSelectedHours((prev) => {
      const current = prev[courseId] || 1; // Default 1 hour
      const next = Math.max(1, current + delta);
      return { ...prev, [courseId]: next };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-slate-50 dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-background-dark p-6">
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 mb-4">
          <p className="font-bold">發生錯誤</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          重試
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative h-full bg-slate-50 dark:bg-background-dark">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary-dark">
            <span className="material-symbols-outlined text-[20px]">
              dentistry
            </span>
          </div>
          <span className="font-bold text-slate-800 dark:text-white">
            牙雕家教
          </span>
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="container mx-auto max-w-[1280px] p-6 md:p-10 flex flex-col gap-8 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-display font-black leading-tight tracking-tight mb-2">
              課程方案選擇
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl">
              探索您的專屬課程，靈活選擇適合您的學習時數。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">
                  filter_list
                </span>
                篩選課程
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 mt-3 w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-5 z-30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-900 dark:text-white font-bold">
                      篩選條件
                    </span>
                    <button
                      onClick={() =>
                        setFilters({
                          keyword: "",
                          courseType: "all",
                          priceMin: "",
                          priceMax: "",
                          durationMin: "",
                          durationMax: "",
                          includeInquiry: true,
                          selectedTags: [],
                        })
                      }
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      清除篩選
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                        關鍵字
                      </label>
                      <input
                        value={filters.keyword}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            keyword: e.target.value,
                          }))
                        }
                        placeholder="輸入課程名稱或描述"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                        課程型態
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "all", label: "全部" },
                          { value: "online", label: "線上課程" },
                          { value: "offline", label: "實體課程" },
                          { value: "hybrid", label: "混合課程" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                courseType: option.value,
                              }))
                            }
                            className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                              filters.courseType === option.value
                                ? "bg-primary text-white border-primary"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                          價格下限
                        </label>
                        <input
                          type="number"
                          value={filters.priceMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              priceMin: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                          價格上限
                        </label>
                        <input
                          type="number"
                          value={filters.priceMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              priceMax: e.target.value,
                            }))
                          }
                          placeholder="不限"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                          時長下限(分鐘)
                        </label>
                        <input
                          type="number"
                          value={filters.durationMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              durationMin: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                          時長上限(分鐘)
                        </label>
                        <input
                          type="number"
                          value={filters.durationMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              durationMax: e.target.value,
                            }))
                          }
                          placeholder="不限"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={filters.includeInquiry}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            includeInquiry: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                      />
                      包含洽詢課程
                    </label>

                    {tagOptions.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                          標籤
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {tagOptions.map((tag) => {
                            const isSelected = filters.selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    selectedTags: isSelected
                                      ? prev.selectedTags.filter((t) => t !== tag)
                                      : [...prev.selectedTags, tag],
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                  isSelected
                                    ? "bg-primary text-white border-primary"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        已篩選 {filteredCourses.length} / {courses.length} 門
                      </span>
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold"
                      >
                        套用
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setIsSortOpen((prev) => !prev);
                  setIsFilterOpen(false);
                }}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">
                  sort
                </span>
                排序方式
              </button>
              {isSortOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 z-30">
                  {[
                    { value: "created_desc", label: "最新上架" },
                    { value: "updated_desc", label: "最近更新" },
                    { value: "price_asc", label: "價格低到高" },
                    { value: "price_desc", label: "價格高到低" },
                    { value: "duration_asc", label: "時長短到長" },
                    { value: "duration_desc", label: "時長長到短" },
                    { value: "title_asc", label: "標題 A-Z" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                        sortBy === option.value
                          ? "bg-primary text-white"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            共 {sortedCourses.length} 門課程
          </span>
          {filters.keyword && (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              關鍵字：{filters.keyword}
            </span>
          )}
          {filters.courseType !== "all" && (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              類型：
              {filters.courseType === "online"
                ? "線上"
                : filters.courseType === "offline"
                ? "實體"
                : "混合"}
            </span>
          )}
          {(filters.priceMin || filters.priceMax) && (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              價格：{filters.priceMin || "0"} - {filters.priceMax || "不限"}
            </span>
          )}
          {(filters.durationMin || filters.durationMax) && (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              時長：{filters.durationMin || "0"} - {filters.durationMax || "不限"} 分
            </span>
          )}
          {filters.selectedTags.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              標籤：{filters.selectedTags.join(" / ")}
            </span>
          )}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">
              menu_book
            </span>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
              老師目前沒有開設課程
            </p>
            <p className="text-sm mt-2">
              請耐心等待老師建立課程，或聯繫您的老師了解更多資訊。
            </p>
          </div>
        )}

        {courses.length > 0 && sortedCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">
              menu_book
            </span>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
              沒有符合條件的課程
            </p>
            <p className="text-sm mt-2">
              請調整篩選條件，或聯繫老師了解更多資訊。
            </p>
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {sortedCourses.map((course, index) => {
            const currentHours = selectedHours[course.id] || 1;
            const totalPrice = (course.price || 0) * currentHours;

            const bgImage = course.imageUrl?.trim() || "";

            return (
              <div
                key={course.id}
                className="bg-surface-light dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-700 shadow-soft overflow-hidden group flex flex-col h-full hover:border-primary/50 dark:hover:border-primary/50 trans-all"
              >
                <div className="h-56 relative overflow-hidden">
                  {bgImage ? (
                    <Image
                      src={bgImage}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {course.courseType === "online" ? "線上課程" : "實體課程"}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white text-2xl font-bold leading-tight shadow-black drop-shadow-md mb-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 text-white/90 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          schedule
                        </span>{" "}
                        {course.durationMinutes
                          ? `${course.durationMinutes} 分鐘/堂`
                          : "彈性時間"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-6 flex-1">
                  <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {course.desc || "暫無課程描述"}
                    </p>

                    {/* Tags Preview */}
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {course.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md"
                          >
                            {tag.text}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Hour Selection */}
                    <div className="pt-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">
                        選擇預約時數
                      </label>
                      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => handleHourChange(course.id, -1)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm hover:text-primary active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined">
                            remove
                          </span>
                        </button>
                        <div className="flex-1 text-center">
                          <span className="text-lg font-black text-slate-800 dark:text-white">
                            {currentHours}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
                            小時
                          </span>
                        </div>
                        <button
                          onClick={() => handleHourChange(course.id, 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm hover:text-primary active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-bold uppercase">
                        預估費用
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-primary-dark dark:text-primary">
                          {course.price
                            ? `NT$ ${totalPrice.toLocaleString()}`
                            : "洽詢"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/student/courses/${course.id}`)
                      }
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-dark dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-none transition-all flex items-center gap-2 group-hover:scale-105"
                    >
                      查看詳情
                      <span className="material-symbols-outlined text-[20px]">
                        visibility
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action - Keep this generic */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-display font-bold mb-4">
                需要客製化課程？
              </h2>
              <p className="text-indigo-100 text-lg">
                如果您有特殊的學習需求，歡迎直接與老師聯繫討論。
              </p>
            </div>
            <button className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined">chat</span>
              聯繫老師
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
