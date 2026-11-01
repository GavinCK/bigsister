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
4. 6 個區域大佬：每款題目生成 40 次，檢查答案喺選項入面、選項唔重複；逐隻大佬開打幾回合冇 error；
   用正確答案打贏 Kraken Kaptain，攞到獎品同星星。
5. 星星商店買嘢、星星之路開禮物；全部商品／大佬圖片都有 inline。
6. 喺 1180、1024、768、390 闊度檢查冇橫向 scroll。
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
BOSS_ZONES = ["beach", "lab", "greenhouse", "peaks", "jungle", "savanna"]
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

def boss_questions(pg):
    r = pg.evaluate("""() => { const B = window.__wq.BOSSES, D = window.__wq.DATA, bad = []; let n = 0;
      for (const [z, b] of Object.entries(B)) b.gens.forEach((g, gi) => { for (let i = 0; i < 40; i++) { let q; n++;
        try { q = g(); } catch (e) { bad.push(`${z}#${gi} throws ${e.message}`); return; }
        const ok = Array.isArray(q.correct) ? q.correct : [q.correct], ids = q.options.map(o => o.id), txt = q.options.map(o => o.text);
        if (!q.prompt || !q.explain || !q.key) bad.push(`${z}#${gi} missing text`);
        if (q.options.length < 2) bad.push(`${z}#${gi} options ${q.options.length}`);
        if (new Set(ids).size !== ids.length || new Set(txt).size !== txt.length) bad.push(`${z}#${gi} duplicate option: ${txt}`);
        if (!ok.length || !ok.every(id => ids.includes(id))) bad.push(`${z}#${gi} answer missing: ${q.prompt}`);
        if (ok.length >= ids.length) bad.push(`${z}#${gi} every option correct: ${q.prompt}`);
        if (q.cid && !D.CREATURES[q.cid] && !D.PLANTS[q.cid]) bad.push(`${z}#${gi} cid ${q.cid}`);
        q.options.forEach(o => { if (o.cid && !D.CREATURES[o.cid] && !D.PLANTS[o.cid]) bad.push(`${z}#${gi} option cid ${o.cid}`); });
      } });
      return { bad: [...new Set(bad)], n }; }""")
    check(f"Boss questions sane ({r['n']} generated)", not r["bad"], str(r["bad"][:5]))

def shop_art(pg):
    r = pg.evaluate("""() => { const I = window.__wq.ITEMS, B = window.__wq.BOSSES, ids = new Set();
      I.COSTUMES.forEach(c => ids.add(c.id)); [...I.PETS, ...I.DECOR, ...I.POWERUPS].forEach(x => ids.add(x.art));
      Object.values(B).forEach(b => ids.add(b.art));
      const bad = []; const all = new Set([...I.COSTUMES, ...I.PETS, ...I.DECOR].map(x => x.id));
      Object.values(I.BOSS_PRIZES).forEach(p => { if (!all.has(p)) bad.push('prize ' + p); });
      I.ROAD.forEach(r => { if (r.gift.item && !all.has(r.gift.item)) bad.push('road ' + r.gift.item); });
      return { ids: [...ids], bad }; }""")
    check("Boss prizes + Star Road gifts exist in catalogue", not r["bad"], str(r["bad"]))
    html = pathlib.Path(args.html).read_text(encoding="utf-8")
    import re
    missing = [i for i in r["ids"] if not re.search(r'[{,]"?' + re.escape(i) + r'"?:"data:image/webp', html)]
    check(f"All {len(r['ids'])} shop / boss pictures inlined", not missing, str(missing[:8]))

def boss_rounds(br, zone):
    pg = new_page(br)
    pg.evaluate("(m) => { window.__wq.launch(m); }", f"boss-{zone}"); pg.wait_for_timeout(900)
    ok_intro = pg.evaluate("() => !!document.querySelector('.modal .btn.go')")
    pg.evaluate("() => document.querySelector('.modal .btn.go')?.click()"); pg.wait_for_timeout(2000)
    for i in range(4):  # mix right and wrong answers
        pg.evaluate("(i) => { const d = document.querySelector('.bf-dodge'); if (d) return d.click(); const b = document.querySelector(i % 2 ? '.bf-opt:not([data-ok]):not([disabled])' : '.bf-opt[data-ok]:not([disabled])'); b && b.click(); }", i)
        pg.wait_for_timeout(1800 if i % 2 else 1300)
    has_q = pg.evaluate("() => !!document.querySelector('.bf-q')")
    shot(pg, f"boss-{zone}")
    check(f"Boss {zone}: opens and plays without errors", ok_intro and has_q and not pg.errs, str(pg.errs[:3]))
    pg.close()

def boss_win_and_shop(br):
    pg = new_page(br)
    pg.evaluate("() => { localStorage.clear(); }"); pg.reload(); pg.wait_for_timeout(400)
    pg.evaluate("() => document.querySelector('.start').click()"); pg.wait_for_timeout(500)
    # boss row is locked until every zone game has a star
    pg.evaluate("() => window.__wq.openZone('beach')"); pg.wait_for_timeout(500)
    locked = pg.evaluate("() => !!document.querySelector('.boss-btn.locked, .boss-btn[disabled], .boss-btn[aria-disabled=\"true\"]') || /Locked/.test(document.querySelector('.boss-btn')?.innerText || '')")
    check("Boss starts locked", locked)
    pg.evaluate("() => { window.__wq.store.record('sort', 1, 500); document.querySelector('.zone-card .close')?.click(); }"); pg.wait_for_timeout(300)
    pg.evaluate("() => window.__wq.openZone('beach')"); pg.wait_for_timeout(500)
    opened = pg.evaluate("() => /Ready to fight/.test(document.querySelector('.boss-btn')?.innerText || '')")
    check("Boss unlocks after 1 star in every zone game", opened)
    before = pg.evaluate("() => window.__wq.store.pouch()")
    pg.evaluate("() => document.querySelector('.boss-btn').click()"); pg.wait_for_timeout(1000)
    pg.evaluate("() => document.querySelector('.modal .btn.go')?.click()"); pg.wait_for_timeout(2000)
    t0 = time.time()
    while time.time() - t0 < 90:
        st = pg.evaluate("""() => { if (document.querySelector('.bigstars')) return 'done';
          const d = document.querySelector('.bf-dodge'); if (d) { d.click(); return 'dodge'; }
          const ok = document.querySelector('.bf-opt[data-ok]:not([disabled])'); if (ok) { ok.click(); return 'ans'; } return 'wait'; }""")
        if st == "done": break
        pg.wait_for_timeout(500)
    pg.wait_for_timeout(2600)
    r = pg.evaluate("() => ({ stars: document.querySelectorAll('.bigstars .art.on').length, wins: window.__wq.store.get().bosses?.beach?.wins || 0, pouch: window.__wq.store.pouch() })")
    check("Kraken Kaptain: perfect play wins 3 stars", r["stars"] == 3 and r["wins"] == 1, str(r))
    check("Boss win pays stars + first-win bonus into pouch", r["pouch"] >= before + 3 + 5, f"{before} -> {r['pouch']}")
    pg.evaluate("() => document.querySelector('.giftbox')?.click()"); pg.wait_for_timeout(1000)
    prize = pg.evaluate("() => document.querySelector('.gift-reveal')?.innerText || ''")
    shot(pg, "boss-prize")
    check("First win gives the Sailboat prize", "Sailboat" in prize and "null" not in prize and "sailboat" in pg.evaluate("() => window.__wq.store.decor()"), prize[:60])
    pg.evaluate("() => [...document.querySelectorAll('.modal .btn')].find(b => b.textContent === 'Great!')?.click()"); pg.wait_for_timeout(400)
    pg.evaluate("() => [...document.querySelectorAll('.modal .btn')].find(b => b.textContent === 'Island')?.click()"); pg.wait_for_timeout(800)
    # Star Shop: buy a decoration
    pg.evaluate("() => window.__wq.store.earn(30)")
    p0 = pg.evaluate("() => window.__wq.store.pouch()")
    pg.evaluate("() => [...document.querySelectorAll('.pill')].find(x => x.textContent.includes('Shop'))?.click()"); pg.wait_for_timeout(600)
    pg.evaluate("() => [...document.querySelectorAll('.book-tabs button')].find(x => x.textContent.includes('Island'))?.click()"); pg.wait_for_timeout(300)
    pg.evaluate("() => document.querySelector('.shop-card .btn:not([disabled])')?.click()"); pg.wait_for_timeout(400)
    pg.evaluate("() => [...document.querySelectorAll('.modal .btn')].find(x => x.textContent === 'Buy')?.click()"); pg.wait_for_timeout(500)
    shot(pg, "shop")
    r = pg.evaluate("() => ({ pouch: window.__wq.store.pouch(), decor: window.__wq.store.decor().length })")
    check("Star Shop: buying spends pouch stars and places decor", r["pouch"] < p0 and r["decor"] >= 2, f"{p0} -> {r}")
    pg.evaluate("() => document.querySelector('.shop .book-head .iconbtn')?.click()"); pg.wait_for_timeout(400)
    # Star Road: claim a gift
    pg.evaluate("() => [...document.querySelectorAll('.pill')].find(x => /gift|Road/.test(x.textContent))?.click()"); pg.wait_for_timeout(600)
    pg.evaluate("() => document.querySelector('.road-node.ready')?.click()"); pg.wait_for_timeout(600)
    pg.evaluate("() => document.querySelector('.giftbox')?.click()"); pg.wait_for_timeout(1000)
    txt = pg.evaluate("() => document.querySelector('.gift-reveal')?.innerText || ''")
    claimed = pg.evaluate("() => Object.keys(window.__wq.store.get().road || {}).length")
    shot(pg, "road-gift")
    check("Star Road: ready gift opens and is claimed", claimed >= 1 and txt and "null" not in txt, txt[:60])
    check("Boss / shop / road flow without errors", not pg.errs, str(pg.errs[:3]))
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
    pg = new_page(br); data_checks(pg); boss_questions(pg); shop_art(pg); check("Title + island hub load", not pg.errs, str(pg.errs[:3])); pg.close()
    for m in MODES: play_mode(br, m)
    for z in BOSS_ZONES: boss_rounds(br, z)
    sort_to_end(br)
    boss_win_and_shop(br)
    no_hscroll(br)
    br.close()

print("ALL PASS" if not fails else f"FAIL ({len(fails)}): " + ", ".join(fails))
sys.exit(1 if fails else 0)
