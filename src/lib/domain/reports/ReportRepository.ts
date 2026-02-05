export type ReportStats = {
  totalRevenue: number;
  totalSessions: number;
  averageOrderValue: number;
  activeStudents: number;
  totalRevenueGrowth: number; // percentage
  totalSessionsGrowth: number; // percentage
  averageOrderValueGrowth: number; // percentage
  activeStudentsGrowth: number; // percentage
};

export type RevenueTrend = {
  label: string; // e.g., "2023-10" or "Oct"
  amount: number;
};

export type CourseRevenueDistribution = {
  name: string;
  value: number; // percentage or amount
  color?: string;
};

export type TransactionFilter = {
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
  courseType?: string;
  page?: number;
  pageSize?: number;
};

export type Transaction = {
  id: string;
  date: string; // ISO string
  studentName: string;
  studentAvatar?: string | null;
  courseTitle: string;
  courseType: string;
  amount: number;
  studentId?: string;
  courseId?: string;
  statusKey?: string;
};

export interface ReportRepository {
  getStats(teacherId: string, startDate: Date, endDate: Date): Promise<ReportStats>;
  getRevenueTrends(teacherId: string, range: '6_months' | 'year'): Promise<RevenueTrend[]>;
  getCourseRevenueDistribution(teacherId: string): Promise<CourseRevenueDistribution[]>;
  getTransactions(teacherId: string, filter: TransactionFilter): Promise<{ data: Transaction[]; total: number }>;
}
