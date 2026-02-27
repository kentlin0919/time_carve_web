const fs = require('fs');

const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add imports
content = `import { createClient } from "@/lib/supabase/server";
import { getAdminBookingStats } from "@/app/actions/admin";

` + content;

// Make component async and fetch data
content = content.replace('export default function AdminDashboard() {', 
`export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: teacherCount }, { count: studentCount }] = await Promise.all([
    supabase
      .from("user_info")
      .select("*", { count: "exact", head: true })
      .eq("identity_id", 2),
    supabase
      .from("user_info")
      .select("*", { count: "exact", head: true })
      .eq("identity_id", 3),
  ]);

  // Get Booking Stats (All time approx)
  const stats = await getAdminBookingStats(new Date('2020-01-01'), new Date('2030-12-31'));
  const totalBookings = stats.summary.totalBookings;
  const totalRevenue = stats.summary.totalRevenue;
`);

// Replace title desc
content = content.replace('管理所有註冊教師的帳板、狀態與總覽方案', '管理所有註冊教師的帳號、狀態與總覽方案');

// Replace hardcoded numbers
content = content.replace(
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">128</h3>',
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">{teacherCount || 0}</h3>'
);

content = content.replace(
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">1,540</h3>',
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">{studentCount || 0}</h3>'
);

content = content.replace(
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">2,345</h3>',
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalBookings || 0}</h3>'
);

content = content.replace(
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">\n              NT$ 850,000\n            </h3>',
  '<h3 className="text-2xl font-bold text-gray-900 dark:text-white">\n              NT$ {totalRevenue.toLocaleString()}\n            </h3>'
);

// Fallback for single line format
content = content.replace(
  '>NT$ 850,000</h3>',
  '>NT$ {totalRevenue.toLocaleString()}</h3>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed admin dashboard.');
