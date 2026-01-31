// ============================================================
// KDP Forge - Low Content Book Creator
// A simplified BookBolt competitor
// ============================================================

// ============ NAVIGATION ============
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

function navigateTo(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    navLinks.forEach(l => l.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
}

navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// ============ STATS TRACKING ============
const stats = { covers: 0, interiors: 0, puzzles: 0 };
function updateStats() {
    document.getElementById('stat-covers').textContent = stats.covers;
    document.getElementById('stat-interiors').textContent = stats.interiors;
    document.getElementById('stat-puzzles').textContent = stats.puzzles;
}

// ============================================================
// NICHE RESEARCH TOOL
// ============================================================
const nicheDatabase = [
    { keyword: "gratitude journal", category: "journals", demand: 92, competition: 78, avgPrice: 7.99, estRevenue: 2400, bsr: 12500, trend: "up" },
    { keyword: "daily planner 2025", category: "journals", demand: 88, competition: 85, avgPrice: 9.99, estRevenue: 3100, bsr: 8200, trend: "up" },
    { keyword: "dot grid notebook", category: "notebook", demand: 75, competition: 55, avgPrice: 6.99, estRevenue: 1800, bsr: 25000, trend: "stable" },
    { keyword: "password logbook", category: "logbook", demand: 82, competition: 42, avgPrice: 5.99, estRevenue: 2100, bsr: 18000, trend: "up" },
    { keyword: "sudoku puzzle book", category: "puzzle", demand: 85, competition: 72, avgPrice: 6.99, estRevenue: 1900, bsr: 15000, trend: "stable" },
    { keyword: "word search large print", category: "puzzle", demand: 90, competition: 68, avgPrice: 7.99, estRevenue: 2800, bsr: 9500, trend: "up" },
    { keyword: "coloring book adults", category: "coloring", demand: 95, competition: 92, avgPrice: 8.99, estRevenue: 3500, bsr: 5000, trend: "stable" },
    { keyword: "mandala coloring book", category: "coloring", demand: 78, competition: 70, avgPrice: 7.99, estRevenue: 1600, bsr: 22000, trend: "down" },
    { keyword: "habit tracker journal", category: "journals", demand: 70, competition: 38, avgPrice: 8.99, estRevenue: 2000, bsr: 30000, trend: "up" },
    { keyword: "recipe book blank", category: "logbook", demand: 65, competition: 35, avgPrice: 9.99, estRevenue: 1500, bsr: 35000, trend: "stable" },
    { keyword: "fitness log book", category: "logbook", demand: 60, competition: 40, avgPrice: 7.99, estRevenue: 1200, bsr: 40000, trend: "stable" },
    { keyword: "reading log journal", category: "logbook", demand: 55, competition: 30, avgPrice: 6.99, estRevenue: 900, bsr: 55000, trend: "up" },
    { keyword: "budget planner", category: "journals", demand: 80, competition: 60, avgPrice: 8.99, estRevenue: 2200, bsr: 20000, trend: "up" },
    { keyword: "crossword puzzle book", category: "puzzle", demand: 83, competition: 65, avgPrice: 6.99, estRevenue: 1700, bsr: 17000, trend: "stable" },
    { keyword: "baby logbook", category: "logbook", demand: 58, competition: 25, avgPrice: 9.99, estRevenue: 1400, bsr: 45000, trend: "up" },
    { keyword: "garden planner", category: "journals", demand: 50, competition: 20, avgPrice: 8.99, estRevenue: 1100, bsr: 60000, trend: "up" },
    { keyword: "travel journal", category: "journals", demand: 72, competition: 58, avgPrice: 7.99, estRevenue: 1800, bsr: 28000, trend: "stable" },
    { keyword: "sketch book blank", category: "notebook", demand: 68, competition: 52, avgPrice: 6.99, estRevenue: 1300, bsr: 32000, trend: "stable" },
    { keyword: "prayer journal", category: "journals", demand: 76, competition: 45, avgPrice: 8.99, estRevenue: 2000, bsr: 21000, trend: "up" },
    { keyword: "mood tracker", category: "journals", demand: 48, competition: 18, avgPrice: 7.99, estRevenue: 800, bsr: 70000, trend: "up" },
    { keyword: "bird watching log", category: "logbook", demand: 35, competition: 12, avgPrice: 8.99, estRevenue: 600, bsr: 95000, trend: "up" },
    { keyword: "maze book kids", category: "puzzle", demand: 72, competition: 50, avgPrice: 5.99, estRevenue: 1600, bsr: 24000, trend: "stable" },
    { keyword: "calligraphy practice", category: "notebook", demand: 55, competition: 32, avgPrice: 6.99, estRevenue: 900, bsr: 52000, trend: "stable" },
    { keyword: "wine tasting journal", category: "logbook", demand: 30, competition: 10, avgPrice: 9.99, estRevenue: 500, bsr: 110000, trend: "stable" },
    { keyword: "self care journal", category: "journals", demand: 68, competition: 42, avgPrice: 8.99, estRevenue: 1700, bsr: 26000, trend: "up" },
];

function generateRelatedKeywords(query) {
    const prefixes = ["best", "top", "premium", "custom", "personalized", "large print", "small", "cute", "funny"];
    const suffixes = ["for women", "for men", "for kids", "for seniors", "for teens", "for beginners", "2025", "with prompts", "spiral bound"];
    const kws = [];
    for (let i = 0; i < 5; i++) kws.push(prefixes[Math.floor(Math.random() * prefixes.length)] + " " + query);
    for (let i = 0; i < 5; i++) kws.push(query + " " + suffixes[Math.floor(Math.random() * suffixes.length)]);
    return [...new Set(kws)].slice(0, 8);
}

document.getElementById('btn-research').addEventListener('click', () => {
    const query = document.getElementById('research-keyword').value.trim().toLowerCase();
    const category = document.getElementById('research-category').value;
    const sort = document.getElementById('research-sort').value;
    if (!query) return;

    let results = nicheDatabase.filter(n => {
        const matchQuery = n.keyword.includes(query) || query.split(' ').some(w => n.keyword.includes(w));
        const matchCat = category === 'all' || n.category === category;
        return matchQuery && matchCat;
    });

    // If no exact matches, show all in category (or all) with randomized relevance
    if (results.length === 0) {
        results = nicheDatabase.filter(n => category === 'all' || n.category === category);
        results = results.map(r => ({
            ...r,
            keyword: query + " " + r.keyword.split(' ').pop(),
            demand: Math.max(20, r.demand + Math.floor(Math.random() * 20 - 10)),
            competition: Math.max(10, r.competition + Math.floor(Math.random() * 20 - 10)),
        }));
    }

    if (sort === 'demand') results.sort((a, b) => b.demand - a.demand);
    else if (sort === 'competition') results.sort((a, b) => a.competition - b.competition);
    else if (sort === 'revenue') results.sort((a, b) => b.estRevenue - a.estRevenue);

    const relatedKws = generateRelatedKeywords(query);
    const container = document.getElementById('research-results');

    const opportunityScore = (r) => Math.round((r.demand * (100 - r.competition)) / 50);

    container.innerHTML = `
        <div class="keyword-tags">
            <strong style="color:#888;font-size:0.82rem;margin-right:6px;">Related:</strong>
            ${relatedKws.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
        </div>
        <table class="results-table" style="margin-top:16px">
            <thead>
                <tr>
                    <th>Keyword / Niche</th>
                    <th>Demand</th>
                    <th>Competition</th>
                    <th>Opportunity</th>
                    <th>Avg Price</th>
                    <th>Est. Monthly Rev</th>
                    <th>Avg BSR</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(r => {
                    const opp = opportunityScore(r);
                    const oppClass = opp > 100 ? 'badge-high' : opp > 60 ? 'badge-medium' : 'badge-low';
                    const oppLabel = opp > 100 ? 'Great' : opp > 60 ? 'Good' : 'Low';
                    const trendIcon = r.trend === 'up' ? '&#9650;' : r.trend === 'down' ? '&#9660;' : '&#9644;';
                    const trendColor = r.trend === 'up' ? '#5cb85c' : r.trend === 'down' ? '#d9534f' : '#daa520';
                    return `<tr>
                        <td><strong>${r.keyword}</strong></td>
                        <td>${r.demand}<div class="demand-bar"><div class="demand-bar-fill" style="width:${r.demand}%"></div></div></td>
                        <td>${r.competition}%</td>
                        <td><span class="badge ${oppClass}">${oppLabel} (${opp})</span></td>
                        <td>$${r.avgPrice.toFixed(2)}</td>
                        <td>$${r.estRevenue.toLocaleString()}</td>
                        <td>#${r.bsr.toLocaleString()}</td>
                        <td style="color:${trendColor}">${trendIcon}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
});

// ============================================================
// COVER DESIGNER
// ============================================================
const coverCanvas = document.getElementById('cover-canvas');
const coverCtx = coverCanvas.getContext('2d');

function drawCover() {
    const w = coverCanvas.width;
    const h = coverCanvas.height;
    const bgColor = document.getElementById('cover-bg-color').value;
    const bgGradient = document.getElementById('cover-bg-gradient').value;
    const useGradient = document.getElementById('cover-use-gradient').checked;
    const title = document.getElementById('cover-title').value;
    const titleSize = parseInt(document.getElementById('cover-title-size').value);
    const titleColor = document.getElementById('cover-title-color').value;
    const titleFont = document.getElementById('cover-title-font').value;
    const subtitle = document.getElementById('cover-subtitle').value;
    const subtitleColor = document.getElementById('cover-subtitle-color').value;
    const author = document.getElementById('cover-author').value;
    const authorColor = document.getElementById('cover-author-color').value;
    const borderStyle = document.getElementById('cover-border').value;
    const borderColor = document.getElementById('cover-border-color').value;
    const shape = document.getElementById('cover-shape').value;

    // Background
    if (useGradient) {
        const grad = coverCtx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, bgColor);
        grad.addColorStop(1, bgGradient);
        coverCtx.fillStyle = grad;
    } else {
        coverCtx.fillStyle = bgColor;
    }
    coverCtx.fillRect(0, 0, w, h);

    // Border
    if (borderStyle !== 'none') {
        coverCtx.strokeStyle = borderColor;
        if (borderStyle === 'simple') {
            coverCtx.lineWidth = 2;
            coverCtx.strokeRect(20, 20, w - 40, h - 40);
        } else if (borderStyle === 'double') {
            coverCtx.lineWidth = 2;
            coverCtx.strokeRect(16, 16, w - 32, h - 32);
            coverCtx.strokeRect(24, 24, w - 48, h - 48);
        } else if (borderStyle === 'ornate') {
            coverCtx.lineWidth = 3;
            coverCtx.strokeRect(18, 18, w - 36, h - 36);
            coverCtx.lineWidth = 1;
            coverCtx.strokeRect(24, 24, w - 48, h - 48);
            // Corner flourishes
            const cs = 30;
            const corners = [[28, 28], [w - 28, 28], [28, h - 28], [w - 28, h - 28]];
            corners.forEach(([cx, cy]) => {
                coverCtx.beginPath();
                coverCtx.arc(cx, cy, 6, 0, Math.PI * 2);
                coverCtx.fillStyle = borderColor;
                coverCtx.fill();
            });
        }
    }

    // Decorative shape
    if (shape === 'circle') {
        coverCtx.beginPath();
        coverCtx.arc(w / 2, h * 0.38, 60, 0, Math.PI * 2);
        coverCtx.strokeStyle = borderColor;
        coverCtx.lineWidth = 2;
        coverCtx.stroke();
    } else if (shape === 'diamond') {
        coverCtx.beginPath();
        const cx = w / 2, cy = h * 0.38, sz = 50;
        coverCtx.moveTo(cx, cy - sz);
        coverCtx.lineTo(cx + sz, cy);
        coverCtx.lineTo(cx, cy + sz);
        coverCtx.lineTo(cx - sz, cy);
        coverCtx.closePath();
        coverCtx.strokeStyle = borderColor;
        coverCtx.lineWidth = 2;
        coverCtx.stroke();
    } else if (shape === 'line-art') {
        coverCtx.strokeStyle = borderColor;
        coverCtx.lineWidth = 1;
        const cy = h * 0.52;
        coverCtx.beginPath();
        coverCtx.moveTo(40, cy);
        coverCtx.lineTo(w / 2 - 40, cy);
        coverCtx.stroke();
        coverCtx.beginPath();
        coverCtx.moveTo(w / 2 + 40, cy);
        coverCtx.lineTo(w - 40, cy);
        coverCtx.stroke();
        // Center ornament
        coverCtx.beginPath();
        coverCtx.arc(w / 2, cy, 5, 0, Math.PI * 2);
        coverCtx.fillStyle = borderColor;
        coverCtx.fill();
    }

    // Title - word wrap
    coverCtx.fillStyle = titleColor;
    coverCtx.font = `bold ${titleSize}px ${titleFont}`;
    coverCtx.textAlign = 'center';
    const titleY = shape === 'none' ? h * 0.3 : h * 0.25;
    wrapText(coverCtx, title, w / 2, titleY, w - 80, titleSize * 1.2);

    // Subtitle
    if (subtitle) {
        coverCtx.fillStyle = subtitleColor;
        coverCtx.font = `italic ${Math.round(titleSize * 0.45)}px ${titleFont}`;
        coverCtx.fillText(subtitle, w / 2, titleY + titleSize * 1.4);
    }

    // Author
    if (author) {
        coverCtx.fillStyle = authorColor;
        coverCtx.font = `${Math.round(titleSize * 0.4)}px ${titleFont}`;
        coverCtx.fillText(author, w / 2, h - 50);
    }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let ly = y;
    for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), x, ly);
            line = word + ' ';
            ly += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, ly);
}

// Bind cover controls
const coverInputs = [
    'cover-bg-color', 'cover-bg-gradient', 'cover-use-gradient',
    'cover-title', 'cover-title-size', 'cover-title-color', 'cover-title-font',
    'cover-subtitle', 'cover-subtitle-color',
    'cover-author', 'cover-author-color',
    'cover-border', 'cover-border-color', 'cover-shape'
];
coverInputs.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', drawCover);
    el.addEventListener('change', drawCover);
});

document.getElementById('cover-title-size').addEventListener('input', e => {
    document.getElementById('cover-title-size-val').textContent = e.target.value + 'px';
});

document.getElementById('btn-export-cover').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'kdp-cover.png';
    link.href = coverCanvas.toDataURL('image/png');
    link.click();
    stats.covers++;
    updateStats();
});

// Trim size changes
document.getElementById('cover-trim').addEventListener('change', e => {
    const sizes = { '6x9': [450, 675], '5.5x8.5': [413, 638], '8.5x11': [510, 660], '5x8': [375, 600], '8x10': [480, 600] };
    const [w, h] = sizes[e.target.value];
    coverCanvas.width = w;
    coverCanvas.height = h;
    drawCover();
});

// ============================================================
// INTERIOR GENERATOR
// ============================================================
const interiorCanvas = document.getElementById('interior-canvas');
const interiorCtx = interiorCanvas.getContext('2d');
let currentTemplate = 'lined';

function drawInterior() {
    const w = interiorCanvas.width;
    const h = interiorCanvas.height;
    const lineColor = document.getElementById('interior-line-color').value;
    const header = document.getElementById('interior-header').value;
    const showPageNum = document.getElementById('interior-page-numbers').checked;

    interiorCtx.fillStyle = '#ffffff';
    interiorCtx.fillRect(0, 0, w, h);

    const margin = { top: 60, bottom: 50, left: 50, right: 40 };

    // Header
    if (header) {
        interiorCtx.fillStyle = '#333';
        interiorCtx.font = 'bold 14px Georgia, serif';
        interiorCtx.textAlign = 'center';
        interiorCtx.fillText(header, w / 2, 35);
    }

    // Date line for certain templates
    const hasDate = ['planner-daily', 'planner-weekly', 'gratitude', 'habit', 'budget', 'fitness', 'reading-log'].includes(currentTemplate);
    if (hasDate) {
        interiorCtx.fillStyle = '#999';
        interiorCtx.font = '11px Arial, sans-serif';
        interiorCtx.textAlign = 'left';
        interiorCtx.fillText('Date: _______________', margin.left, margin.top - 10);
        margin.top += 10;
    }

    interiorCtx.strokeStyle = lineColor;
    interiorCtx.fillStyle = '#666';

    const templates = {
        'lined': drawLined,
        'dotgrid': drawDotGrid,
        'graph': drawGraph,
        'planner-daily': drawDailyPlanner,
        'planner-weekly': drawWeeklyPlanner,
        'habit': drawHabitTracker,
        'gratitude': drawGratitudeJournal,
        'budget': drawBudgetTracker,
        'reading-log': drawReadingLog,
        'recipe': drawRecipe,
        'fitness': drawFitnessLog,
        'cornell': drawCornellNotes,
    };

    (templates[currentTemplate] || drawLined)(interiorCtx, w, h, margin, lineColor);

    // Page number
    if (showPageNum) {
        interiorCtx.fillStyle = '#bbb';
        interiorCtx.font = '10px Arial, sans-serif';
        interiorCtx.textAlign = 'center';
        interiorCtx.fillText('1', w / 2, h - 20);
    }
}

function drawLined(ctx, w, h, m, color) {
    ctx.lineWidth = 0.5;
    const spacing = 22;
    for (let y = m.top; y < h - m.bottom; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(m.left, y);
        ctx.lineTo(w - m.right, y);
        ctx.stroke();
    }
}

function drawDotGrid(ctx, w, h, m, color) {
    const spacing = 20;
    ctx.fillStyle = color;
    for (let y = m.top; y < h - m.bottom; y += spacing) {
        for (let x = m.left; x < w - m.right; x += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawGraph(ctx, w, h, m, color) {
    ctx.lineWidth = 0.3;
    const spacing = 15;
    for (let y = m.top; y < h - m.bottom; y += spacing) {
        ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(w - m.right, y); ctx.stroke();
    }
    for (let x = m.left; x < w - m.right; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, m.top); ctx.lineTo(x, h - m.bottom); ctx.stroke();
    }
}

function drawDailyPlanner(ctx, w, h, m, color) {
    ctx.lineWidth = 0.5;
    ctx.font = '9px Arial, sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'left';

    const sections = ['Top Priorities', 'Schedule', 'To-Do List', 'Notes'];
    const sectionH = (h - m.top - m.bottom) / sections.length;

    sections.forEach((sec, i) => {
        const y = m.top + i * sectionH;
        ctx.fillStyle = '#555';
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.fillText(sec, m.left, y + 12);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(m.left, y + 18); ctx.lineTo(w - m.right, y + 18); ctx.stroke();

        ctx.lineWidth = 0.3;
        if (sec === 'Schedule') {
            const hours = ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00'];
            const lineH = (sectionH - 24) / hours.length;
            hours.forEach((hr, j) => {
                const ly = y + 26 + j * lineH;
                ctx.fillStyle = '#bbb';
                ctx.font = '8px Arial, sans-serif';
                ctx.fillText(hr, m.left, ly + 4);
                ctx.beginPath(); ctx.moveTo(m.left + 30, ly); ctx.lineTo(w - m.right, ly); ctx.stroke();
            });
        } else {
            const lineSpacing = 18;
            for (let ly = y + 30; ly < y + sectionH - 5; ly += lineSpacing) {
                if (sec === 'To-Do List') {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(m.left, ly - 5, 8, 8);
                    ctx.beginPath(); ctx.moveTo(m.left + 14, ly + 3); ctx.lineTo(w - m.right, ly + 3); ctx.stroke();
                } else {
                    ctx.beginPath(); ctx.moveTo(m.left, ly); ctx.lineTo(w - m.right, ly); ctx.stroke();
                }
            }
        }
    });
}

function drawWeeklyPlanner(ctx, w, h, m, color) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const colW = (w - m.left - m.right) / 2;
    const rowH = (h - m.top - m.bottom) / 4;

    ctx.lineWidth = 0.5;
    days.forEach((day, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = m.left + col * colW;
        const y = m.top + row * rowH;

        ctx.fillStyle = '#555';
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(day, x + 5, y + 14);

        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, colW, rowH);

        ctx.lineWidth = 0.3;
        for (let ly = y + 24; ly < y + rowH - 5; ly += 16) {
            ctx.beginPath(); ctx.moveTo(x + 5, ly); ctx.lineTo(x + colW - 5, ly); ctx.stroke();
        }
        ctx.lineWidth = 0.5;
    });

    // Notes box
    const notesY = m.top + 3 * rowH;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Notes / Goals', m.left + 5, notesY + 14);
    ctx.strokeStyle = color;
    ctx.strokeRect(m.left, notesY, colW * 2, rowH);
}

function drawHabitTracker(ctx, w, h, m, color) {
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Monthly Habit Tracker', m.left, m.top + 10);

    const rows = 10;
    const cols = 31;
    const cellW = (w - m.left - m.right - 100) / cols;
    const cellH = 20;
    const labelW = 100;

    // Day headers
    ctx.font = '7px Arial, sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    for (let d = 1; d <= cols; d++) {
        ctx.fillText(d.toString(), m.left + labelW + (d - 0.5) * cellW, m.top + 28);
    }

    // Grid
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.3;
    for (let r = 0; r < rows; r++) {
        const y = m.top + 34 + r * cellH;
        ctx.fillStyle = '#ccc';
        ctx.font = '8px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Habit ' + (r + 1) + ': _________', m.left, y + 13);

        for (let c = 0; c < cols; c++) {
            ctx.strokeRect(m.left + labelW + c * cellW, y, cellW, cellH);
        }
    }
}

function drawGratitudeJournal(ctx, w, h, m, color) {
    ctx.lineWidth = 0.5;
    const sections = [
        { label: 'Today I am grateful for:', lines: 5 },
        { label: 'Something good that happened:', lines: 4 },
        { label: 'How I will make today great:', lines: 3 },
        { label: 'Daily affirmation:', lines: 2 },
        { label: 'Reflections:', lines: 5 },
    ];

    let y = m.top;
    sections.forEach(sec => {
        ctx.fillStyle = '#444';
        ctx.font = 'bold 11px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText(sec.label, m.left, y + 12);
        y += 20;
        ctx.strokeStyle = color;
        for (let i = 0; i < sec.lines; i++) {
            ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(w - m.right, y); ctx.stroke();
            y += 20;
        }
        y += 10;
    });
}

function drawBudgetTracker(ctx, w, h, m, color) {
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Monthly Budget Tracker', m.left, m.top + 10);

    // Income section
    let y = m.top + 30;
    ctx.fillStyle = '#444';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('INCOME', m.left, y);
    y += 6;

    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    const headers = ['Source', 'Expected', 'Actual'];
    const colWidths = [180, 80, 80];
    let x = m.left;
    headers.forEach((hdr, i) => {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 8px Arial, sans-serif';
        ctx.fillText(hdr, x + 4, y + 12);
        ctx.strokeRect(x, y, colWidths[i], 16);
        x += colWidths[i];
    });
    y += 16;
    for (let r = 0; r < 4; r++) {
        x = m.left;
        colWidths.forEach(cw => { ctx.strokeRect(x, y, cw, 16); x += cw; });
        y += 16;
    }

    // Expenses section
    y += 12;
    ctx.fillStyle = '#444';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('EXPENSES', m.left, y);
    y += 6;
    const expHeaders = ['Category', 'Budgeted', 'Actual', 'Diff'];
    const expWidths = [140, 70, 70, 60];
    x = m.left;
    expHeaders.forEach((hdr, i) => {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 8px Arial, sans-serif';
        ctx.fillText(hdr, x + 4, y + 12);
        ctx.strokeRect(x, y, expWidths[i], 16);
        x += expWidths[i];
    });
    y += 16;
    const categories = ['Housing', 'Food', 'Transport', 'Utilities', 'Insurance', 'Entertainment', 'Savings', 'Other'];
    categories.forEach(cat => {
        x = m.left;
        ctx.fillStyle = '#bbb';
        ctx.font = '8px Arial, sans-serif';
        ctx.fillText(cat, x + 4, y + 11);
        expWidths.forEach(cw => { ctx.strokeRect(x, y, cw, 16); x += cw; });
        y += 16;
    });

    // Summary
    y += 12;
    ctx.fillStyle = '#444';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('SUMMARY', m.left, y);
    y += 6;
    ['Total Income:', 'Total Expenses:', 'Net Savings:'].forEach(label => {
        ctx.fillStyle = '#888';
        ctx.font = '9px Arial, sans-serif';
        ctx.fillText(label, m.left, y + 12);
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(m.left + 100, y + 14); ctx.lineTo(m.left + 240, y + 14); ctx.stroke();
        y += 20;
    });
}

function drawReadingLog(ctx, w, h, m, color) {
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Reading Log', m.left, m.top + 10);

    const fields = ['Title:', 'Author:', 'Genre:', 'Start Date:', 'End Date:', 'Pages:', 'Rating: _ / 5'];
    let y = m.top + 30;
    fields.forEach(f => {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial, sans-serif';
        ctx.fillText(f, m.left, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(m.left + 70, y + 2); ctx.lineTo(w - m.right, y + 2); ctx.stroke();
        y += 22;
    });

    y += 10;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Summary / Review:', m.left, y);
    y += 14;
    for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(w - m.right, y); ctx.stroke();
        y += 20;
    }

    y += 10;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Favorite Quotes:', m.left, y);
    y += 14;
    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(w - m.right, y); ctx.stroke();
        y += 20;
    }
}

function drawRecipe(ctx, w, h, m, color) {
    ctx.fillStyle = '#555';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Recipe', w / 2, m.top + 10);

    ctx.textAlign = 'left';
    let y = m.top + 30;
    const fields = ['Recipe Name:', 'Source:', 'Servings:', 'Prep Time:', 'Cook Time:'];
    fields.forEach(f => {
        ctx.fillStyle = '#666';
        ctx.font = '9px Arial, sans-serif';
        ctx.fillText(f, m.left, y);
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(m.left + 70, y + 2); ctx.lineTo(w - m.right, y + 2); ctx.stroke();
        y += 18;
    });

    y += 8;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Ingredients', m.left, y);
    y += 12;
    ctx.lineWidth = 0.3;
    for (let i = 0; i < 12; i++) {
        ctx.strokeRect(m.left, y - 6, 8, 8);
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(m.left + 14, y + 2); ctx.lineTo(w / 2 - 10, y + 2); ctx.stroke();
        y += 16;
    }

    y = m.top + 30 + fields.length * 18 + 20;
    const instrX = w / 2 + 10;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Instructions', instrX, y - 12);
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = '#ccc';
        ctx.font = '8px Arial, sans-serif';
        ctx.fillText((i + 1) + '.', instrX, y + 4);
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(instrX + 14, y + 6); ctx.lineTo(w - m.right, y + 6); ctx.stroke();
        y += 18;
    }

    // Notes
    y += 8;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Notes:', m.left, y);
    y += 12;
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(w - m.right, y); ctx.stroke();
        y += 18;
    }
}

function drawFitnessLog(ctx, w, h, m, color) {
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Workout Log', m.left, m.top + 10);

    let y = m.top + 30;

    // Workout table
    const headers = ['Exercise', 'Sets', 'Reps', 'Weight', 'Notes'];
    const widths = [120, 40, 40, 50, 100];
    let x = m.left;
    ctx.lineWidth = 0.5;
    headers.forEach((hdr, i) => {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 8px Arial, sans-serif';
        ctx.fillText(hdr, x + 3, y + 11);
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, widths[i], 16);
        x += widths[i];
    });
    y += 16;

    for (let r = 0; r < 12; r++) {
        x = m.left;
        widths.forEach(cw => { ctx.strokeRect(x, y, cw, 18); x += cw; });
        y += 18;
    }

    // Cardio
    y += 16;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Cardio', m.left, y);
    y += 14;
    const cardioHeaders = ['Activity', 'Duration', 'Distance', 'Calories'];
    const cardioWidths = [120, 80, 80, 70];
    x = m.left;
    cardioHeaders.forEach((hdr, i) => {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 8px Arial, sans-serif';
        ctx.fillText(hdr, x + 3, y + 11);
        ctx.strokeRect(x, y, cardioWidths[i], 16);
        x += cardioWidths[i];
    });
    y += 16;
    for (let r = 0; r < 4; r++) {
        x = m.left;
        cardioWidths.forEach(cw => { ctx.strokeRect(x, y, cw, 18); x += cw; });
        y += 18;
    }

    // Notes
    y += 12;
    ctx.fillStyle = '#555';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Notes / How I Felt:', m.left, y);
    y += 12;
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(w - m.right, y); ctx.stroke();
        y += 18;
    }
}

function drawCornellNotes(ctx, w, h, m, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const cueWidth = 120;
    const summaryHeight = 100;
    const noteArea = { x: m.left + cueWidth, y: m.top, w: w - m.right - m.left - cueWidth, h: h - m.bottom - m.top - summaryHeight };

    // Cue column
    ctx.strokeRect(m.left, m.top, cueWidth, h - m.bottom - m.top - summaryHeight);
    ctx.fillStyle = '#888';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cue Column', m.left + cueWidth / 2, m.top - 5);

    // Notes area
    ctx.strokeRect(noteArea.x, noteArea.y, noteArea.w, noteArea.h);
    ctx.fillText('Notes', noteArea.x + noteArea.w / 2, m.top - 5);

    // Lined in notes area
    ctx.lineWidth = 0.3;
    for (let y = m.top + 22; y < m.top + noteArea.h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(noteArea.x + 5, y);
        ctx.lineTo(noteArea.x + noteArea.w - 5, y);
        ctx.stroke();
    }

    // Summary box
    const sumY = h - m.bottom - summaryHeight;
    ctx.lineWidth = 1;
    ctx.strokeRect(m.left, sumY, w - m.left - m.right, summaryHeight);
    ctx.fillStyle = '#888';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Summary:', m.left + 8, sumY + 16);

    ctx.lineWidth = 0.3;
    for (let y = sumY + 28; y < sumY + summaryHeight - 5; y += 20) {
        ctx.beginPath(); ctx.moveTo(m.left + 8, y); ctx.lineTo(w - m.right - 8, y); ctx.stroke();
    }
}

// Bind template buttons
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTemplate = btn.dataset.template;
        drawInterior();
    });
});

['interior-size', 'interior-pages', 'interior-header', 'interior-page-numbers', 'interior-line-color'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', drawInterior);
    el.addEventListener('change', drawInterior);
});

document.getElementById('interior-size').addEventListener('change', e => {
    const sizes = { '6x9': [450, 675], '5.5x8.5': [413, 638], '8.5x11': [510, 660] };
    const [w, h] = sizes[e.target.value];
    interiorCanvas.width = w;
    interiorCanvas.height = h;
    drawInterior();
});

document.getElementById('btn-export-interior').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `kdp-interior-${currentTemplate}.png`;
    link.href = interiorCanvas.toDataURL('image/png');
    link.click();
    stats.interiors++;
    updateStats();
});

// ============================================================
// PUZZLE MAKER
// ============================================================
const puzzleCanvas = document.getElementById('puzzle-canvas');
const puzzleCtx = puzzleCanvas.getContext('2d');
let currentPuzzleType = 'wordsearch';

// Puzzle type switching
document.querySelectorAll('.puzzle-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.puzzle-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPuzzleType = btn.dataset.puzzle;
        document.querySelectorAll('.puzzle-options').forEach(o => o.style.display = 'none');
        document.getElementById(currentPuzzleType + '-options').style.display = 'block';
    });
});

document.getElementById('btn-generate-puzzle').addEventListener('click', generatePuzzle);

function generatePuzzle() {
    puzzleCtx.fillStyle = '#fff';
    puzzleCtx.fillRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);

    switch (currentPuzzleType) {
        case 'wordsearch': generateWordSearch(); break;
        case 'sudoku': generateSudoku(); break;
        case 'crossword': generateCrossword(); break;
        case 'maze': generateMaze(); break;
    }
    stats.puzzles++;
    updateStats();
}

function generateWordSearch() {
    const size = parseInt(document.getElementById('ws-size').value);
    const wordsRaw = document.getElementById('ws-words').value;
    const title = document.getElementById('ws-title').value;
    const words = wordsRaw.split(',').map(w => w.trim().toUpperCase()).filter(w => w.length > 0 && w.length <= size);

    // Initialize grid
    const grid = Array.from({ length: size }, () => Array(size).fill(''));

    // Place words
    const directions = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
    const placed = [];

    words.forEach(word => {
        let attempts = 0;
        while (attempts < 100) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const r = Math.floor(Math.random() * size);
            const c = Math.floor(Math.random() * size);
            if (canPlace(grid, word, r, c, dir, size)) {
                for (let i = 0; i < word.length; i++) {
                    grid[r + dir[0] * i][c + dir[1] * i] = word[i];
                }
                placed.push(word);
                break;
            }
            attempts++;
        }
    });

    // Fill empty cells
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!grid[r][c]) grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
    }

    // Draw
    const ctx = puzzleCtx;
    const cw = puzzleCanvas.width;
    const ch = puzzleCanvas.height;
    const cellSize = Math.min((cw - 60) / size, (ch - 160) / size);
    const offsetX = (cw - cellSize * size) / 2;
    const offsetY = 60;

    ctx.fillStyle = '#222';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, cw / 2, 35);

    ctx.font = `${Math.min(16, cellSize * 0.65)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellSize, cellSize);
            ctx.fillStyle = '#333';
            ctx.fillText(grid[r][c], x + cellSize / 2, y + cellSize / 2);
        }
    }

    // Word list
    const wordListY = offsetY + size * cellSize + 25;
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.fillText('Find these words:', cw / 2, wordListY);

    ctx.font = '10px Arial, sans-serif';
    const cols = 3;
    const colW = (cw - 60) / cols;
    placed.forEach((word, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.fillStyle = '#444';
        ctx.textAlign = 'left';
        ctx.fillText(word, 30 + col * colW, wordListY + 18 + row * 16);
    });
}

function canPlace(grid, word, r, c, dir, size) {
    for (let i = 0; i < word.length; i++) {
        const nr = r + dir[0] * i;
        const nc = c + dir[1] * i;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
        if (grid[nr][nc] && grid[nr][nc] !== word[i]) return false;
    }
    return true;
}

function generateSudoku() {
    const difficulty = document.getElementById('sudoku-difficulty').value;
    const clues = difficulty === 'easy' ? 38 : difficulty === 'medium' ? 30 : 24;

    // Generate solved board
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillSudoku(board, 0, 0);

    // Create puzzle by removing cells
    const puzzle = board.map(r => [...r]);
    let toRemove = 81 - clues;
    const cells = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);
    shuffle(cells);

    for (const [r, c] of cells) {
        if (toRemove <= 0) break;
        puzzle[r][c] = 0;
        toRemove--;
    }

    // Draw
    const ctx = puzzleCtx;
    const cw = puzzleCanvas.width;
    const ch = puzzleCanvas.height;
    const cellSize = 50;
    const gridSize = cellSize * 9;
    const ox = (cw - gridSize) / 2;
    const oy = 70;

    ctx.fillStyle = '#222';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Sudoku (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`, cw / 2, 35);

    // Grid
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const x = ox + c * cellSize;
            const y = oy + r * cellSize;

            // Alternating box background
            const boxR = Math.floor(r / 3);
            const boxC = Math.floor(c / 3);
            ctx.fillStyle = (boxR + boxC) % 2 === 0 ? '#f8f8f8' : '#eef';
            ctx.fillRect(x, y, cellSize, cellSize);

            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellSize, cellSize);

            if (puzzle[r][c] !== 0) {
                ctx.fillStyle = '#222';
                ctx.font = 'bold 20px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(puzzle[r][c].toString(), x + cellSize / 2, y + cellSize / 2);
            }
        }
    }

    // Bold box borders
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(ox, oy + i * cellSize * 3); ctx.lineTo(ox + gridSize, oy + i * cellSize * 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox + i * cellSize * 3, oy); ctx.lineTo(ox + i * cellSize * 3, oy + gridSize); ctx.stroke();
    }
}

function fillSudoku(board, row, col) {
    if (row === 9) return true;
    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = col === 8 ? 0 : col + 1;

    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffle(nums);

    for (const num of nums) {
        if (isValidSudoku(board, row, col, num)) {
            board[row][col] = num;
            if (fillSudoku(board, nextRow, nextCol)) return true;
            board[row][col] = 0;
        }
    }
    return false;
}

function isValidSudoku(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num || board[i][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (board[r][c] === num) return false;
        }
    }
    return true;
}

function generateCrossword() {
    const raw = document.getElementById('cw-words').value;
    const entries = raw.split('\n').map(line => {
        const [word, clue] = line.split(':').map(s => s.trim());
        return { word: (word || '').toUpperCase(), clue: clue || '' };
    }).filter(e => e.word.length > 0);

    if (entries.length === 0) return;

    // Simple crossword layout
    const gridSize = 20;
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
    const placements = [];

    // Sort by length descending
    entries.sort((a, b) => b.word.length - a.word.length);

    // Place first word horizontally in center
    const firstWord = entries[0];
    const startR = Math.floor(gridSize / 2);
    const startC = Math.floor((gridSize - firstWord.word.length) / 2);
    for (let i = 0; i < firstWord.word.length; i++) {
        grid[startR][startC + i] = firstWord.word[i];
    }
    placements.push({ ...firstWord, r: startR, c: startC, dir: 'across', num: 1 });

    // Try placing remaining words
    let num = 2;
    for (let e = 1; e < entries.length; e++) {
        const word = entries[e].word;
        let placed = false;

        for (const p of placements) {
            if (placed) break;
            for (let pi = 0; pi < p.word.length; pi++) {
                if (placed) break;
                for (let wi = 0; wi < word.length; wi++) {
                    if (word[wi] === p.word[pi]) {
                        let r, c;
                        if (p.dir === 'across') {
                            r = p.r - wi;
                            c = p.c + pi;
                            if (r >= 0 && r + word.length <= gridSize && canPlaceCrossword(grid, word, r, c, 'down', gridSize)) {
                                for (let i = 0; i < word.length; i++) grid[r + i][c] = word[i];
                                placements.push({ ...entries[e], r, c, dir: 'down', num: num++ });
                                placed = true;
                            }
                        } else {
                            r = p.r + pi;
                            c = p.c - wi;
                            if (c >= 0 && c + word.length <= gridSize && canPlaceCrossword(grid, word, r, c, 'across', gridSize)) {
                                for (let i = 0; i < word.length; i++) grid[r][c + i] = word[i];
                                placements.push({ ...entries[e], r, c, dir: 'across', num: num++ });
                                placed = true;
                            }
                        }
                    }
                }
            }
        }
    }

    // Find bounds
    let minR = gridSize, maxR = 0, minC = gridSize, maxC = 0;
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) {
        if (grid[r][c]) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
    }

    // Draw
    const ctx = puzzleCtx;
    const cw = puzzleCanvas.width;
    const ch = puzzleCanvas.height;

    ctx.fillStyle = '#222';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Crossword Puzzle', cw / 2, 35);

    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;
    const cellSize = Math.min((cw - 60) / cols, (ch - 250) / rows, 35);
    const ox = (cw - cellSize * cols) / 2;
    const oy = 60;

    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const x = ox + (c - minC) * cellSize;
            const y = oy + (r - minR) * cellSize;
            if (grid[r][c]) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);

                // Number
                const placement = placements.find(p => p.r === r && p.c === c);
                if (placement) {
                    ctx.fillStyle = '#999';
                    ctx.font = '8px Arial, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(placement.num.toString(), x + 2, y + 9);
                }
            } else {
                ctx.fillStyle = '#222';
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
    }

    // Clues
    const clueY = oy + rows * cellSize + 25;
    ctx.fillStyle = '#222';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'left';

    const across = placements.filter(p => p.dir === 'across');
    const down = placements.filter(p => p.dir === 'down');

    let cy = clueY;
    ctx.fillText('ACROSS', 30, cy);
    cy += 16;
    ctx.font = '10px Arial, sans-serif';
    across.forEach(p => {
        ctx.fillText(`${p.num}. ${p.clue}`, 30, cy);
        cy += 14;
    });

    cy += 8;
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('DOWN', 30, cy);
    cy += 16;
    ctx.font = '10px Arial, sans-serif';
    down.forEach(p => {
        ctx.fillText(`${p.num}. ${p.clue}`, 30, cy);
        cy += 14;
    });
}

function canPlaceCrossword(grid, word, r, c, dir, size) {
    for (let i = 0; i < word.length; i++) {
        const cr = dir === 'down' ? r + i : r;
        const cc = dir === 'across' ? c + i : c;
        if (cr < 0 || cr >= size || cc < 0 || cc >= size) return false;
        if (grid[cr][cc] && grid[cr][cc] !== word[i]) return false;
    }
    return true;
}

function generateMaze() {
    const size = parseInt(document.getElementById('maze-size').value);
    const maze = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ walls: [true, true, true, true], visited: false }))); // top, right, bottom, left

    // DFS maze generation
    const stack = [[0, 0]];
    maze[0][0].visited = true;

    while (stack.length > 0) {
        const [r, c] = stack[stack.length - 1];
        const neighbors = [];
        if (r > 0 && !maze[r - 1][c].visited) neighbors.push([r - 1, c, 0, 2]);
        if (c < size - 1 && !maze[r][c + 1].visited) neighbors.push([r, c + 1, 1, 3]);
        if (r < size - 1 && !maze[r + 1][c].visited) neighbors.push([r + 1, c, 2, 0]);
        if (c > 0 && !maze[r][c - 1].visited) neighbors.push([r, c - 1, 3, 1]);

        if (neighbors.length === 0) {
            stack.pop();
        } else {
            const [nr, nc, wall, opp] = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[r][c].walls[wall] = false;
            maze[nr][nc].walls[opp] = false;
            maze[nr][nc].visited = true;
            stack.push([nr, nc]);
        }
    }

    // Draw
    const ctx = puzzleCtx;
    const cw = puzzleCanvas.width;
    const ch = puzzleCanvas.height;
    const cellSize = Math.min((cw - 60) / size, (ch - 120) / size);
    const ox = (cw - cellSize * size) / 2;
    const oy = 70;

    ctx.fillStyle = '#222';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Maze', cw / 2, 35);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const x = ox + c * cellSize;
            const y = oy + r * cellSize;
            const cell = maze[r][c];

            if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
            if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
            if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
            if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
        }
    }

    // Start and end markers
    ctx.fillStyle = '#5cb85c';
    ctx.fillRect(ox + 3, oy + 3, cellSize - 6, cellSize - 6);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', ox + cellSize / 2, oy + cellSize / 2);

    ctx.fillStyle = '#d9534f';
    ctx.fillRect(ox + (size - 1) * cellSize + 3, oy + (size - 1) * cellSize + 3, cellSize - 6, cellSize - 6);
    ctx.fillStyle = '#fff';
    ctx.fillText('E', ox + (size - 0.5) * cellSize, oy + (size - 0.5) * cellSize);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

document.getElementById('btn-export-puzzle').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `kdp-puzzle-${currentPuzzleType}.png`;
    link.href = puzzleCanvas.toDataURL('image/png');
    link.click();
});

// ============================================================
// LISTING HELPER
// ============================================================
document.getElementById('btn-generate-listing').addEventListener('click', generateListing);

function generateListing() {
    const bookType = document.getElementById('listing-type').value;
    const niche = document.getElementById('listing-niche').value.trim() || 'general';
    const audience = document.getElementById('listing-audience').value.trim() || 'all ages';
    const features = document.getElementById('listing-features').value.trim() || '120 pages, matte cover';
    const trimSize = document.getElementById('listing-trim').value;

    const typeNames = {
        journal: 'Journal', planner: 'Planner', coloring: 'Coloring Book',
        puzzle: 'Puzzle Book', notebook: 'Notebook', logbook: 'Log Book',
        workbook: 'Workbook', sketchbook: 'Sketchbook'
    };
    const typeName = typeNames[bookType];

    const titleTemplates = [
        `${capitalize(niche)} ${typeName} for ${capitalize(audience)}: ${getAdjective()} ${getSubtitle(bookType)}`,
        `The Ultimate ${capitalize(niche)} ${typeName}: ${getSubtitle(bookType)} for ${capitalize(audience)}`,
        `${getAdjective()} ${capitalize(niche)} ${typeName} | ${getSubtitle(bookType)} | Perfect Gift for ${capitalize(audience)}`,
        `My ${capitalize(niche)} ${typeName}: ${getAdjective()} ${getSubtitle(bookType)} for ${capitalize(audience)}`,
        `${capitalize(niche)} ${typeName} - ${getSubtitle(bookType)} | ${getAdjective()} Design for ${capitalize(audience)}`,
    ];

    const featureList = features.split(',').map(f => f.trim()).filter(f => f);
    const trimLabel = { '6x9': '6" x 9"', '5.5x8.5': '5.5" x 8.5"', '8.5x11': '8.5" x 11"' }[trimSize];

    const description = generateDescription(typeName, niche, audience, featureList, trimLabel);
    const keywords = generateKeywords(bookType, niche, audience);
    const categories = suggestCategories(bookType, niche);

    const container = document.getElementById('listing-results');
    container.innerHTML = `
        <div class="listing-card">
            <h3>Title Suggestions <button class="btn btn-sm btn-copy" onclick="copyText(this)">Copy Best</button></h3>
            ${titleTemplates.map((t, i) => `<div class="listing-title-option" onclick="copyToClipboard('${escapeAttr(t)}')">${i + 1}. ${escapeHtml(t)}</div>`).join('')}
        </div>
        <div class="listing-card">
            <h3>Book Description <button class="btn btn-sm btn-copy" onclick="copyText(this)">Copy</button></h3>
            <p>${description}</p>
        </div>
        <div class="listing-card">
            <h3>Backend Keywords (7 fields) <button class="btn btn-sm btn-copy" onclick="copyText(this)">Copy</button></h3>
            ${keywords.map((kw, i) => `<p><strong>Field ${i + 1}:</strong> ${escapeHtml(kw)}</p>`).join('')}
        </div>
        <div class="listing-card">
            <h3>Suggested Categories</h3>
            <ul>${categories.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        </div>
        <div class="listing-card">
            <h3>Pricing Suggestions</h3>
            <ul>
                <li><strong>Minimum Viable:</strong> $${getPricing(bookType).min} - Undercuts competition, builds reviews</li>
                <li><strong>Competitive:</strong> $${getPricing(bookType).mid} - Best balance of sales volume and royalty</li>
                <li><strong>Premium:</strong> $${getPricing(bookType).max} - Higher royalty, position as premium product</li>
            </ul>
        </div>
    `;
}

function capitalize(s) { return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }

function getAdjective() {
    const adj = ['Beautiful', 'Elegant', 'Premium', 'Inspiring', 'Creative', 'Thoughtful', 'Stylish', 'Classic', 'Modern', 'Charming'];
    return adj[Math.floor(Math.random() * adj.length)];
}

function getSubtitle(type) {
    const subs = {
        journal: ['Daily Reflection & Mindfulness', 'Guided Prompts & Self-Discovery', 'Personal Growth & Wellness', 'Thoughts, Ideas & Inspiration'],
        planner: ['Daily, Weekly & Monthly Organization', 'Goal Setting & Time Management', 'Schedule & Priority Tracker', 'Productivity & Life Planner'],
        coloring: ['Relaxing Designs & Patterns', 'Stress Relief & Mindfulness', 'Beautiful Illustrations', 'Creative Expression & Fun'],
        puzzle: ['Brain Teasers & Challenges', 'Hours of Fun & Entertainment', 'Mind-Sharpening Activities', 'Logic & Problem Solving'],
        notebook: ['Wide Ruled & Easy to Write', 'Composition & Creative Writing', 'Notes, Ideas & Sketches', 'College Ruled Writing'],
        logbook: ['Track, Record & Analyze', 'Daily Tracking & Progress', 'Organized Record Keeping', 'Detailed Logging System'],
        workbook: ['Practice Exercises & Activities', 'Step-by-Step Learning', 'Skill Building & Development', 'Interactive Lessons'],
        sketchbook: ['Blank Pages for Drawing', 'Art & Creative Expression', 'Drawing & Illustration', 'Sketch, Doodle & Create'],
    };
    const options = subs[type] || subs.notebook;
    return options[Math.floor(Math.random() * options.length)];
}

function generateDescription(typeName, niche, audience, features, trimSize) {
    const featureStr = features.length > 0 ? features.map(f => `<li>${escapeHtml(f)}</li>`).join('') : '<li>Premium quality pages</li>';
    return `
        Discover the perfect ${niche} ${typeName.toLowerCase()} designed specifically for ${audience}!
        <br><br>
        Whether you're looking for a thoughtful gift or a personal companion for your ${niche} journey,
        this ${typeName.toLowerCase()} has everything you need. Carefully crafted with attention to detail,
        it provides the ideal space to capture your thoughts, track your progress, and stay organized.
        <br><br>
        <strong>Features:</strong>
        <ul>${featureStr}
            <li>${trimSize} - Perfect portable size</li>
            <li>Premium matte cover design</li>
            <li>High-quality white paper</li>
            <li>Great gift idea for ${audience}</li>
        </ul>
        <br>
        <strong>Makes the perfect gift for birthdays, holidays, or any special occasion!</strong>
        <br><br>
        Scroll up and click "Buy Now" to get your copy today!
    `;
}

function generateKeywords(bookType, niche, audience) {
    const base = [niche, bookType, audience].filter(Boolean);
    const modifiers = ['gift', 'cute', 'funny', 'personalized', 'custom', 'unique', 'large print', 'small', 'travel size'];
    const types = ['journal', 'notebook', 'planner', 'tracker', 'log book', 'diary', 'organizer'];

    const keywords = [];
    for (let i = 0; i < 7; i++) {
        const parts = [];
        parts.push(base[i % base.length]);
        parts.push(modifiers[Math.floor(Math.random() * modifiers.length)]);
        parts.push(types[Math.floor(Math.random() * types.length)]);
        if (i > 3) parts.push('for ' + audience);
        keywords.push(parts.join(' '));
    }
    return keywords;
}

function suggestCategories(bookType, niche) {
    const catMap = {
        journal: ['Books > Self-Help > Journals & Notebooks', 'Books > Self-Help > Personal Transformation', 'Books > Reference > Diaries & Journals'],
        planner: ['Books > Self-Help > Time Management', 'Books > Business > Skills > Time Management', 'Books > Reference > Planners & Organizers'],
        coloring: ['Books > Humor & Entertainment > Activity Books', 'Books > Arts & Photography > Coloring Books for Grown-Ups', 'Books > Children\'s Books > Activities & Games'],
        puzzle: ['Books > Humor & Entertainment > Puzzles & Games', 'Books > Humor & Entertainment > Activity Books', 'Books > Children\'s Books > Activities & Games'],
        notebook: ['Books > Reference > Blank Books & Journals', 'Books > Education & Teaching > Schools > Composition Notebooks', 'Books > Reference > Writing'],
        logbook: ['Books > Reference > Blank Books & Journals', 'Books > Self-Help > Journals & Notebooks', 'Books > Business > Skills > Record Keeping'],
        workbook: ['Books > Education & Teaching > Workbooks', 'Books > Reference > Study Guides', 'Books > Children\'s Books > Education'],
        sketchbook: ['Books > Arts & Photography > Drawing > Sketchbooks', 'Books > Reference > Blank Books & Journals', 'Books > Arts & Photography > Graphic Design'],
    };
    return catMap[bookType] || catMap.notebook;
}

function getPricing(bookType) {
    const pricing = {
        journal: { min: '5.99', mid: '7.99', max: '12.99' },
        planner: { min: '6.99', mid: '9.99', max: '14.99' },
        coloring: { min: '5.99', mid: '8.99', max: '12.99' },
        puzzle: { min: '4.99', mid: '6.99', max: '9.99' },
        notebook: { min: '4.99', mid: '6.99', max: '9.99' },
        logbook: { min: '5.99', mid: '8.99', max: '12.99' },
        workbook: { min: '6.99', mid: '9.99', max: '14.99' },
        sketchbook: { min: '5.99', mid: '7.99', max: '11.99' },
    };
    return pricing[bookType] || pricing.notebook;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {});
}

function copyText(btn) {
    const card = btn.closest('.listing-card');
    const text = card.querySelector('p, ul') ? (card.querySelector('p') || card.querySelector('ul')).textContent : '';
    navigator.clipboard.writeText(text).catch(() => {});
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1500);
}

// ============================================================
// INITIAL DRAWS
// ============================================================
drawCover();
drawInterior();

// Generate initial word search
setTimeout(() => {
    generatePuzzle();
}, 100);
