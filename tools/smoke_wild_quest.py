#!/usr/bin/env python3
"""Wild Quest（小六常識 Unit 1）：自動測試（Playwright）。

用法：
    node tools/build_wild_quest.mjs          # 先 build 單一 HTML
    python tools/smoke_wild_quest.py         # 測 games/wild-quest/index.html
    python tools/smoke_wild_quest.py --shots out/

測試會：
1. 檢查資料：每張圖都存在、Fake 句子有 [錯字]、填充題有 ___ 而且答案唔喺干擾選項、flowchart 每個案件都有齊屬性。
2. 12 個小遊戲逐個開，撳開始，做幾下動作，唔可以有 JavaScript error。
3. Sort Storm 用正確答案自動打到結算畫面。
4. 喺 1180、1024、768、390 闊度檢查冇橫向 scroll。
全部通過印 ALL PASS（exit 0）；否則印 FAIL（exit 1）。
"""
import argparse, pathlib, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("html", nargs="?", default=str(ROOT / "games/wild-quest/index.html"))
ap.add_argument("--shots", default="")
args = ap.parse_args()
URL = pathlib.Path(args.html).resolve().as_uri() + "?no3d=1"
SHOTS = pathlib.Path(args.shots) if args.shots else None
if SHOTS: SHOTS.mkdir(parents=True, exist_ok=True)
MODES = ["sort", "build", "detective", "seeds", "grow", "guard", "airlift", "suit", "hide", "panic", "feed", "boss"]

fails = []
def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  {detail}" if detail and not ok else ""))
    if not ok: fails.append(name)
def shot(pg, name):
    if SHOTS: pg.screenshot(path=str(SHOTS / f"wq-{name}.png"))

def new_page(br, w=1180, h=820):
    pg = br.new_page(viewport={"width": w, "height": h})
    pg.errs = []
    pg.on("pageerror", lambda e: pg.errs.append(str(e)))
    pg.on("console", lambda m: pg.errs.append(m.text) if m.type == "error" and "fonts" not in m.text and "ERR_" not in m.text else None)
    pg.route("**/fonts.*/**", lambda r: r.abort())
    pg.goto(URL); pg.wait_for_timeout(400)
    pg.evaluate("() => document.querySelector('.start').click()"); pg.wait_for_timeout(500)
    return pg

def data_checks(pg):
    r = pg.evaluate("""() => { const d = window.__wq.DATA, bad = [];
      const ids = []; const add = (a) => { if (a && !a.startsWith('svg:')) ids.push(a); };
      Object.values(d.CREATURES).forEach(c => add(c.art)); Object.values(d.PLANTS).forEach(c => add(c.art));
      d.FEEDERS.forEach(f => add(f.foodArt)); d.HIDE_SCENES.forEach(s => s.decoys.forEach(add));
      d.STATEMENTS.forEach(s => { if (!s.ok && !/\\[.+\\]/.test(s.s)) bad.push('fake w/o [] ' + s.s); if (!s.ok && s.alts.includes(s.fix)) bad.push('fix in alts ' + s.s); if (s.ok && /\\[/.test(s.s)) bad.push('fact with [] ' + s.s); });
      d.BLANKS.forEach(b => { if (b.s.split('___').length !== 2) bad.push('blank ' + b.s); if (b.d.includes(b.a)) bad.push('answer in distractors ' + b.s); });
      d.DETECTIVE_CASES.forEach(c => { const g = d.CREATURES[c.id]?.group; if (!d.GROUP_ATTR[g]) bad.push('case ' + c.id); });
      d.SORT_WAVES.forEach(w => (w.items || []).forEach(id => { if (!d.CREATURES[id]) bad.push('sort item ' + id); }));
      d.AIRLIFT_ANIMALS.forEach(id => { if (!d.CREATURES[id]?.biome) bad.push('airlift ' + id); });
      d.PANIC_ROUNDS.forEach(p => { if (!d.CREATURES[p.prey] || !d.CREATURES[p.predator]) bad.push('panic ' + p.prey); });
      d.WHO_RIGHT.forEach(w => { if (!['a','b'].includes(w.right)) bad.push('who'); });
      return { bad, ids: [...new Set(ids)], st: d.STATEMENTS.length, bl: d.BLANKS.length, cr: Object.keys(d.CREATURES).length }; }""")
    check(f"Data checks ({r['cr']} creatures, {r['st']} statements, {r['bl']} blanks)", not r["bad"], str(r["bad"][:5]))
    # every referenced picture must be inlined in the built file
    html = pathlib.Path(args.html).read_text(encoding="utf-8")
    import re
    missing = [i for i in r["ids"] if not re.search(r'[{,]"?' + re.escape(i) + r'"?:"data:image/webp', html)]
    check(f"All {len(r['ids'])} pictures inlined", not missing, str(missing[:8]))

def play_mode(br, mode):
    pg = new_page(br)
    pg.evaluate("(m) => { window.__wq.launch(m); }", mode); pg.wait_for_timeout(900)
    ok_intro = pg.evaluate("() => !!document.querySelector('.modal .btn.go')")
    pg.evaluate("() => document.querySelector('.modal .btn.go')?.click()"); pg.wait_for_timeout(2200)
    acts = {
        "build": "document.querySelector('.lab-lever')?.click()",
        "detective": "document.querySelector('.det-yes')?.click()",
        "grow": "document.querySelectorAll('.ps-row').forEach(r => r.querySelector('.ps-opt')?.click()); document.querySelector('.ps-grow')?.click()",
        "guard": "document.querySelector('.gg-card')?.click()",
        "suit": "document.querySelector('.sv-opt')?.click()",
        "hide": "document.querySelector('.hs-target')?.click()",
        "panic": "document.querySelector('.pp-btn')?.click()",
        "feed": "document.querySelector('.ff-table')?.click()",
        "boss": "document.querySelector('.fb-btns .btn')?.click()",
    }
    for _ in range(3):
        if mode in ("sort", "seeds", "airlift"):
            pg.evaluate("() => document.querySelector('.bin')?.click()")
        elif mode in acts:
            pg.evaluate(f"() => {{ {acts[mode]} }}")
        pg.wait_for_timeout(1300)
    shot(pg, mode)
    check(f"{mode}: opens and plays without errors", ok_intro and not pg.errs, str(pg.errs[:3]))
    pg.close()

def sort_to_end(br):
    pg = new_page(br)
    pg.evaluate("() => { window.__wq.launch('sort'); }"); pg.wait_for_timeout(900)
    pg.evaluate("() => document.querySelector('.modal .btn.go')?.click()")
    t0 = time.time()
    while time.time() - t0 < 150:
        st = pg.evaluate("""() => { const d = window.__wq.DATA;
          if (document.querySelector('.bigstars')) return 'done';
          const it = document.querySelector('.fall-item'); if (!it || it.dataset.t) return 'wait';
          const name = it.querySelector('.tag-name')?.textContent, txt = it.textContent;
          const id = Object.keys(d.CREATURES).find(k => d.CREATURES[k].name === name);
          let ans;
          if (document.querySelector('.bin[data-id="yes"]')) ans = id && ['insects','invertebrate'].includes(d.CREATURES[id].group) ? 'no' : 'yes';
          else ans = id ? d.CREATURES[id].group : (d.CLUE_CARDS.find(c => txt.includes(c.text)) || {}).group;
          it.dataset.t = 1; document.querySelector(`.bin[data-id="${ans}"]`)?.click(); return 'acted'; }""")
        if st == "done": break
        pg.wait_for_timeout(500)
    pg.wait_for_timeout(1500)
    res = pg.evaluate("() => ({ stars: document.querySelectorAll('.bigstars .art.on').length, txt: document.querySelector('.modal')?.innerText || '' })")
    shot(pg, "sort-result")
    check("Sort Storm: perfect play reaches 3-star result", res["stars"] == 3, res["txt"][:80])
    pg.evaluate("() => [...document.querySelectorAll('.pill')].find(b => b.textContent.includes('Field Guide'))")
    check("Sort Storm: no errors during full run", not pg.errs, str(pg.errs[:3]))
    pg.close()

def no_hscroll(br):
    for w, h in [(1180, 820), (1024, 768), (768, 1024), (390, 844)]:
        pg = new_page(br, w, h)
        over = pg.evaluate("() => document.documentElement.scrollWidth > innerWidth + 1")
        pg.evaluate("() => { window.__wq.launch('boss'); }"); pg.wait_for_timeout(700)
        over2 = pg.evaluate("() => document.documentElement.scrollWidth > innerWidth + 1")
        check(f"No sideways scroll at {w}px", not over and not over2)
        pg.close()

with sync_playwright() as p:
    br = p.chromium.launch()
    pg = new_page(br); data_checks(pg); check("Title + island hub load", not pg.errs, str(pg.errs[:3])); pg.close()
    for m in MODES: play_mode(br, m)
    sort_to_end(br)
    no_hscroll(br)
    br.close()

print("ALL PASS" if not fails else f"FAIL ({len(fails)}): " + ", ".join(fails))
sys.exit(1 if fails else 0)
