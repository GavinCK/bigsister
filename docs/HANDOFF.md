# 交接文件：BIGSISTER 學習遊戲室

最後更新：2026-11-12

呢份文件寫俾之後接手嘅 AI 或者工程師。讀完應該知道遊戲點樣砌、資料放喺邊、點樣加新內容、點樣測試同上線。

---

## 1. 背景同使用者

- 對象：家姐三個小朋友。現時嘅遊戲係俾小六嗰位用：英文好、中文較弱。
- 主要裝置：iPad（Safari，加入主畫面），其次係電腦。
- 語言：介面用粵語口語，題目內容用書面語，全部繁體中文。英文提示預設開住，可以熄（「考試模式」）。
- 內容守則：**只用功課紙、工作紙、課本 PDF 上面嘅內容**。例句、解釋、干擾選項可以自己寫，但唔可以加範圍以外嘅成語或者詞語做答案。

---

## 2. 成語大冒險：整體架構

檔案：`games/chengyu-adventure/index.html`，大約 3,500 行，全部 CSS、資料、邏輯都喺同一個檔。

### 2.1 檔案入面嘅次序

| 位置（大約） | 內容 |
|---|---|
| `<head>` | iPad 主畫面 meta、`apple-touch-icon`（base64 PNG）、Google Fonts「LXGW WenKai TC」楷書 |
| `<style>` 開頭 | 設計 token（`--ink`、`--sun`……）、共用元件、第一章樣式 |
| `/* ===== 第二章 ===== */` | 第二章 CSS |
| `/* ===== DLC：修辭樂園 ===== */` | DLC CSS |
| `<body>` | top bar＋nav、各 `<section class="screen" id="scr-xxx">`、modal、toast |
| `<script>` 第一段 | 第一章資料：`IDIOMS`、`VOCAB`、`TYPO_RAW` |
| Helpers／State／Sound | `$`、`shuffle`、`esc`、`S`（state）、`SFX`、`speak()` |
| Characters | `pandaFace()`、`pandaEyes()`、`catSVG()`（名係舊嘅，畫嘅係熊貓圈圈）、`bossSVG()`、`chestSVG()` |
| Worlds／Scopes | `WORLDS`（每隻怪獸）、`SCOPES`（範圍 A／B） |
| 各畫面 | `RENDER.home`、`RENDER.learn`、`RENDER.battle`、`RENDER.fill`、`RENDER.typo`、`RENDER.report` |
| 第二章資料 | `ONO`、`SOUND_STORY`、`SOUND_Q`、`SHOP_*`、`CTYPES`、`LETTERS`、`PAIRS`、`BR1`、`BR2`、`BUILD`、`MOLE`、`PLAN` |
| `const C2 = (function(){…})()` | 第二章邏輯（自成一個 closure） |
| DLC 資料 | `RH`、`RH_ORDER`、`RH_MAGIC`、`RH_BELT`、`RH_IDIOM`、`RH_SPRING`、`RH_PORTAL`、`RH_ECHO`、`RH_Q`、`RH_MIRROR`、`RH_TOWER`、`RH_ZAP`、`RH_SEE`、`RH_TRAIN`、`RH_RUSH` |
| `const DLC = (function(){…})()` | DLC 邏輯 |
| `/* init */` | 畫 logo、首頁公仔，`go("home")` |

### 2.2 畫面同導航

- 每個畫面係 `<section class="screen" id="scr-NAME">`，由 `go(NAME)` 切換，再 call `RENDER[NAME]()` 重畫。
- 畫面名：`home`、`learn`、`battle`、`fill`、`typo`、`ch2`、`dlc`、`report`。
- 第二章同 DLC 會 wrap `RENDER.home` 同 `RENDER.report`，將自己嘅入口卡同成績插入去。

### 2.3 事件處理（event delegation）

全部用 `document` 層 click listener，靠 `data-*` attribute 分派：

| attribute | 由邊個處理 | 用途 |
|---|---|---|
| `data-go` | 主 handler | 切換畫面 |
| `data-start` | 主 handler | 開始擂台關卡 |
| `data-say` | 主 handler | 讀出文字（`speak()`） |
| `data-close` | 主 handler | 關 modal |
| `data-c2` + `data-a` | `C2` 嘅 `ACT` 表 | 第二章所有動作 |
| `data-rh` + `data-a` | `DLC` 嘅 `ACT` 表 | DLC 所有動作 |

加新按鈕：喺對應模組嘅 `ACT` 表加一個 function，按鈕寫 `data-rh="名" data-a="參數"` 就得。

### 2.4 State（進度儲存）

- `localStorage` key：`chengyuAdventure_v1`，每次改完 call `save()`。
- 進度只存喺嗰部機嘅瀏覽器（同一個網域共用），唔會同步去其他機。
- 結構：

```js
S = {
  v: 1, name: "", sound: true, en: true,
  scope: "A",                 // "A" 功課紙範圍、"B" 五上 Term 1
  battle: { "1": {stars, acc}, "P1": {...}, ... },   // 擂台：key = WORLDS id
  fill:   { "<VOCAB index>": {st:"ok"|"try"|"shown", v} },
  typo:   { "<TYPO id>": "p"|"s"|"shown" },          // p 完美、s 有錯先破
  mistakes: { "i<IDIOMS index>" | "v<VOCAB index>": 次數 },
  c2:  { intro, st:{stageKey:stars}, m:{label:{n,t}}, plan:{dayIndex:true}, slow },
  dlc: { intro, st:{rideKey:stars}, m:{label:{n,t}}, best }
}
```

- `S.c2`、`S.dlc` 由各自嘅 `ensure()` 補齊預設值，所以舊進度唔會壞。
- **唔好改 `KEY` 或者 `v`**，否則小朋友舊進度會冇晒。要改結構就喺 `ensure()` 補欄位。

### 2.5 聲音

- `SFX`：Web Audio 合成音效（答啱、答錯、開寶箱等），唔使任何音效檔。
- `C2.SYN`：擬聲詞合成聲效（雷聲、雨聲、雞啼……）；`C2.snd("轟隆")` 播放。
- `speak(text)`：用瀏覽器 `speechSynthesis`，優先揀 `zh-HK`／粵語聲。iPad 要喺「輔助使用 → 朗讀內容 → 聲音」下載粵語語音。

---

## 3. 點樣加內容

### 3.1 第一章：加一個新範圍（例如五下）

1. **成語**：喺 `IDIOMS` 尾加資料，每個要有 `sc`（範圍代號，例如 `"C"`）、`l`（世界代號，例如 `"Q1"`）、`w`、`e`（emoji）、`m`（意思）、`z`（字解，可留空）、`en`、`s`（兩句例句，用 `{}` 標示成語位置）。有「大白話」就加 `plain`。
2. **詞語**：喺 `VOCAB` 尾加，要有 `sc`、`g`（組別代號）、`w`、`m`、`en`、`s`（一句，用 `{}`）、`near`（意思相近但唔係答案嘅詞，答中會提示「意思差唔多」）、`alt`（其他接受嘅寫法，可選）。
3. **錯別字**：喺 `TYPO_RAW` 尾加 `[正確詞, 錯誤寫法, 兩個干擾字, 解釋]`。錯字要喺例句入面出現（系統用 `IDIOMS.s[1]` 或者 `VOCAB.s` 做句子）。
4. **怪獸**：喺 `WORLDS` 加 4 個世界＋1 個 `final:true` 嘅大魔王，每個要有 `sc`、`boss`（`bossSVG` 入面嘅類型）、`bname`、`note`、`tip`、`lines`。
5. **範圍設定**：喺 `SCOPES` 加 `C: { icon, short, name, c, desc, worlds:[...], groups:[...], vtab, vgroups:[[組別代號, 標題, 短名]] }`，首頁同右上角範圍掣會自動多一個選項（`switchScope` 而家係 A／B 互換，三個範圍要改做輪住轉）。

### 3.2 第二章、DLC

- 內容全部係資料表，改資料就得，唔使改邏輯。例如加擬聲詞：`ONO` 加一個詞（`snd` 指向 `C2.SYN` 入面嘅聲效名）。
- DLC 加一部機動遊戲：喺 `RIDES` 加設定、喺 `ZONES` 放入區、`RIDE_UNLOCK` 寫明解鎖邊隻精靈、`PLAY` 加開始 function，再喺 `ACT` 加按鈕動作。

### 3.3 改主角

- `catSVG(opt)` 畫圈圈（`opt.det` = 偵探帽＋放大鏡，`opt.cls` = `"happy"`／`"hurt"`／`"bob"`）。
- 表情靠 class 切換：`.e-n`（平時）／`.e-y`（開心）／`.e-h`（受傷），口 `.m-n`／`.m-y`／`.m-h`。
- 改完記得重新生成 `apple-touch-icon`（180×180 PNG，base64 放喺 `<head>`）。

---

## 4. 測試

```bash
pip install playwright        # 已有就唔使
python tools/smoke_test.py    # 預設測 games/chengyu-adventure/index.html
python tools/smoke_test.py --shots out/   # 順便影 screenshot
```

測試會：
1. 檢查資料：例句一定有 `{}`、錯別字句子對得上、頂真火車頭尾相同、修辭過山車干擾選項唔會同答案撞。
2. 兩個範圍各打通一關擂台＋大魔王，填晒所有詞語，破晒所有錯字案件。
3. 第二章 14 關、DLC 11 部機動遊戲＋過山車全部自動玩一次。
4. 喺 1024、1180、768、390 闊度檢查 top bar 同頁面冇橫向 scroll。
5. 有任何 JavaScript error 或者原生 `alert`／`confirm` 就算失敗。

**改完一定要跑，全部 PASS 先 commit。**

---

## 5. 上線

而家有三個位：

| 位置 | 用途 | 點樣更新 |
|---|---|---|
| `GavinCK/bigsister`（呢個 repo，2026-11-01 起 **public**）→ https://gavinck.github.io/bigsister/ | 原始碼主檔＋遊戲大廳＋所有遊戲 | 正常 commit／push 去 `main`，GitHub Pages（main / root）大約 1 分鐘後生效 |
| `GavinCK/chengyu-adventure`（public）→ https://gavinck.github.io/chengyu-adventure/ | 小朋友實際用緊嘅網址 | 將 `games/chengyu-adventure/index.html` 複製去嗰個 repo 嘅 `index.html`，commit＋push，大約 1 分鐘後生效 |
| Claude Artifact 連結 | 後備 | 由 Claude 重新 publish |

注意：
- `bigsister` 已經轉做 public，Pages 由 `main` 根目錄出：大廳 `/bigsister/`、成語大冒險 `/bigsister/games/chengyu-adventure/`、Joycelyn's Islands `/bigsister/games/joycelyn-world/`（舊 Wild Quest 網址會轉過去）。舊網址 `chengyu-adventure` repo 仍然有效（同網域，`localStorage` 進度共用）。
- 因為 repo 係 public：小朋友只用名（例如 Joycelyn），唔好 commit 姓氏、學校名或者原本嘅工作紙 PDF。
- 同一個網域（`gavinck.github.io`）下面嘅遊戲共用 `localStorage`；唔同遊戲一定要用唔同 key。
- iPad 唔可以喺「檔案」App 開 HTML，一定要經網址用 Safari 開，再「加入主畫面」。

---

## 6. 設計守則

- 每個學習重點配一種唔同嘅玩法，唔好全部都係選擇題。
- 答錯唔懲罰：同一題會稍後再出，並即時解釋點解。
- 錯題全部入錯題簿（成績表），考試前可以專攻。
- iPad 優先：按鈕夠大、`touch-action: manipulation`、唔用原生 `confirm()`（改用 `askConfirm()`）。
- 尊重 `prefers-reduced-motion`。

---

## 7. Joycelyn's Islands（學習群島，小六：常識＋數學＋中文）

2026-11-11 Gavin 要求將 Wild Quest、數學工作坊同成語大冒險合併成一個網頁，並且重新設計架構方便日後加島。資料夾 `games/joycelyn-world`（舊 `games/wild-quest` 只剩一個轉址頁）。

詳細玩法、每個島嘅內容來源同「待確認」睇 `games/joycelyn-world/README.md`（科學島詳細：`games/joycelyn-world/docs/science-island.md`）。

背景：Joycelyn 準備升中，數學係**面試即場口問心算**（Gavin 提供嘅 8 張「Mental Practice P6」：P1–5 最重要，P6–8 深啲遲啲先練）。2026-11-12 Gavin 試玩後要求數學島**一頁卷一個區**、題目**精確跟返卷嘅難度**（第一版按題種分、加咗卷以外嘅變化，好多題超出心算），所以而家每區 12 題逐題對應原卷嗰題。學校英文授課，所以**數學島全部英文**（Gavin 指定，連鼓勵說話同家長頁數學嗰節都係英文）。常識亦係英文；中文島保持中文。

### 7.1 重點

- **原始碼係模組化**（`src/`，ES modules），build 出嚟嘅 `index.html` 係單一檔案（約 2.8 MB；JS、CSS、three.js、248 張圖全部 inline）。**唔好直接改 build 出嚟嗰個檔。**
- 一片海、每科一個島（pack）。Shell 同共用獎勵唔理島入面係咩。
- 進度仍然用 Wild Quest 嘅 key `wildquest-bio-p6-v1`（**唔好改**），新欄位：`name`、`days`（streak）、`packs`（每個島自己嘅資料，用 `store.pack(id)` 攞）。舊玩家打開會自動保留晒星星、卡、商店貨品。
- 音樂同音效全部用 Web Audio 即時合成（`core/audio.js`），冇聲音檔。

### 7.2 架構

| 位置 | 內容 |
|---|---|
| `src/js/main.js` | Shell：標題、海圖（全部島）、島嶼 HUD（zone chips、上面一排按鈕）、zone card、`launch()`。`PACKS = [science, maths, chinese]` |
| `src/js/world/engine.js` | three.js 群島引擎：`createWorld(canvas)` → `addIsland(def)`、`addZone`、`setDecor`、`setAvatar`、`setBoss`、`showMap()`、`overview(id)`、`focus(id, zone)`。每個島係一個 `THREE.Group`（本地座標），用 `kit`（`terrain`、`palm`、`rock`、`critter`、`sign`、`clouds`……）砌 |
| `src/js/core/store.js` | 進度（見上）＋ `pack()`、`markDay()`、`streak()`、`mistakesFor(pack)` |
| `src/js/core/runner.js` | 遊戲框同 `api`：原本 Wild Quest 小遊戲嘅全部 api，加 `complete()`（只記錄＋出星，俾有自己結果畫面嘅島用，例如數學；mode 有 `reward` 而 `won` 為真就出獎品）、`exit()`、`relaunch()`、`switchTo(modeId, opts)`（轉去同島另一個 mode）、`openGift()`、`openRoad()`、`pack`、`opts` |
| `src/js/core/economy.js`、`items.js` | Star Shop、Star Road、禮物、道具；`BOSS_PRIZES`（所有島嘅大佬獎品）；裝飾有 `island` 欄 |
| `src/js/core/books.js` | 多島 Oops Book（分頁、HTML 錯題、每個島可以加 header／action）、家長頁（每個島一節） |
| `src/js/core/art.js` | `art(id)`、`registerCreatures()`（島自己登記卡片資料） |
| `src/js/islands/science/` | 原本 Wild Quest 全部內容（`data.js`、`bosses.js`、`games/*.js`、Field Guide）；`island.js` 係原本嘅 3D 島 |
| `src/js/islands/maths/` | `papers.js`（**8 頁 × 12 題**：每題一個產生器，跟原卷嗰題嘅結構同數字大細）、`mathlib.js`（`R` 有理數運算、`checkAnswer` 改卷、語音解析、角／鐘圖）、`engine.js`（所有數學畫面：頁面／Practice paper／Drill／Interview／Fix，用 Shadow DOM 隔離 CSS）、`data.js`（`store.pack('maths')`：每頁 `pages[n]`、每題 `gens[id]`、`interviews`）、`pack.js`（8 個區、家長頁）、`island.js`（8 個地標＋面試廳） |
| `src/js/islands/chinese/` | `pack.js`：iframe 開 `../chengyu-adventure/index.html` 再 call `go()`；星星橋讀 `chengyuAdventure_v1`（只讀），新星入星星袋 |

Pack 介面、mode id 規則同「加一個新島」步驟寫晒喺 `games/joycelyn-world/README.md`「架構」一節。重點：

- Mode id 全局唯一：科學用原本 id；數學 `mp-<頁>`（Practice paper）、`mi-<頁>`（Interview）、`m-drill`、`m-fix`（隱藏）；中文 `cn-*`。改咗 id 會清走嗰項星星。（第一版數學嘅 `m-<topic>`／`mz-*`／`miv-*` 已經停用。）
- 大佬獎品 key：科學係 zone id，數學係 `m-p<頁>`（`mi-<頁>` mode 嘅 `reward`，第一次 Interview 10/12 以上就出）。
- 成語大冒險改嘢時，唔好整爛 `window.go(screen)` 同 `chengyuAdventure_v1` 嘅 `battle`／`c2.st`／`dlc.st`，因為成語島靠佢哋。

### 7.3 加內容

- 科學：同以前一樣，`islands/science/data.js`、`bosses.js`（玩法同內容來源見 `games/joycelyn-world/docs/science-island.md`）。島上裝飾位置喺 `islands/science/island.js`。
- 數學：每頁嘅 12 題喺 `papers.js` 嘅 `page(n, …, [12 個 slot])`。每個 slot 係 `{lab, skill, tip, f()}`，`f()` 回傳 `{html, ans, hints:[2], steps}`（`ans` 用 `R()` 分數；`kind` 可以係 `choice`／`order`／`time`）。**改題目要守住原卷嗰題嘅難度**：同一個題型、同一種步數、同樣大細嘅數字，答案心算得到。smoke test 每個 slot 生成 200 次檢查答案；改完再跑 `node tools/maths_pages_doc.mjs games/joycelyn-world/docs/maths-pages.md` 更新對照表。加新一頁卷：加一個 `page()`，再喺 `data.js` 嘅 `PAGE_ART`、`core/items.js` 嘅 `BOSS_PRIZES`（`m-p<頁>`）同 `island.js` 嘅 `MPOS` 加位置。
- 新科／新島：照 README 步驟開 `islands/<id>/`。

### 7.4 Build、測試、上線

```bash
node tools/build_world.mjs            # 生成 games/joycelyn-world/index.html（第一次會用 npx 下載 esbuild）
python tools/smoke_world.py           # 自己開 local server；三個島全部流程＋舊進度＋舊網址＋3D＋4 個闊度
```

開發時喺 repo 根目錄開 local server，開 `games/joycelyn-world/src/index.html`（ES modules 唔可以用 file://；成語島嘅 iframe 都要同源）。`?no3d=1` 跳過 3D，`?island=maths` 直接入島。

上線位：
- 主網址：https://gavinck.github.io/bigsister/games/joycelyn-world/（push 去 `main` 就自動更新）。
- 舊網址 https://gavinck.github.io/bigsister/games/wild-quest/ 轉去 `?island=science`，主畫面 icon 照用得。
- 舊 Claude Artifact（https://claude.ai/artifact/CQC1SWHwt51jtckznCKQf6）仍然係 Wild Quest 舊版，冇更新。
