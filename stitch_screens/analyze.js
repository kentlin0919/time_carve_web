const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const index = require('./index.json');

const htmlDir = path.join(__dirname, 'html_dumps');

function determineRoleAndFunction($, originalTitle) {
    let role = '未知';
    let func = '未知功能';

    const fullText = $('body').text() || '';

    // 1. Determine Role (身份)
    if (fullText.includes('學生儀表板') || fullText.includes('我的學習') || fullText.includes('預約建立')) {
        role = 'Student (學生)';
    } else if (fullText.includes('教師儀表板') || fullText.includes('課程管理') || fullText.includes('排班') || fullText.includes('Teacher Dashboard') || originalTitle.includes('教師管理後台')) {
        role = 'Teacher (教師)';
    } else if (fullText.includes('管理員儀表板') || fullText.includes('Super Admin') || fullText.includes('帳單管理') || originalTitle.includes('Super Admin')) {
        role = 'Admin (管理員)';
    } else if (fullText.includes('首頁') || fullText.includes('教師列表') || fullText.includes('登入') || fullText.includes('註冊') || originalTitle.includes('首頁') || originalTitle.includes('註冊')) {
        role = 'Public / Auth (訪客/驗證)';
    }

    // 2. Determine Function (功能)
    // Try to find the active navigation item or current page indicator
    let navActive = $('a.active, .active-tab, [aria-current="page"], .bg-primary-50, .text-primary-600').eq(0).text().trim();

    // Look for explicit headers
    let h1 = $('h1').eq(0).text().trim();
    let h2 = $('h2').eq(0).text().trim();

    if (h1 && h1.length > 0 && h1.length < 25 && !h1.includes('TimeCarve')) {
        func = h1;
    } else if (navActive && navActive.length > 0 && navActive.length < 15) {
        func = navActive;
    } else if (h2 && h2.length > 0 && h2.length < 25) {
        func = h2;
    } else {
        // Fallback functions based on keywords
        if (fullText.includes('設定')) func = '設定';
        else if (fullText.includes('預約')) func = '預約管理';
        else if (fullText.includes('報表') || fullText.includes('收益')) func = '收益報表';
        else if (fullText.includes('課程') || fullText.includes('方案')) func = '課程管理';
        else if ($('form').length > 0) func = '表單編輯';
        else func = originalTitle.replace('TimeCarve 刻時 - ', '').replace('TimeCarve 刻時', '首頁').trim() || '儀表板';
    }

    // Clean up generic or long names
    func = func.replace(/\s+/g, ' ').trim();
    if (func.length > 30) func = func.substring(0, 30) + '...';

    return `${role} - ${func}`;
}

function analyzeFile(filePath, originalTitle) {
    if (!fs.existsSync(filePath)) return `${originalTitle} (未找到檔案)`;

    try {
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);
        return determineRoleAndFunction($, originalTitle);
    } catch (e) {
        return `${originalTitle} (解析錯誤)`;
    }
}

function run() {
    const validScreens = index.filter(s => s.htmlUrl && s.id);

    const duplicateCounts = {};
    const updatedScreens = [];

    for (const screen of validScreens) {
        const filePath = path.join(htmlDir, `${screen.id}.html`);
        const suggestedName = analyzeFile(filePath, screen.originalTitle);

        // Deduplicate identical suggested names by appending an index
        let finalName = suggestedName;
        if (duplicateCounts[suggestedName] === undefined) {
            duplicateCounts[suggestedName] = 1;
        } else {
            duplicateCounts[suggestedName]++;
            finalName = `${suggestedName} (${duplicateCounts[suggestedName]})`;
        }

        updatedScreens.push({
            id: screen.id,
            originalTitle: screen.originalTitle,
            suggestedTitle: finalName
        });
    }

    // Sort for better readability output
    updatedScreens.sort((a, b) => a.suggestedTitle.localeCompare(b.suggestedTitle));

    fs.writeFileSync(path.join(__dirname, 'rename_plan.json'), JSON.stringify(updatedScreens, null, 2));

    // Generate Markdown artifact
    let markdown = `# Stitch 畫面重新命名計畫\n\n依照 **身份 - 功能** 格式重新分析的所有畫面。\n但注意 Stitch API 目前不支援經由 API 改名，您可以在 Stitch 網頁上參考此表手動修改需要的畫面。\n\n`;

    markdown += `| 原本名稱 | 建議新名稱 (身份 - 功能) |\n`;
    markdown += `|---|---|\n`;

    for (const s of updatedScreens) {
        markdown += `| ${s.originalTitle} | **${s.suggestedTitle}** |\n`;
    }

    fs.writeFileSync(path.join(__dirname, 'rename_plan.md'), markdown);

    console.log(`Analyzed ${updatedScreens.length} screens.`);
    console.log(`Generated Markdown table at rename_plan.md`);
}

run();
