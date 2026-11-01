#!/usr/bin/env python3
"""成語大冒險：自動打通測試（Playwright）。

用法：
    python tools/smoke_test.py                 # 測 games/chengyu-adventure/index.html
    python tools/smoke_test.py --shots out/    # 順便影 screenshot
    python tools/smoke_test.py path/to/index.html

需要：pip install playwright && python -m playwright install chromium
全部通過會印 ALL PASS，exit code 0；有問題會印 FAIL，exit code 1。
"""
import argparse, json, pathlib, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("html", nargs="?", default=str(ROOT / "games/chengyu-adventure/index.html"))
ap.add_argument("--shots", default="")
args = ap.parse_args()
URL = pathlib.Path(args.html).resolve().as_uri()
SHOTS = pathlib.Path(args.shots) if args.shots else None
if SHOTS: SHOTS.mkdir(parents=True, exist_ok=True)

errs, fails = [], []
def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  {detail}" if detail and not ok else ""))
    if not ok: fails.append(name)
def shot(pg, name, full=False):
    if SHOTS: pg.screenshot(path=str(SHOTS / f"{name}.png"), full_page=full)
def modal_open(pg): return pg.evaluate("() => !document.getElementById('modal').hidden")
def wait_modal(pg, secs=6):
    t0 = time.time()
    while time.time() - t0 < secs:
        if modal_open(pg): break
        pg.wait_for_timeout(150)
    ok = modal_open(pg); pg.evaluate("() => closeModal()"); return ok
def press(pg, attr, name, a=""):
    """模擬撳一粒 data-c2 / data-rh 掣（唔受位置、modal 影響）。"""
    pg.evaluate("([attr,n,a]) => { const b=document.createElement('button'); b.setAttribute(attr,n); if (a!=='') b.dataset.a=a; document.body.appendChild(b); b.click(); b.remove(); }", [attr, name, a])
c2 = lambda pg, n, a="": press(pg, "data-c2", n, a)
rh = lambda pg, n, a="": press(pg, "data-rh", n, a)
def tap(pg, sel): pg.locator(sel).first.click(force=True)
def nav(pg, name):
    pg.evaluate("() => closeModal()"); pg.click(f".nav [data-go={name}]"); pg.wait_for_timeout(200)

def data_checks(pg):
    r = pg.evaluate("""() => { const bad=[];
      IDIOMS.forEach(d=>d.s.forEach(s=>{ if((s.match(/\\{\\}/g)||[]).length!==1) bad.push('idiom '+d.w); }));
      VOCAB.forEach(d=>{ if((d.s.match(/\\{\\}/g)||[]).length!==1) bad.push('vocab '+d.w); if((d.near||[]).includes(d.w)) bad.push('near=answer '+d.w); });
      const ws=[...IDIOMS,...VOCAB].map(d=>d.w); const dup=ws.filter((w,i)=>ws.indexOf(w)!==i); if(dup.length) bad.push('dup '+dup);
      TYPO.forEach(t=>{ if(t.sent.split(t.w).length!==2) bad.push('typo sent '+t.w); if(!t.wrongIdx.length) bad.push('typo diff '+t.w);
        if(new Set(t.opts).size!==t.opts.length || t.opts.includes(t.badC)) bad.push('typo opts '+t.w); });
      RH_MAGIC.forEach((m,i)=>{ const roles=m.ch.split('|').map(x=>x.split(':')[1]||''); if(!roles.includes('喻')) bad.push('magic '+i); });
      RH_ECHO.forEach(e=>{ if(e.s.split(e.rep).length<3) bad.push('echo '+e.rep); });
      RH_TRAIN.forEach(t=>{ (t.l||[]).forEach((w,k)=>{ if(!t.c[k].endsWith(w)||!t.c[k+1].startsWith(w)) bad.push('train '+w); }); });
      RH_RUSH.forEach(r=>{ if(!RH[r[1]]) bad.push('rush '+r[1]); r[2].split(' ').filter(Boolean).forEach(x=>{ if(!RH[x]) bad.push('rush ex '+x); }); });
      return {bad, idioms:IDIOMS.length, vocab:VOCAB.length, typo:TYPO.length}; }""")
    check(f"資料檢查（{r['idioms']} 成語、{r['vocab']} 詞語、{r['typo']} 錯字題）", not r["bad"], str(r["bad"][:5]))

def ch1(pg):
    for scope in ["A", "B"]:
        pg.evaluate(f"() => {{ if (S.scope!=='{scope}') switchScope('{scope}'); }}"); pg.wait_for_timeout(200)
        worlds = pg.evaluate("() => sw()")
        for w in [worlds[0], worlds[-1]]:
            pg.evaluate(f"() => startBattle('{w}')"); pg.wait_for_timeout(300)
            for _ in range(60):
                st = pg.evaluate("() => B && !B.over ? {state:B.state, ans:B.qs[B.cur].i} : null")
                if not st: break
                if st["state"] == "ask": tap(pg, f"[data-opt='{st['ans']}']"); pg.wait_for_timeout(60)
                tap(pg, "#bNext"); pg.wait_for_timeout(40)
            check(f"第一章 範圍{scope} 擂台 {w}", wait_modal(pg, 4))
        nav(pg, "fill"); pg.wait_for_timeout(300)
        for i in pg.evaluate("() => vIds()"):
            pg.fill(f".vinput[data-v='{i}']", pg.evaluate(f"() => VOCAB[{i}].w")); pg.wait_for_timeout(15)
        pg.wait_for_timeout(1300)
        check(f"第一章 範圍{scope} 詞語尋寶", pg.evaluate("() => fillOk() === nV()"))
        pg.evaluate("() => closeModal()")
        nav(pg, "typo"); pg.wait_for_timeout(200)
        for book in ["i", "v"]:
            tap(pg, f"[data-tbook='{book}']"); pg.wait_for_timeout(80)
            for k in range(pg.evaluate("() => bookItems().length")):
                tap(pg, f"[data-tcase='{k}']"); pg.wait_for_timeout(20)
                t = pg.evaluate("() => { const t=bookItems()[T.pos]; return {wi:t.wrongIdx, good:t.good}; }")
                tap(pg, f"[data-tile='{t['wi'][0]}']"); pg.wait_for_timeout(20)
                tap(pg, f"[data-tch='{t['good']}']"); pg.wait_for_timeout(20)
        check(f"第一章 範圍{scope} 錯字偵探", pg.evaluate("() => tItems().every(t=>S.typo[t.id]==='p')"))
    pg.evaluate("() => { if (S.scope!=='A') switchScope('A'); }")

def ch2(pg):
    pg.evaluate("() => { C2.ensure(); S.c2.intro = true; S.c2.slow = false; save(); }")
    nav(pg, "ch2"); pg.wait_for_timeout(200); shot(pg, "c2_map", True)
    for pi in range(2):
        c2(pg, "stage", f"sound:story{pi+1}"); pg.wait_for_timeout(200)
        for a in pg.evaluate(f"() => SOUND_STORY[{pi}].blanks.map(b=>b.a)"):
            tap(pg, f"[data-c2=sans][data-a='{a}']"); pg.wait_for_timeout(200)
        check(f"第二章 故事書{pi+1}", wait_modal(pg))
    c2(pg, "stage", "sound:match"); pg.wait_for_timeout(200)
    cards = pg.evaluate("() => [...document.querySelectorAll('.mcard')].map(c=>c.querySelector('.f').innerText.replace(/\\s/g,''))")
    rev = pg.evaluate("() => Object.fromEntries(Object.entries(ONO).map(([w,o])=>[(o.e+o.m).replace(/\\s/g,''), w]))")
    keys = [c if c in rev.values() else rev.get(c) for c in cards]
    pos = {}
    for i, k in enumerate(keys): pos.setdefault(k, []).append(i)
    for k, (i, j) in pos.items():
        tap(pg, f"[data-c2=mflip][data-a='{i}']"); tap(pg, f"[data-c2=mflip][data-a='{j}']"); pg.wait_for_timeout(100)
    check("第二章 聲音翻牌", wait_modal(pg))
    c2(pg, "stage", "sound:quiz"); pg.wait_for_timeout(200)
    for _ in range(10):
        txt = pg.inner_text(".c2-text")
        ans = pg.evaluate("(t) => { const c=t.replace(/\\s/g,''); const q=SOUND_Q.find(q=>c===q[0].replace('{}','？')); return q?q[1]:null; }", txt)
        tap(pg, f"[data-c2=qans][data-a='{ans}']"); pg.wait_for_timeout(80); tap(pg, "[data-c2=qnext]"); pg.wait_for_timeout(80)
    check("第二章 聲音挑戰", wait_modal(pg))
    for setname, stg in [("SHOP_A", "a"), ("SHOP_B", "b")]:
        c2(pg, "stage", f"shop:{stg}"); pg.wait_for_timeout(200)
        for _ in range(pg.evaluate(f"() => {setname}.q.length")):
            ph = pg.inner_text("#order .ph")
            ans = pg.evaluate(f"(t) => {{ const c=t.replace(/[「」\\s]/g,''); const q={setname}.q.find(q=>c===q[0].replace('{{}}','？')); return q?q[1]:null; }}", ph)
            tap(pg, f"[data-c2=shopans][data-a='{ans}']"); pg.wait_for_timeout(100); tap(pg, "[data-c2=shopnext]"); pg.wait_for_timeout(420)
        check(f"第二章 雜貨店 {stg}", wait_modal(pg))
    c2(pg, "stage", "shop:story"); pg.wait_for_timeout(200)
    for a in pg.evaluate("() => SHOP_STORY.steps.map(s=>s[2])"):
        tap(pg, f"[data-c2=ssans][data-a='{a}']"); pg.wait_for_timeout(80); tap(pg, "[data-c2=ssnext]"); pg.wait_for_timeout(80)
    check("第二章 探望表哥", wait_modal(pg))
    c2(pg, "stage", "shop:news"); pg.wait_for_timeout(200)
    for i, a in enumerate(pg.evaluate("() => SHOP_NEWS.a")): pg.fill(f"#nw{i}", a)
    tap(pg, "[data-c2=newscheck]"); check("第二章 讀報", wait_modal(pg))
    c2(pg, "stage", "post:play"); pg.wait_for_timeout(200)
    for _ in range(16):
        typ = pg.evaluate("(t) => (LETTERS.find(l=>l[0]===t.trim())||[])[1]", pg.inner_text("#letter"))
        tap(pg, f"[data-c2=house][data-a='{typ}']"); pg.wait_for_timeout(2000)
    check("第二章 郵差派信", wait_modal(pg))
    c2(pg, "stage", "bridge:pairs"); pg.wait_for_timeout(200)
    for _ in range(6):
        L = pg.evaluate("() => [...document.querySelectorAll('[data-c2=pl]:not([disabled])')].map(b=>[b.dataset.a,b.innerText.replace('……','')])")
        R = pg.evaluate("() => [...document.querySelectorAll('[data-c2=pr]:not([disabled])')].map(b=>[b.dataset.a,b.innerText.replace('……','')])")
        need = pg.evaluate("(l) => PAIRS.find(p=>p[0]===l)[1]", L[0][1])
        tap(pg, f"[data-c2=pl][data-a='{L[0][0]}']"); tap(pg, f"[data-c2=pr][data-a='{[a for a, t in R if t == need][0]}']"); pg.wait_for_timeout(100)
    check("第二章 關聯詞對對碰", wait_modal(pg))
    c2(pg, "stage", "bridge:s1"); pg.wait_for_timeout(200)
    for _ in range(5):
        idx = pg.evaluate("(t) => { const c=t.replace(/\\s/g,''); const q=BR1.q.find(q=>c===q[0].replace('{}','？').replace('{}','？')); return q?q[1]:null; }", pg.inner_text(".c2-text"))
        tap(pg, f"[data-c2=b1][data-a='{idx}']"); pg.wait_for_timeout(300); tap(pg, "[data-c2=b1next]"); pg.wait_for_timeout(120)
    check("第二章 搭橋", wait_modal(pg))
    c2(pg, "stage", "bridge:s2"); pg.wait_for_timeout(200)
    for a in pg.evaluate("() => BR2.a"): tap(pg, f"[data-c2=s2][data-a='{a}']"); pg.wait_for_timeout(80)
    check("第二章 上山路", wait_modal(pg))
    c2(pg, "stage", "bridge:build"); pg.wait_for_timeout(200)
    for k in range(pg.evaluate("() => BUILD.length")):
        b = pg.evaluate(f"() => BUILD[{k}]")
        tiles = pg.evaluate("() => [...document.querySelectorAll('[data-c2=btile]')].map(x=>[x.dataset.a,x.innerText])")
        for s in [b["c"][0], b["cl"][0], b["c"][1], b["cl"][1]]:
            tap(pg, f"[data-c2=btile][data-a='{[i for i, t in tiles if t == s][0]}']"); pg.wait_for_timeout(30)
        tap(pg, "[data-c2=bcheck]"); pg.wait_for_timeout(80); tap(pg, "[data-c2=bnext]"); pg.wait_for_timeout(80)
    check("第二章 砌句工場", wait_modal(pg))
    c2(pg, "stage", "mole:play"); pg.wait_for_timeout(200); t0 = time.time()
    for _ in range(10):
        while time.time() - t0 < 240:
            st = pg.evaluate("() => ({s:document.getElementById('msent').innerText, step:document.getElementById('mstep').innerText, ups:[...document.querySelectorAll('.mole.up')].map(m=>[m.dataset.a, m.querySelector('.sign').innerText]), next:!!document.querySelector('[data-c2=mnext]')})")
            if st["next"]: break
            m = pg.evaluate("(t) => { const c=t.replace(/\\s/g,''); return MOLE.find(m=>!m.ex && c.startsWith(m.s.slice(0,4))) }", st["s"])
            target = m["w"] if st["step"].startswith("第一步") else m["a"]
            hit = [a for a, c in st["ups"] if c == target]
            if hit: tap(pg, f"#mole{hit[0]}"); pg.wait_for_timeout(120)
            else: pg.wait_for_timeout(100)
        tap(pg, "[data-c2=mnext]"); pg.wait_for_timeout(120)
    check("第二章 錯字打地鼠", wait_modal(pg))
    check("第二章 五個地方修復 100%", pg.evaluate("() => C2.AREAS.every(a=>C2.pct(a)===100)"))

def dlc(pg):
    pg.evaluate("() => { DLC.ensure(); S.dlc.intro = true; save(); }")
    nav(pg, "dlc"); pg.wait_for_timeout(200); shot(pg, "dlc_map", True)
    def play(r): pg.evaluate("() => closeModal()"); rh(pg, "play", r); pg.wait_for_timeout(250)
    play("magic")
    for i in range(pg.evaluate("() => RH_MAGIC.length")):
        it = pg.evaluate(f"() => RH_MAGIC[{i}]"); ch = [x.split(":") for x in it["ch"].split("|")]
        for role in ["本", "詞", "喻"]:
            idx = [k for k, c in enumerate(ch) if len(c) > 1 and c[1] == role]
            rh(pg, "mch", str(idx[0])) if idx else rh(pg, "mnone"); pg.wait_for_timeout(40)
        rh(pg, "mtype", it["t"]); pg.wait_for_timeout(80); rh(pg, "mnext"); pg.wait_for_timeout(60)
    check("修辭樂園 變身魔術", wait_modal(pg))
    play("belt"); t0 = time.time()
    while not modal_open(pg) and time.time() - t0 < 120:
        cur = pg.evaluate("() => { const c=document.getElementById('bcard'); return c ? c.textContent : null; }")
        if cur: rh(pg, "bin", pg.evaluate("(t) => RH_BELT.find(x=>x[0]===t)[1]", cur)); pg.wait_for_timeout(1700)
        else: pg.wait_for_timeout(150)
    check("修辭樂園 比喻輸送帶", wait_modal(pg))
    play("idiom")
    for i in range(pg.evaluate("() => RH_IDIOM.length")):
        it = pg.evaluate(f"() => RH_IDIOM[{i}]")
        for k in it[1]: tap(pg, f"[data-rh=ich][data-a='{it[0][k]}']"); pg.wait_for_timeout(60)
        rh(pg, "inext"); pg.wait_for_timeout(60)
    check("修辭樂園 成語沖曬館", wait_modal(pg))
    play("spring")
    for k, (t, i) in enumerate(pg.evaluate("() => RH_SPRING")):
        if i > 0: rh(pg, "spr", str(k)); pg.wait_for_timeout(150)
    check("修辭樂園 喚醒春天", wait_modal(pg))
    play("portal")
    for _ in range(pg.evaluate("() => RH_PORTAL.length")):
        t = pg.evaluate("() => { const s=document.querySelector('#dlc .rh-sent').innerText.trim(); return RH_PORTAL.find(x=>x.s===s).t; }")
        f, to = {"A": ("物", "人"), "B": ("人", "物"), "C": ("物", "物")}[t]
        rh(pg, "pside", f"from:{f}"); rh(pg, "pside", f"to:{to}"); pg.wait_for_timeout(80); rh(pg, "pnext"); pg.wait_for_timeout(60)
    check("修辭樂園 變身門", wait_modal(pg))
    play("echo")
    for i in range(pg.evaluate("() => RH_ECHO.length")):
        it = pg.evaluate(f"() => RH_ECHO[{i}]")
        rh(pg, "ech", str(it["s"].index(it["rep"]))); pg.wait_for_timeout(80); rh(pg, "etype", it["t"]); pg.wait_for_timeout(60)
        if it.get("fx"): rh(pg, "efx", str(it["a"])); pg.wait_for_timeout(60)
        rh(pg, "enext"); pg.wait_for_timeout(60)
    check("修辭樂園 回音谷", wait_modal(pg))
    play("qbro"); t0 = time.time()
    while not modal_open(pg) and time.time() - t0 < 120:
        st = pg.evaluate("() => { const b=document.getElementById('ball'); return {b: b && !b.classList.contains('caught') ? b.textContent : null, ex: !!document.querySelector('[data-rh=qhid]'), q: b ? b.textContent : null}; }")
        if st["ex"]: rh(pg, "qhid", str(pg.evaluate("(t) => RH_Q.find(x=>x[0]===t)[4]", st["q"]))); pg.wait_for_timeout(300); continue
        if st["b"]: rh(pg, "bro", pg.evaluate("(t) => RH_Q.find(x=>x[0]===t)[1]", st["b"])); pg.wait_for_timeout(400)
        else: pg.wait_for_timeout(150)
    check("修辭樂園 問號三兄弟", wait_modal(pg))
    play("mirror"); M = pg.evaluate("() => RH_MIRROR")
    for pid in (1, 2, 3):
        ks = [k for k, (t, p) in enumerate(M) if p == pid]; rh(pg, "mir", str(ks[0])); rh(pg, "mir", str(ks[1])); pg.wait_for_timeout(100)
    pg.wait_for_timeout(1900)
    for t in range(3):
        for w in pg.evaluate(f"() => RH_TOWER[{t}].a"): tap(pg, f"[data-rh=tw][data-a='{w}']"); pg.wait_for_timeout(40)
        rh(pg, "tnext"); pg.wait_for_timeout(100)
    for d, v in enumerate(["棉花糖", "小船", "駿馬"]): pg.fill(f"#to{d}", v)
    rh(pg, "topen"); pg.wait_for_timeout(200); rh(pg, "tnext")
    check("修辭樂園 魔鏡同積木塔", wait_modal(pg))
    play("zap")
    for _ in range(pg.evaluate("() => RH_ZAP.length")):
        a = pg.evaluate("() => { const s=document.querySelector('#dlc .rh-sent').innerText.trim(); return RH_ZAP.find(x=>x[0]===s)[1]; }")
        rh(pg, "zap", a); pg.wait_for_timeout(550); rh(pg, "znext"); pg.wait_for_timeout(60)
    check("修辭樂園 誇張魔法棒", wait_modal(pg))
    play("seesaw")
    for _ in range(pg.evaluate("() => RH_SEE.length")):
        a = pg.evaluate("() => { const s=document.querySelector('#dlc .rh-sent').innerText.trim(); return RH_SEE.find(x=>x[0]===s)[1]; }")
        rh(pg, "see", a); pg.wait_for_timeout(100); rh(pg, "snext"); pg.wait_for_timeout(60)
    check("修辭樂園 對比遊樂場", wait_modal(pg))
    play("train")
    for i in range(pg.evaluate("() => RH_TRAIN.length")):
        it = pg.evaluate(f"() => RH_TRAIN[{i}]")
        if it["l"]:
            rh(pg, "tyes"); pg.wait_for_timeout(60)
            for _ in it["l"]: rh(pg, "tch", "0"); pg.wait_for_timeout(80)
        else: rh(pg, "tno"); pg.wait_for_timeout(60)
        rh(pg, "trnext"); pg.wait_for_timeout(60)
    check("修辭樂園 頂真火車", wait_modal(pg))
    play("rush"); t0 = time.time(); clash = []
    while not modal_open(pg) and time.time() - t0 < 70:
        st = pg.evaluate("() => { const r=document.getElementById('rq'); const ok=document.querySelector('#ropts .btn.right, #ropts .btn.wrong'); return r && !ok ? {q:r.textContent, o:[...document.querySelectorAll('#ropts .btn')].map(b=>b.dataset.a)} : null; }")
        if st:
            it = pg.evaluate("(t) => RH_RUSH.find(x=>x[0]===t)", st["q"]); ex = set([x for x in it[2].split(" ") if x])
            if it[1] not in st["o"] or (set(st["o"]) - {it[1]}) & ex: clash.append(st["q"])
            pg.evaluate("(a) => document.querySelector(`#ropts .btn[data-a='${a}']`).click()", it[1]); pg.wait_for_timeout(320)
        else: pg.wait_for_timeout(100)
    check("修辭過山車 選項冇撞答案", not clash, str(clash[:3]))
    check("修辭過山車 打敗悶悶怪", wait_modal(pg, 3) and pg.evaluate("() => S.dlc.st.rush === 3"))
    check("修辭樂園 收集齊 14 隻精靈", pg.evaluate("() => RH_ORDER.filter(DLC.unlocked).length === 14"))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1180, "height": 860})
    pg.on("pageerror", lambda e: errs.append(("pageerror", str(e), (e.stack or "").splitlines()[1:3])))
    pg.on("console", lambda m: errs.append(("console", m.text)) if m.type == "error" else None)
    pg.on("dialog", lambda d: (errs.append(("native dialog", d.message)), d.dismiss()))
    pg.goto(URL); pg.wait_for_timeout(500)
    pg.evaluate("() => { try { localStorage.clear(); } catch(e){} }"); pg.reload(); pg.wait_for_timeout(400)
    data_checks(pg)
    pg.fill("#nameIn", "測試"); pg.click("#nameGo"); pg.wait_for_timeout(200); shot(pg, "home")
    ch1(pg); ch2(pg); dlc(pg)
    nav(pg, "report"); pg.wait_for_timeout(300); shot(pg, "report", True)
    check("成績表有第二章同修辭樂園", pg.evaluate("() => { const t=document.getElementById('reportBody').innerText; return t.includes('第二章') && t.includes('修辭樂園'); }"))
    pg.reload(); pg.wait_for_timeout(400)
    check("重新整理後進度仲喺度", pg.evaluate("() => S.name==='測試' && Object.keys(S.battle).length>0 && Object.keys(S.c2.st).length>0 && Object.keys(S.dlc.st).length>0"))
    for w, h in [(1024, 768), (1180, 820), (768, 1024), (390, 844)]:
        m = b.new_page(viewport={"width": w, "height": h}, has_touch=True, is_mobile=w < 500)
        m.on("pageerror", lambda e: errs.append(("pageerror", str(e))))
        m.goto(URL); m.wait_for_timeout(300)
        for scr in ["home", "battle", "ch2", "dlc", "report"]:
            m.evaluate(f"() => go('{scr}')"); m.wait_for_timeout(120)
            ov = m.evaluate("() => Math.max(document.documentElement.scrollWidth - innerWidth, document.querySelector('.topbar').scrollWidth - document.querySelector('.topbar').clientWidth)")
            if ov > 0: fails.append(f"{w}px {scr} 橫向溢出 {ov}px"); print(f"FAIL {w}px {scr} 橫向溢出 {ov}px")
        if SHOTS: m.screenshot(path=str(SHOTS / f"w{w}.png"))
        m.close()
    if not any("溢出" in f for f in fails): print("PASS 版面（1024／1180／768／390 闊度）")
    b.close()

check("冇 JavaScript error／原生對話框", not errs, str(errs[:3]))
print("\nALL PASS" if not fails else f"\nFAIL：{len(fails)} 項")
sys.exit(0 if not fails else 1)
