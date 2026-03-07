"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createBooking } from "@/app/actions/booking";
import { getTeacherStudents } from "@/app/actions/student";
import { getTeacherCourses } from "@/app/actions/teacher";
import { useRouter } from "next/navigation";
import { Course } from "@/lib/domain/course/entity";
import { useModal } from "@/components/providers/ModalContext";
import { TimeSlotSelector, TimeRange } from "../availability/TimeSlotSelector";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  teacherId: string;
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  onSuccess,
  teacherId,
}: CreateBookingDialogProps) {
  const router = useRouter();
  const { showModal } = useModal();

  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  // Initial Fetch
  useEffect(() => {
    if (open) {
      console.log("Dialog open, fetching data for teacherId:", teacherId);
      const fetchData = async () => {
        try {
          const [studentsData, coursesData] = await Promise.all([
            getTeacherStudents(),
            getTeacherCourses(teacherId),
          ]);
          console.log("Students fetched:", studentsData);
          console.log("Courses fetched:", coursesData);
          setStudents(studentsData);
          setCourses(coursesData);
        } catch (error) {
          console.error("Failed to fetch initial data:", error);
          showModal({
            type: "error",
            title: "載入失敗",
            description: "無法載入學生或課程列表",
            confirmText: "確定",
          });
        }
      };
      fetchData();
    }
  }, [open, teacherId]);

  const handleSubmit = async () => {
    if (
      !selectedStudentId ||
      !selectedCourseId ||
      !date ||
      !startTime ||
      !endTime
    ) {
      showModal({
        type: "error",
        title: "資料不完整",
        description: "請填寫所有必填欄位",
        confirmText: "確定",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createBooking({
        teacherId,
        studentId: selectedStudentId,
        courseId: selectedCourseId,
        bookingDate: date ? format(date, "yyyy-MM-dd") : "",
        startTime,
        endTime,
        notes,
      });

      if (!result.success) {
        throw new Error(result.error || "預約建立失敗");
      }

      showModal({
        type: "success",
        title: "預約建立成功",
        description: "已成功為學生建立預約",
        confirmText: "確定",
      });

      onOpenChange(false);
      resetForm();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error("Failed to create booking:", error);
      showModal({
        type: "error",
        title: "預約建立失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        confirmText: "確定",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudentId("");
    setSelectedCourseId("");
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增學生預約</DialogTitle>
          <DialogDescription>手動為您的學生建立課程預約。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="student">選擇學生</Label>
            <select
              id="student"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">請選擇學生...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course">選擇課程</Label>
            <select
              id="course"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
              value={selectedCourseId}
              onChange={(e) => {
                const courseId = e.target.value;
                setSelectedCourseId(courseId);
                // Auto-set duration logic could go here if needed
              }}
            >
              <option value="">請選擇課程...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.price}元 / {c.durationMinutes}分鐘)
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>預約日期</Label>
            <DatePicker date={date} setDate={setDate} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">開始時間</Label>
              <select
                id="startTime"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                <option value="">選擇時間</option>
                {Array.from({ length: 48 }).map((_, i) => {
                  const h = Math.floor(i / 2).toString().padStart(2, "0");
                  const m = i % 2 === 0 ? "00" : "30";
                  const time = `${h}:${m}`;
                  return (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">結束時間</Label>
              <select
                id="endTime"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                <option value="">選擇時間</option>
                {Array.from({ length: 48 }).map((_, i) => {
                  const h = Math.floor(i / 2).toString().padStart(2, "0");
                  const m = i % 2 === 0 ? "00" : "30";
                  const time = `${h}:${m}`;
                  return (
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">備註 (選填)</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="填寫課程重點或其他事項..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            {loading ? "處理中..." : "建立預約"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
