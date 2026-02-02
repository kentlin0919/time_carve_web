"use client";

import { useState } from "react";
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
import { reviewReschedule } from "@/app/actions/reschedule";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";

interface ReviewRescheduleDialogProps {
    requestId: string;
    currentDate: string;
    currentTime: string;
    newDate: string; // ISO or date string
    newTime: string; // ISO or time string
    reason?: string;
    requestedBy: string; // Name
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ReviewRescheduleDialog({
    requestId,
    currentDate,
    currentTime,
    newDate,
    newTime,
    reason,
    requestedBy,
    open,
    onOpenChange,
    onSuccess,
}: ReviewRescheduleDialogProps) {
    const router = useRouter();
    const { showModal } = useModal();
    const [loading, setLoading] = useState(false);

    const handleReview = async (decision: "approved" | "rejected") => {
        setLoading(true);
        try {
            await reviewReschedule(requestId, decision);

            onOpenChange(false);
            showModal({
                type: "success",
                title: decision === "approved" ? "已同意改期" : "已拒絕改期",
                description: decision === "approved" ? "課程時間已更新" : "對方將收到通知",
                confirmText: "確定"
            });
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            console.error("Failed to review reschedule", error);
            showModal({
                type: "error",
                title: "操作失敗",
                description: error.message || "請稍後再試",
                confirmText: "確定"
            });
        } finally {
            setLoading(false);
        }
    };

    // Format datetimes for display
    const formatDateTime = (dateStr: string, timeStr: string) => {
        // If strings are already readable ok, but if ISO...
        // Assuming props passed are readable or handled by parent.
        // Let's assume parent passes simple strings or we format here using simple replacement.
        // Actually for 'newDate' / 'newTime' if they come from request (ISO), we might need parsing.
        // Let's assume parent does the heavy lifting of formatting props for now.
        return `${dateStr} ${timeStr}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>預約改期申請</DialogTitle>
                    <DialogDescription>
                        {requestedBy} 提出了改期申請，請審核。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-slate-500">原定時間</Label>
                        <div className="col-span-3 font-medium text-slate-900 dark:text-white">
                            {formatDateTime(currentDate, currentTime)}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-slate-500">希望時間</Label>
                        <div className="col-span-3 font-medium text-green-600 dark:text-green-400">
                            {/* Handles if newDate/Time are single ISO string or separate */}
                            {newDate.includes('T') ? new Date(newDate).toLocaleString() : `${newDate} ${newTime}`}
                        </div>
                    </div>
                    {reason && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right text-slate-500 mt-1">原因</Label>
                            <div className="col-span-3 text-sm text-slate-700 dark:text-slate-300">
                                {reason}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="destructive"
                        onClick={() => handleReview("rejected")}
                        disabled={loading}
                    >
                        拒絕
                    </Button>
                    <Button
                        onClick={() => handleReview("approved")}
                        disabled={loading}
                        className="bg-primary text-white hover:bg-primary-dark"
                    >
                        {loading ? "處理中..." : "同意改期"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
