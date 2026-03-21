"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Select from "@/components/ui/Select"; // Use the existing custom Select
import { Label } from "@/components/ui/label";

export interface TimeRange {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

interface AvailabilityIntervalListProps {
  value: TimeRange[];
  onChange: (value: TimeRange[]) => void;
  disabled?: boolean;
  requiredDurationMinutes?: number;
  onBeforeAdd?: (range: TimeRange) => Promise<string | null> | string | null;
}

// Generate 30-min slots from 06:00 to 23:30
function generateTimeOptions() {
  const options: string[] = [];
  let current = 6 * 60; // 06:00 in minutes
  const end = 24 * 60; // 24:00

  while (current <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const timeStr = `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
    options.push(timeStr);
    current += 30;
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function AvailabilityIntervalList({
  value,
  onChange,
  disabled,
  requiredDurationMinutes,
  onBeforeAdd,
}: AvailabilityIntervalListProps) {
  const [newStart, setNewStart] = React.useState<string>("");
  const [newEnd, setNewEnd] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!requiredDurationMinutes) {
      return;
    }

    if (!newStart) {
      setNewEnd("");
      return;
    }

    const computedEnd = parseTime(newStart) + requiredDurationMinutes;
    if (computedEnd > 24 * 60) {
      setNewEnd("");
      return;
    }

    setNewEnd(
      `${Math.floor(computedEnd / 60)
        .toString()
        .padStart(2, "0")}:${(computedEnd % 60)
        .toString()
        .padStart(2, "0")}`
    );
  }, [newStart, requiredDurationMinutes]);

  const handleAdd = async () => {
    setError(null);
    if (!newStart || !newEnd) {
      setError("請選擇開始與結束時間");
      return;
    }

    const startMins = parseTime(newStart);
    const endMins = parseTime(newEnd);

    if (startMins >= endMins) {
      setError("結束時間必須晚於開始時間");
      return;
    }

    if (
      requiredDurationMinutes &&
      endMins - startMins !== requiredDurationMinutes
    ) {
      setError(`時段長度需剛好為 ${(requiredDurationMinutes / 60).toFixed(0)} 小時`);
      return;
    }

    // Check overlap
    const hasOverlap = value.some((range) => {
      const rStart = parseTime(range.start);
      const rEnd = parseTime(range.end);
      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return startMins < rEnd && endMins > rStart;
    });

    if (hasOverlap) {
      setError("此時段與現有時段重疊，請檢查");
      return;
    }

    if (onBeforeAdd) {
      const validationError = await onBeforeAdd({
        start: newStart,
        end: newEnd,
      });
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const newRanges = [...value, { start: newStart, end: newEnd }];
    // Sort logic
    newRanges.sort((a, b) => parseTime(a.start) - parseTime(b.start));

    onChange(newRanges);
    setNewStart("");
    setNewEnd("");
  };

  const handleDelete = (index: number) => {
    const newRanges = [...value];
    newRanges.splice(index, 1);
    onChange(newRanges);
  };

  // Convert string array to options array for the Select component
  const startOptions = TIME_OPTIONS.slice(0, -1)
    .filter((t) => {
      if (!requiredDurationMinutes) return true;
      return parseTime(t) + requiredDurationMinutes <= 24 * 60;
    })
    .map((t) => ({
      value: t,
      label: t,
    }));
  const endOptions = requiredDurationMinutes
    ? newEnd
      ? [{ value: newEnd, label: newEnd }]
      : [{ value: "", label: "請先選擇開始時間" }]
    : [
        { value: "", label: "選擇結束時間" },
        ...TIME_OPTIONS.map((t) => ({
          value: t,
          label: t,
        })),
      ];

  return (
    <div className="space-y-6">
      {/* List of existing intervals */}
      <div className="space-y-3">
        <Label className="text-slate-500 font-medium text-xs uppercase tracking-wider">
          已設定時段 ({value.length})
        </Label>
        {value.length === 0 ? (
          <div className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-dashed border-slate-200">
            目前無設定時段，請由下方新增。
          </div>
        ) : (
          <div className="grid gap-3">
            {value.map((range, idx) => (
              <div
                key={`${range.start}-${range.end}-${idx}`}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">
                      schedule
                    </span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                    {range.start} - {range.end}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {(
                      (parseTime(range.end) - parseTime(range.start)) /
                      60
                    ).toFixed(1)}{" "}
                    小時
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(idx)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                >
                  <span className="material-symbols-outlined">delete</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new interval form */}
      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <Label className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            add_circle
          </span>
          新增可用時段
        </Label>
        {requiredDurationMinutes ? (
          <p className="text-xs text-slate-500">
            每個申請時段需固定為 {requiredDurationMinutes / 60} 小時。
          </p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Select
              label="開始時間 Start"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              disabled={disabled}
              options={[{ value: "", label: "選擇開始時間" }, ...startOptions]}
            />
          </div>
          <div className="space-y-1.5">
            <Select
              label={requiredDurationMinutes ? "結束時間（依時數自動帶入）" : "結束時間 End"}
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              disabled={disabled || Boolean(requiredDurationMinutes)}
              options={endOptions}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm flex items-center gap-1 bg-red-50 dark:bg-red-900/10 p-2 rounded">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        <Button
          onClick={handleAdd}
          disabled={disabled || !newStart || !newEnd}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm"
        >
          加入列表
        </Button>
      </div>
    </div>
  );
}
