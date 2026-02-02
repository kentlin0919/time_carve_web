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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requestReschedule } from "@/app/actions/reschedule";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";

interface RescheduleDialogProps {
    bookingId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function RescheduleDialog({
    bookingId,
    open,
    onOpenChange,
    onSuccess,
}: RescheduleDialogProps) {
    const router = useRouter();
    const { showModal } = useModal();
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!newDate || !newTime) return;

        setLoading(true);
        try {
            // Construct ISO string? or just pass string?
            // Action expects "ISO String or YYYY-MM-DDTHH:mm"
            const newDateTime = `${newDate}T${newTime}`;

            await requestReschedule(bookingId, newDateTime, reason);

            onOpenChange(false);
            showModal({
                type: "success",
                title: "申請已送出",
                description: "對方將會收到您的改期請求",
                confirmText: "確定"
            });
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            console.error("Failed to request reschedule", error);
            showModal({
                type: "error",
                title: "申請失敗",
                description: error.message || "請稍後再試",
                confirmText: "確定"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>預約改期</DialogTitle>
                    <DialogDescription>請選擇新的預約時間並說明原因。</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">日期</Label>
                        <Input
                            id="date"
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="dark:bg-slate-950"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="time">時間</Label>
                        <Input
                            id="time"
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="dark:bg-slate-950"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reason">改期原因 (選填)</Label>
                        <Textarea
                            id="reason"
                            placeholder="請說明改期原因..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="dark:bg-slate-950"
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
                        disabled={loading || !newDate || !newTime}
                        className="bg-primary text-white hover:bg-primary-dark"
                    >
                        {loading ? "送出中..." : "送出申請"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
