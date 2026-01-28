"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming textarea exists or use html textarea
import { sendNotification } from "@/app/actions/notification";
import { Loader2, Send } from "lucide-react";
import { NotificationType } from "@/lib/domain/notification/entity";
import { useModal } from "@/components/providers/ModalContext";

interface SendNotificationDialogProps {
  recipientId: string;
  recipientName: string;
  trigger?: React.ReactNode;
}

export function SendNotificationDialog({
  recipientId,
  recipientName,
  trigger,
}: SendNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { showModal } = useModal();

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      // Default to ANNOUNCEMENT type for manual sends
      await sendNotification(recipientId, "ANNOUNCEMENT", title, content);
      setOpen(false);
      setTitle("");
      setContent("");
      showModal({ type: "success", title: "發送成功", description: `已發送通知給 ${recipientName}`, confirmText: "確定" });
    } catch (error) {
      console.error("Failed to send notification:", error);
      showModal({ type: "error", title: "發送失敗", description: "請稍後再試", confirmText: "確定" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Send className="w-4 h-4 mr-2" />
            發送通知
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>發送通知給 {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">標題</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 課程提醒"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">內容</Label>
            <textarea
              id="content"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="輸入通知內容..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            發送
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
