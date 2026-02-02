"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSchools } from "@/hooks/useSchools";
import SchoolCombobox from "@/components/ui/SchoolCombobox";
import Select from "@/components/ui/Select";
import { DEGREE_LEVELS } from "@/lib/constants";

interface EducationInputsProps {
  school: string;
  setSchool: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  department: string;
  setDepartment: (value: string) => void;
  degreeLevel?: string;
  setDegreeLevel?: (value: string) => void;
  className?: string;
  labels?: {
    school?: string;
    status?: string;
    department?: string;
    degreeLevel?: string;
  };
}

export default function EducationInputs({
  school,
  setSchool,
  status,
  setStatus,
  department,
  setDepartment,
  degreeLevel,
  setDegreeLevel,
  className = "",
  labels = {},
}: EducationInputsProps) {
  const schools = useSchools();
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      const { data, error } = await supabase
        .from("education_statuses")
        .select("status_key, label_zh")
        .order("id", { ascending: true });

      if (data) {
        setStatusOptions(
          data.map((item) => ({
            value: item.status_key,
            label: item.label_zh,
          }))
        );
      } else if (error) {
        console.error("Error fetching education statuses:", error);
      }
    };

    fetchStatuses();
  }, []);

  const defaultLabels = {
    school: "畢業/就讀學校",
    status: "就學狀態",
    department: "科系/所",
    degreeLevel: "學位等級",
  };

  const finalLabels = { ...defaultLabels, ...labels };

  return (
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      {/* School Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
          {finalLabels.school}
        </label>
        <SchoolCombobox
          schools={schools}
          value={school}
          onChange={setSchool}
          placeholder="請輸入或選擇學校"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Degree Level Field (Optional) */}
        {setDegreeLevel && (
          <div>
            <Select
              label={finalLabels.degreeLevel}
              value={degreeLevel || "bachelor"}
              onChange={(e) => setDegreeLevel(e.target.value)}
              options={DEGREE_LEVELS}
              icon="school"
            />
          </div>
        )}

        {/* Status Field */}
        <div className={setDegreeLevel ? "" : "col-span-2"}>
          <Select
            label={finalLabels.status}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
            icon="history_edu"
          />
        </div>
      </div>

      {/* Department Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
          {finalLabels.department}
        </label>
        <div className="relative">
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            placeholder="請輸入科系名稱"
          />
        </div>
      </div>
    </div>
  );
}
