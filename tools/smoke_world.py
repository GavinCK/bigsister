#!/usr/bin/env python3
"""Joycelyn's Islands (games/joycelyn-world): automated test for the whole archipelago (Playwright).

Usage:
    node tools/build_world.mjs            # build the single HTML first
    python tools/smoke_world.py           # test games/joycelyn-world/index.html
    python tools/smoke_world.py --shots out/ [--chrome /path/to/chrome]

It serves the repo on a local web server (so 成語大冒險 can open inside the page) and checks:
1. Biodiversity Island (the original Wild Quest tests): data, 12 mini-games, Sort Storm to the end, 6 zone bosses,
   Kraken Kaptain win + prize, Star Shop, Star Road.
2. Maths Island: 89 question generators; Practice for all 19 topics typed on the on-screen keypad (3 stars);
   wrong answers → method + retry + Oops Book; all 19 Tests (100%, Maths Pal); 6 Zone Tests (boss win + prize);
   Core / Full mock interviews; time-up; Pass; spoken (grown-up marks) mode; Fix my mistakes; scratch paper.
3. 成語島: stars from 成語大冒險 are paid into the pouch; the game opens inside the page at the right chapter.
4. The sea map, island cards and zone chips; old saved progress still loads; the old Wild Quest URL redirects.
5. 3D world (WebGL via SwiftShader) runs without errors; no sideways scrolling at 1180 / 1024 / 768 / 390 px.
Prints ALL PASS (exit 0) or FAIL (exit 1).
"""
import argparse, functools, http.server, pathlib, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("html", nargs="?", default=str(ROOT / "games/joycelyn-world/index.html"))
ap.add_argument("--shots", default="")
ap.add_argument("--chrome", default="", help="path to a Chrome / Chromium binary (optional)")
args = ap.parse_args()
SHOTS = pathlib.Path(args.shots) if args.shots else None
if SHOTS: SHOTS.mkdir(parents=True, exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
REL = pathlib.Path(args.html).resolve().relative_to(ROOT).as_posix()
BASE = f"http://127.0.0.1:{httpd.server_address[1]}/{REL}"
URL = BASE + "?no3d=1"
BOSS_ZONES = ["beach", "lab", "greenhouse", "peaks", "jungle", "savanna"]
MODES = ["sort", "build", "detective", "seeds", "grow", "guard", "airlift", "suit", "hide", "panic", "feed", "boss"]

fails = []
def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  {detail}" if detail and not ok else ""))
    if not ok: fails.append(name)
def shot(pg, name):
    if SHOTS: pg.screenshot(path=str(SHOTS / f"{name}.png"))

def new_page(br, w=1180, h=820, url=None):
    pg = br.new_page(viewport={"width": w, "height": h})
    pg.errs = []
    pg.on("pageerror", lambda e: pg.errs.append(str(e)))
    pg.on("console", lambda m: pg.errs.append(m.text) if m.type == "error" and "fonts" not in m.text and "ERR_" not in m.text else None)
    pg.route("**/fonts.*/**", lambda r: r.abort())
    pg.goto(url or URL); pg.wait_for_timeout(400)
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


# =========================================================
#  Maths Island
# =========================================================
def mact(pg, a, arg=None):
    """Click a visible maths button (data-act / data-arg); Playwright selectors reach into the maths Shadow DOM."""
    sel = f"[data-act='{a}']" + (f"[data-arg='{arg}']" if arg is not None else "")
    pg.locator(sel + " >> visible=true").first.click(timeout=5000); pg.wait_for_timeout(30)
def mscreen(pg):
    return pg.evaluate("() => window.__mw && window.__mw.SES ? 'play' : (document.querySelector('.mw-host') ? 'other' : 'none')")
def close_modals(pg):
    pg.evaluate("() => { const r = window.__mw && window.__mw.root; if (r) { const m = r.getElementById('modal'); if (m) m.hidden = true; } }")

def maths_generators(pg):
    r = pg.evaluate("""() => { const M = window.__world.PACKS.find(p => p.id === 'maths').debug, bad = []; let n = 0;
      for (const id of Object.keys(M.GEN)) for (let i = 0; i < 200; i++) {
        let q; try { q = M.makeQ(id); } catch (e) { bad.push(id + ' throws ' + e.message); break; }
        n++; const txt = JSON.stringify([q.html, q.steps, q.hints]);
        if (/NaN|undefined|Infinity|\\[object/.test(txt)) { bad.push(id + ' bad text'); break; }
        if (q.kind === 'choice' && (q.correct < 0 || new Set(q.choices).size !== q.choices.length)) { bad.push(id + ' choices'); break; }
        if (!M.checkAnswer(q, M.ansEntry(q)).ok) { bad.push(id + ' answer does not check'); break; }
      } return { bad, n, gens: Object.keys(M.GEN).length }; }""")
    check(f"Maths generators ({r['gens']} generators, {r['n']} questions)", not r["bad"], str(r["bad"][:5]))

def maths_enter(pg):
    """Type the correct answer through the real maths UI: keypad, fraction boxes, choices, order chips, a.m./p.m."""
    q = pg.evaluate("() => { const it = __mw.cur(); return { kind: it.q.kind, e: (window.__world.PACKS.find(p => p.id === 'maths').debug.ansEntry)(it.q) }; }")
    k, e = q["kind"], q["e"]
    if k == "choice": pg.locator(".choice >> visible=true").nth(e["idx"]).click(); return
    if k == "order":
        for i in e["order"]: pg.locator(f".ochip[data-arg='{i}']").click()
        for j, sgn in enumerate(e["signs"]):
            for _ in range(1 if sgn == "<" else 2): pg.locator(f".osign[data-arg='{j}']").click()
        return
    if k == "time":
        pg.locator(".abox[data-f='h']").click(); mact(pg, "key", "clr")
        for c in e["h"]: mact(pg, "key", c)
        pg.locator(".abox[data-f='m']").click()
        for c in e["m"]: mact(pg, "key", c)
        if e.get("ap"): mact(pg, "ap", e["ap"])
        return
    if e["mode"] != "n": mact(pg, "mode", e["mode"])
    for f in (["s"] if e["mode"] == "n" else ["n", "d"] if e["mode"] == "f" else ["w", "n", "d"]):
        pg.locator(f".abox[data-f='{f}']").click()
        for c in e[f]: mact(pg, "key", c)

def maths_practice(pg, tid, wrong_first=False):
    pg.evaluate("(t) => __world.launch('m-' + t)", tid); pg.wait_for_timeout(500)
    mact(pg, "practice")
    for step in range(40):
        if mscreen(pg) != "play": break
        if not pg.evaluate("() => __mw.cur().done"):
            if wrong_first and step == 0:
                for _ in range(2): pg.evaluate("() => __mw.wrong()"); mact(pg, "check")
            else:
                if step == 1: mact(pg, "hint")
                maths_enter(pg); mact(pg, "check")
        mact(pg, "next")
    return pg.evaluate("() => !!(__mw.root.querySelector('.review'))")

def maths_all(br):
    pg = new_page(br)
    maths_generators(pg)
    topics = pg.evaluate("() => window.__world.PACKS.find(p => p.id === 'maths').debug.TOPICS.map(t => t.id)")
    bad = []
    for t in topics:
        p0 = pg.evaluate("() => __world.store.pouch()")
        if not maths_practice(pg, t): bad.append(t + " no result")
        elif pg.evaluate(f"() => __world.store.stars('m-{t}')") != 3: bad.append(t + " stars")
        elif pg.evaluate("() => __world.store.pouch()") < p0 + 3: bad.append(t + " pouch")
        mact(pg, "exit"); pg.wait_for_timeout(150)
    shot(pg, "maths-island-after-practice")
    check("Maths Practice: all 19 topics answered on the keypad → 3 ★ each, paid into the pouch", not bad, str(bad))
    # wrong answers: method shown, a new similar question appended, Oops Book entry
    n0 = pg.evaluate("() => __world.store.mistakesFor('maths').length")
    ok = maths_practice(pg, "eq", wrong_first=True)
    n_rev = pg.evaluate("() => __mw.root.querySelectorAll('.review > li').length")
    check("Maths Practice: 2 wrong tries → method, retry question, Oops Book", ok and n_rev == 9 and pg.evaluate("() => __world.store.mistakesFor('maths').length") > n0, f"rev={n_rev}")
    shot(pg, "maths-practice-result"); mact(pg, "exit")
    # topic tests → 100%, Maths Pal
    bad = []
    for t in topics:
        pg.evaluate("(t) => __world.launch('m-' + t)", t); pg.wait_for_timeout(400)
        mact(pg, "testintro"); mact(pg, "starttest")
        for i in range(8):
            pg.evaluate("() => __mw.solve()")
            if i < 7: mact(pg, "tnext")
        mact(pg, "finishtest"); pg.wait_for_timeout(100); close_modals(pg)
        st = pg.evaluate(f"() => ({{ pb: __world.store.get().packs.maths.topics['{t}'].pb, pal: __world.store.has('pal-{t}'), ts: __world.store.stars('m-{t}-t') }})")
        if st["pb"] != 100 or not st["pal"] or st["ts"] != 3: bad.append(f"{t} {st}")
        mact(pg, "exit"); pg.wait_for_timeout(120)
    check("Maths Tests: all 19 topics → 100%, gold, Maths Pal won", not bad, str(bad[:4]))
    # zone tests (bosses): open now, win, prize
    bad = []
    for z, prize in [("calc", "p-octopus"), ("frac", "p-flamingo"), ("eq", "p-kangaroo"), ("shape", "p-peacock"), ("measure", "p-ladybug"), ("peak", "p-trex")]:
        pg.evaluate("(z) => __world.openZone('maths', z)", z); pg.wait_for_timeout(300)
        if "Ready to fight" not in pg.evaluate("() => document.querySelector('.boss-btn')?.innerText || ''"): bad.append(z + " not open")
        pg.evaluate("() => document.querySelector('.boss-btn').click()"); pg.wait_for_timeout(500)
        mact(pg, "startzone")
        for i in range(10):
            pg.evaluate("() => __mw.solve()")
            if i < 9: mact(pg, "tnext")
        mact(pg, "finishtest"); pg.wait_for_timeout(1900)
        pg.evaluate("() => document.querySelector('.giftbox')?.click()"); pg.wait_for_timeout(700)
        r = pg.evaluate(f"() => ({{ wins: __world.store.bossWins('m-{z}'), prize: __world.store.owns('{prize}') }})")
        if r["wins"] != 1 or not r["prize"]: bad.append(f"{z} {r}")
        pg.evaluate("() => [...document.querySelectorAll('.modal .btn')].find(b => /Great|Take it|Wear/.test(b.textContent))?.click()"); pg.wait_for_timeout(200)
        mact(pg, "exit"); pg.wait_for_timeout(150)
    check("Maths Zone Tests: 6 bosses unlock, are beaten, and give their pet", not bad, str(bad))
    # mock interviews (typed)
    for kind in ["core", "full"]:
        pg.evaluate("(k) => __world.launch('miv-' + k)", kind); pg.wait_for_timeout(400)
        mact(pg, "startiv", "type")
        for i in range(12): maths_enter(pg); mact(pg, "ivsubmit"); pg.wait_for_timeout(430)
        pg.wait_for_timeout(300); close_modals(pg)
        txt = pg.evaluate("() => __mw.root.querySelector('.score')?.textContent || ''")
        check(f"Mock interview ({kind}): 12 typed answers → 12 / 12", txt.strip() == "12 / 12", txt)
        mact(pg, "exit"); pg.wait_for_timeout(150)
    shot(pg, "maths-interview")
    # time-up and Pass
    pg.evaluate("() => { __world.store.get().packs.maths.settings.itime = 1; }")
    pg.evaluate("() => __world.launch('miv-core')"); pg.wait_for_timeout(400); mact(pg, "startiv", "type")
    pg.wait_for_timeout(2300); moved = pg.evaluate("() => __mw.SES && __mw.SES.i >= 1")
    pg.evaluate("() => { __world.store.get().packs.maths.settings.itime = 0; }")
    mact(pg, "pass"); pg.wait_for_timeout(450)
    check("Mock interview: time-up moves on by itself; Pass works", moved and pg.evaluate("() => __mw.SES.i >= 2"))
    pg.evaluate("() => { __world.store.get().packs.maths.settings.itime = 45; }")
    pg.locator(".game-hud .iconbtn").first.click(); pg.wait_for_timeout(200)
    # spoken mode
    pg.evaluate("() => __world.launch('miv-core')"); pg.wait_for_timeout(400); mact(pg, "startiv", "oral")
    for i in range(12): mact(pg, "reveal"); mact(pg, "self", "1" if i % 3 else "0"); mact(pg, "next")
    pg.wait_for_timeout(200)
    txt = pg.evaluate("() => __mw.root.querySelector('.score')?.textContent || ''")
    check("Mock interview (say it, grown-up marks): 8 / 12", txt.strip() == "8 / 12", txt)
    mact(pg, "exit"); pg.wait_for_timeout(150)
    # Oops Book → Practise it / Fix my mistakes
    n_before = pg.evaluate("() => __world.store.mistakesFor('maths').length")
    pg.evaluate("() => __world.enterIsland('maths')"); pg.wait_for_timeout(300)
    pg.evaluate("() => [...document.querySelectorAll('.pill')].find(x => x.textContent.includes('Oops'))?.click()"); pg.wait_for_timeout(400)
    has_btns = pg.evaluate("() => !!document.querySelector('.oops-head .btn') && [...document.querySelectorAll('.oops .btn')].some(b => b.textContent === 'Practise it')")
    shot(pg, "oops-book")
    pg.evaluate("() => document.querySelector('.oops-head .btn').click()"); pg.wait_for_timeout(500)
    for step in range(20):
        if mscreen(pg) != "play": break
        if not pg.evaluate("() => __mw.cur().done"): maths_enter(pg); mact(pg, "check")
        mact(pg, "next")
    check("Oops Book: maths mistakes have 'Practise it'; Fix my mistakes clears them", has_btns and pg.evaluate("() => __world.store.mistakesFor('maths').length") < n_before, f"{n_before}")
    mact(pg, "exit"); pg.wait_for_timeout(150)
    # scratch paper
    pg.evaluate("() => __world.launch('m-ops')"); pg.wait_for_timeout(300); mact(pg, "practice")
    bx = pg.locator("#scv").bounding_box()
    pg.mouse.move(bx["x"] + 40, bx["y"] + 60); pg.mouse.down(); pg.mouse.move(bx["x"] + 170, bx["y"] + 120, steps=8); pg.mouse.up()
    inked = pg.evaluate("() => { const c = __mw.root.getElementById('scv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return true; return false; }")
    check("Maths scratch paper draws", inked)
    shot(pg, "maths-play")
    pg.locator(".game-hud .iconbtn").first.click(); pg.wait_for_timeout(200)
    # grown-ups page lists every island
    pg.evaluate("() => document.querySelector('[aria-label=\"For grown-ups\"]').click()"); pg.wait_for_timeout(400)
    secs = pg.evaluate("() => document.querySelectorAll('.parent-pack').length")
    shot(pg, "parents")
    check("Grown-ups page has a section per island", secs == 3, str(secs))
    check("Maths Island flows without errors", not pg.errs, str(pg.errs[:3]))
    pg.close()

# =========================================================
#  成語島 + world navigation + saved progress + old URL
# =========================================================
CN = "{v:1,name:'',sound:true,en:true,scope:'A',battle:{'1':{stars:3,acc:95},'2':{stars:2,acc:80}},fill:{},typo:{},mistakes:{},c2:{st:{a:3}},dlc:{st:{}}}"
def chinese_and_world(br):
    pg = new_page(br)
    pg.evaluate("() => { localStorage.clear(); }")
    pg.evaluate(f"() => localStorage.setItem('chengyuAdventure_v1', JSON.stringify({CN}))")
    pg.reload(); pg.wait_for_timeout(400); pg.evaluate("() => document.querySelector('.start').click()"); pg.wait_for_timeout(600)
    check("Sea map shows 3 island cards", pg.locator(".island-card").count() == 3)
    check("成語大冒險 stars (8) are paid into the pouch", pg.evaluate("() => __world.store.pouch()") == 8, str(pg.evaluate("() => __world.store.pouch()")))
    pg.locator(".island-card").nth(2).click(force=True); pg.wait_for_timeout(500)
    check("Tapping an island card enters the island", pg.evaluate("() => __world.view()") == "chinese" and pg.locator(".zone-chip").count() == 4)
    pg.evaluate("() => __world.openZone('chinese', 'dlc')"); pg.wait_for_timeout(300)
    pg.locator(".zone-card .mode-btn").first.click(force=True); pg.wait_for_timeout(2500)
    scr = pg.evaluate("() => document.querySelector('.cn-iframe').contentDocument.querySelector('.screen.active')?.id")
    check("成語島 opens 成語大冒險 inside the page at the chosen chapter (修辭樂園)", scr == "scr-dlc", str(scr))
    shot(pg, "chengyu-inside")
    pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('chengyuAdventure_v1')); s.battle['3'] = {stars: 3, acc: 100}; localStorage.setItem('chengyuAdventure_v1', JSON.stringify(s)); }")
    pg.locator(".cn-bar .btn").click(); pg.wait_for_timeout(500)
    check("Back on the island, new 成語大冒險 stars (+3) go into the pouch once", pg.locator(".cn-frame").count() == 0 and pg.evaluate("() => __world.store.pouch()") == 11)
    pg.evaluate("() => [...document.querySelectorAll('.zone-chip')].find(x => x.textContent.includes('Map'))?.click()"); pg.wait_for_timeout(400)
    check("Map chip returns to the sea map", pg.evaluate("() => __world.view()") is None and pg.locator(".island-card").count() == 3)
    check("成語島 / navigation without errors", not pg.errs, str(pg.errs[:3]))
    pg.close()
    # old saved Wild Quest progress still loads
    pg = new_page(br)
    pg.evaluate("""() => { localStorage.clear(); localStorage.setItem('wildquest-bio-p6-v1', JSON.stringify({ stars: { sort: 3, build: 2 }, best: { sort: 900 }, cards: { frog: 1 }, mistakes: [{ key: 'k1', q: 'Is a bat a bird?', ans: 'No — mammal', game: 'Sort Storm' }], settings: { music: true, sfx: true }, plays: 5, pouch: 12, lifetime: 20, owned: { 'c-scientist': 1, 'c-ninja': 1 }, equip: { costume: 'c-ninja', pet: null }, decor: ['hut'], bosses: { beach: { wins: 1 } }, road: { 3: 1 }, power: { heart: 1, slow: 0, shield: 0, clover: 0 } })); }""")
    pg.reload(); pg.wait_for_timeout(400); pg.evaluate("() => document.querySelector('.start').click()"); pg.wait_for_timeout(500)
    r = pg.evaluate("() => { const s = __world.store; return { pouch: s.pouch(), life: s.lifetime(), cos: s.equipped('costume'), sort: s.stars('sort'), oops: s.mistakesFor('science').length, decor: s.decor(), boss: s.bossWins('beach'), packs: typeof s.get().packs }; }")
    check("Old Wild Quest progress loads unchanged (pouch, outfit, stars, Oops, decor, boss wins)", r["pouch"] == 12 and r["life"] == 20 and r["cos"] == "c-ninja" and r["sort"] == 3 and r["oops"] == 1 and r["decor"] == ["hut"] and r["boss"] == 1 and r["packs"] == "object", str(r))
    pg.close()
    # old URL → new world, straight to Biodiversity Island
    pg = br.new_page(viewport={"width": 1180, "height": 820})
    pg.goto(BASE.replace("joycelyn-world/index.html", "wild-quest/index.html") + "?no3d=1"); pg.wait_for_timeout(900)
    pg.evaluate("() => document.querySelector('.start').click()"); pg.wait_for_timeout(700)
    check("Old Wild Quest URL opens Biodiversity Island in the new world", "joycelyn-world" in pg.url and pg.evaluate("() => __world.view()") == "science", pg.url)
    pg.close()

def three_d(br3):
    pg = br3.new_page(viewport={"width": 1180, "height": 820})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "fonts" not in m.text and "ERR_" not in m.text else None)
    pg.goto(BASE); pg.wait_for_timeout(2500)
    pg.evaluate("() => document.querySelector('.start').click()"); pg.wait_for_timeout(2600)
    shot(pg, "3d-map")
    for isl, z in [("science", "lab"), ("maths", "peak"), ("chinese", "ch1")]:
        pg.evaluate("(i) => __world.enterIsland(i)", isl); pg.wait_for_timeout(1800)
        shot(pg, f"3d-{isl}")
        pg.evaluate("([i, z]) => __world.openZone(i, z)", [isl, z]); pg.wait_for_timeout(1400)
    pg.evaluate("() => __world.showMap()"); pg.wait_for_timeout(1500)
    check("3D archipelago: map, 3 islands and zone flights without errors", not errs, str(errs[:3]))
    pg.close()

def no_hscroll(br):
    for w, h in [(1180, 820), (1024, 768), (768, 1024), (390, 844)]:
        pg = new_page(br, w, h)
        bad = []
        for name, js in [("map", "() => __world.showMap()"), ("maths", "() => __world.enterIsland('maths')"), ("science-boss", "() => __wq.launch('boss')"), ("maths-topic", "() => __world.launch('m-fracmix')"), ("maths-interview", "() => __world.launch('miv-full')")]:
            pg.evaluate("() => document.querySelectorAll('.game').forEach(g => g.remove())")
            pg.evaluate(js); pg.wait_for_timeout(700)
            if name == "maths-interview": pg.locator("[data-act='startiv'][data-arg='type']").click(); pg.wait_for_timeout(300)
            over = pg.evaluate("() => document.documentElement.scrollWidth > innerWidth + 1 || (window.__mw && __mw.root.getElementById('mw') && __mw.root.getElementById('mw').scrollWidth > __mw.root.getElementById('mw').clientWidth + 1)")
            if over: bad.append(name)
            if name == "maths-interview": shot(pg, f"w{w}-maths-interview")
        check(f"No sideways scroll at {w}px", not bad, str(bad))
        pg.close()

with sync_playwright() as p:
    kw = {"executable_path": args.chrome} if args.chrome else {}
    br = p.chromium.launch(**kw)
    pg = new_page(br); data_checks(pg); boss_questions(pg); shop_art(pg); check("Title + sea map load", not pg.errs, str(pg.errs[:3])); pg.close()
    for m in MODES: play_mode(br, m)
    for z in BOSS_ZONES: boss_rounds(br, z)
    sort_to_end(br)
    boss_win_and_shop(br)
    maths_all(br)
    chinese_and_world(br)
    no_hscroll(br)
    br.close()
    br3 = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"], **kw)
    three_d(br3)
    br3.close()

httpd.shutdown()
print("ALL PASS" if not fails else f"FAIL ({len(fails)}): " + ", ".join(fails))
sys.exit(1 if fails else 0)
