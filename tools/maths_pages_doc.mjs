import { PAPERS, makeQ } from '../games/joycelyn-world/src/js/islands/maths/papers.js';
import { stripTags, ansHTML } from '../games/joycelyn-world/src/js/islands/maths/mathlib.js';
import { writeFileSync } from 'fs';
const clean = (h) => stripTags(h.replace(/<svg[\s\S]*?<\/svg>/g, ' [圖：角] ')).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
let md = `# Maths Island：8 頁 × 12 題對照表

由 \`tools/maths_pages_doc.mjs\` 自動生成（改完 \`papers.js\` 再跑一次）。每頁同原卷一樣有 12 題（Q1–Q8、9a、9b、10a、10b），每題係一個產生器：**題目結構同數字大細跟原卷嗰題**，每次換新數字。下面每題列 3 條隨機例子同答案，方便同原卷對比難度。原卷有版權聲明，所以呢度冇抄原題。

`;
for (const p of PAPERS) {
  md += `## Page ${p.n} · ${p.name}${p.when ? ` · ${p.when}` : ''}（${p.level === 'core' ? 'Core，最重要' : 'Challenge，較深'}）\n\n${p.about}\n\n| 題 | 類型 | 方法提示（📘 Tip） | 例子（每次新數字） |\n|---|---|---|---|\n`;
  for (const s of p.slots) {
    const ex = [0, 1, 2].map(() => { const q = makeQ(s.id); return `${clean(q.html)} → **${clean(ansHTML(q))}**`; }).join('<br>');
    md += `| ${s.lab} | ${s.skill.replace(/\|/g, '\\|')} | ${clean(s.tip)} | ${ex} |\n`;
  }
  md += '\n';
}
writeFileSync(process.argv[2], md);
console.log('written', md.length);
