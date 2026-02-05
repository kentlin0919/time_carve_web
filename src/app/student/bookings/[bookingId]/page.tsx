import Link from "next/link";
import { notFound } from "next/navigation";
import { SupabaseBookingRepository } from "@/lib/infrastructure/booking/SupabaseBookingRepository";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface BookingDetailProps {
  params: Promise<{
    bookingId: string;
  }>;
}

export default async function BookingDetailPage({ params }: BookingDetailProps) {
  const { bookingId } = await params;

  const supabase = await createClient();
  const bookingRepo = new SupabaseBookingRepository(supabase);
  const booking = await bookingRepo.getBookingById(bookingId);

  if (!booking) {
    return notFound();
  }

  let teacherName = booking.teacherName;
  let teacherTitle = booking.teacherTitle;
  let teacherEmail = booking.teacherEmail;
  let teacherPhone = booking.teacherPhone;
  let teacherAvatar = booking.teacherAvatar;

  if (!teacherName || !teacherTitle || !teacherEmail || !teacherPhone || !teacherAvatar) {
    try {
      const admin = createAdminClient();
      const { data: teacherData } = await admin
        .from("teacher_info")
        .select(
          `
          title,
          user_info (
            name,
            email,
            phone,
            avatar_url
          )
        `
        )
        .eq("id", booking.teacherId)
        .single();

      teacherName = teacherName || teacherData?.user_info?.name || "";
      teacherTitle = teacherTitle || teacherData?.title || "";
      teacherEmail = teacherEmail || teacherData?.user_info?.email || "";
      teacherPhone = teacherPhone || teacherData?.user_info?.phone || null;
      teacherAvatar = teacherAvatar || teacherData?.user_info?.avatar_url || null;
    } catch (e) {
      // Fail silently, fallback to "未知教師"
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}年 ${date.getMonth() + 1
        }月 ${date.getDate()}日`;
    } catch (e) {
      return dateStr;
    }
  };

  const statusConfig = {
    confirmed: {
      bg: "bg-green-100 dark:bg-green-900/40",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-800/50",
      icon: "check_circle",
      label: "已確認",
    },
    pending: {
      bg: "bg-orange-100 dark:bg-orange-900/40",
      text: "text-orange-700 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800/50",
      icon: "hourglass_top",
      label: "待確認",
    },
    cancelled: {
      bg: "bg-red-100 dark:bg-red-900/40",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800/50",
      icon: "cancel",
      label: "已取消",
    },
    rejected: { // Handle rejected status if mapped
      bg: "bg-red-100 dark:bg-red-900/40",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800/50",
      icon: "cancel",
      label: "已拒絕",
    }
  };

  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="container mx-auto max-w-[1024px] p-6 md:p-10 flex flex-col gap-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/student/bookings"
          className="hover:text-primary dark:hover:text-primary-dark transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          返回預約列表
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-display font-black leading-tight tracking-tight mb-2">
            預約詳情
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            訂單編號 #{booking.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${status.bg} ${status.text} border ${status.border}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {status.icon}
            </span>
            {status.label}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Course & Schedule Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Info Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold mb-3">
                      <span className="material-symbols-outlined text-[16px]">
                        school
                      </span>
                      {booking.courseType || "一般課程"}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                      {booking.courseTitle}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {booking.courseDescription || "無課程描述"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    日期與時間
                  </p>
                  <p className="text-slate-900 dark:text-white font-bold text-lg">
                    {formatDate(booking.bookingDate)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    {booking.startTime} - {booking.endTime}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="size-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    上課地點
                  </p>
                  <p className="text-slate-900 dark:text-white font-bold text-lg">
                    {booking.location?.split(" - ")[0] || "線上課程"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    {booking.location?.split(" - ")[1] || ""}
                  </p>
                  <a
                    className="text-primary text-xs font-bold mt-1 inline-flex items-center hover:underline"
                    href="#"
                  >
                    查看地圖{" "}
                    <span className="material-symbols-outlined text-[14px]">
                      arrow_outward
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Teacher Notes - Show both booking notes (often used as teacher notes) */}
            {booking.teacherNotes && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-3 mb-2">
                  <span className="material-symbols-outlined text-slate-400">
                    info
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    教師備註與課前提醒
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm pl-9 leading-relaxed">
                  {booking.teacherNotes}
                </p>
              </div>
            )}
          </div>

          {/* Course Sections - 詳細教案內容 */}
          {booking.courseSections && booking.courseSections.length > 0 && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    menu_book
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                    詳細教案內容
                  </h3>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  共 {booking.courseSections.length} 個單元
                </span>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                {booking.courseSections.map((section: any, idx: number) => (
                  <div
                    key={section.id || idx}
                    className="relative pl-8 pb-6 last:pb-0 border-l-2 border-slate-200 dark:border-slate-700 last:border-l-0"
                  >
                    {/* Section Number Circle */}
                    <div className="absolute -left-4 top-0 size-8 rounded-full bg-primary/10 border-2 border-surface-light dark:border-surface-dark flex items-center justify-center text-primary font-bold text-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </div>

                    {/* Section Content */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 ml-2">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                        {section.title}
                      </h4>

                      {/* 學習目標 */}
                      {section.learningObjective && (
                        <div className="mb-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold mb-2">
                            <span className="material-symbols-outlined text-[14px]">
                              flag
                            </span>
                            學習目標
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            {section.learningObjective}
                          </p>
                        </div>
                      )}

                      {/* 單元重點 */}
                      {section.keyPoints && section.keyPoints.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            單元重點
                          </p>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {section.keyPoints.map((point: string, pointIdx: number) => (
                              <li
                                key={pointIdx}
                                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                              >
                                <span className="text-primary mt-0.5">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Teacher & Payment */}
        <div className="flex flex-col gap-6">
          {/* Teacher Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              授課教師
            </h3>
            <div className="flex items-center gap-4 mb-6">
              {teacherAvatar ? (
                <img
                  src={teacherAvatar}
                  alt={teacherName || "教師"}
                  className="size-14 rounded-full object-cover"
                />
              ) : (
                <div className="size-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 overflow-hidden relative">
                  <span className="material-symbols-outlined text-[32px]">
                    person
                  </span>
                </div>
              )}
              <div>
                <p className="text-slate-900 dark:text-white font-bold text-lg">
                  {teacherName || "未知教師"}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {teacherTitle || "教師"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Email
                  </span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {teacherEmail || "未提供"}
                  </span>
                </div>
                {teacherPhone ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      電話
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {teacherPhone}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <a
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all flex items-center justify-center gap-2"
                  href={
                    teacherEmail
                      ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                          teacherEmail
                        )}&su=${encodeURIComponent(
                          `關於課程「${booking.courseTitle}」的詢問`
                        )}&body=${encodeURIComponent(
                          `老師您好：\n\n我想詢問「${booking.courseTitle}」的課程內容與上課安排。\n預約日期：${formatDate(
                            booking.bookingDate
                          )}\n上課時間：${booking.startTime} - ${booking.endTime}\n\n謝謝老師！`
                        )}`
                      : "#"
                  }
                  target={teacherEmail ? "_blank" : undefined}
                  rel={teacherEmail ? "noopener noreferrer" : undefined}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    mail
                  </span>
                  Email
                </a>
                {teacherPhone ? (
                  <a
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all flex items-center justify-center gap-2"
                    href={`tel:${teacherPhone}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      call
                    </span>
                    致電
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                付款資訊
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${booking.paymentStatus === "paid"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                  }`}
              >
                {booking.paymentStatus === "paid" ? "已付款" : "待付款"}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  課程費用
                </span>
                <span className="font-medium text-slate-800 dark:text-white">
                  NT$ {(booking.coursePrice || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  付款方式
                </span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {booking.paymentMethod || "尚未付款"}
                </span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-white">
                  總計
                </span>
                <span className="font-black text-xl text-primary-dark dark:text-primary">
                  NT$ {(booking.price || booking.coursePrice || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-4 md:p-6 sticky bottom-6 z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <button className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-bold text-sm flex items-center gap-2 px-2 py-2 transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              cancel
            </span>
            取消預約
          </button>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              申請改期
            </button>
            <Link
              href="/student/bookings"
              className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-bold text-sm hover:bg-slate-800 dark:hover:bg-primary-dark shadow-lg shadow-slate-200 dark:shadow-none transition-all text-center"
            >
              返回列表
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
