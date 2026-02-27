const fs = require('fs');

const path = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The current chart has hardcoded NT$15,000, 12,000, etc. labels and a hardcoded SVG path.
// Let's at least make the labels more relevant if the total revenue is significantly higher.

content = content.replace('NT$15,000', '{`NT$${(Math.max(totalRevenue / 4 * 5, 15000) / 1000).toFixed(0)}k`}');
content = content.replace('NT$12,000', '{`NT$${(Math.max(totalRevenue / 4 * 4, 12000) / 1000).toFixed(0)}k`}');
content = content.replace('NT$9,000',  '{`NT$${(Math.max(totalRevenue / 4 * 3, 9000) / 1000).toFixed(0)}k`}');
content = content.replace('NT$6,000',  '{`NT$${(Math.max(totalRevenue / 4 * 2, 6000) / 1000).toFixed(0)}k`}');
content = content.replace('NT$3,000',  '{`NT$${(Math.max(totalRevenue / 4 * 1, 3000) / 1000).toFixed(0)}k`}');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed revenue chart labels.');
