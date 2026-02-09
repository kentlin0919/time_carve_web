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
import { updateBookingStatus } from "@/app/actions/booking"; // We might need to implement this
import { Booking } from "@/lib/domain/booking/entity";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";

interface EditBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: EditBookingDialogProps) {
  const router = useRouter();
  const { showModal } = useModal();
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setStatus(booking.status);
    }
  }, [booking]);

  // Check if booking is in the past to allow "completed"
  const isPast = () => {
    if (!booking) return false;
    const now = new Date();
    // Create date object from booking date and end time
    const endDateTime = new Date(`${booking.bookingDate}T${booking.endTime}`);
    return now > endDateTime;
  };

  const canComplete = isPast();

  const handleSave = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      // We will need to implement updateBookingStatus action
      await updateBookingStatus(booking.id, status as any);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error("Failed to update booking", error);
      showModal({ type: "error", title: "更新失敗", description: "請稍後再試", confirmText: "確定" });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>編輯預約</DialogTitle>
          <DialogDescription>您可以變更預約狀態或加入備註。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="student" className="text-right text-slate-500">
              學生
            </Label>
            <div className="col-span-3 font-medium text-slate-900 dark:text-white">
              {booking.studentName}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="course" className="text-right text-slate-500">
              課程
            </Label>
            <div className="col-span-3 font-medium text-slate-900 dark:text-white">
              {booking.courseTitle}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right text-slate-500">
              時間
            </Label>
            <div className="col-span-3 font-medium text-slate-900 dark:text-white">
              {booking.bookingDate} {booking.startTime.substring(0, 5)}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-500">
              付款狀態
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              {booking.paymentStatus === 'paid' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <span className="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span>
                  已付款 ({booking.paymentMethod || '線上付款'})
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <span className="w-1.5 h-1.5 mr-1.5 bg-amber-500 rounded-full"></span>
                  尚未付款
                </span>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="status"
              className="text-slate-700 dark:text-slate-300"
            >
              預約狀態
            </Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-primary"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">待確認</option>
              <option value="confirmed">已收款（待上課）</option>
              <option value="completed" disabled={!canComplete}>
                已完成{" "}
                {!canComplete && status !== "completed" ? "(課程尚未結束)" : ""}
              </option>
              <option value="cancelled">已取消</option>
            </select>
            {!canComplete && status !== "completed" && (
              <p className="text-[10px] text-amber-500 mt-1">
                * 需待課程時間結束後才可選擇「已完成」
              </p>
            )}
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
            onClick={handleSave}
            disabled={loading}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            {loading ? "儲存中..." : "儲存變更"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
