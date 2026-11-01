# 交接文件：BIGSISTER 學習遊戲室

最後更新：2026-11-01

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
- `bigsister` 已經轉做 public，Pages 由 `main` 根目錄出：大廳 `/bigsister/`、成語大冒險 `/bigsister/games/chengyu-adventure/`、Wild Quest `/bigsister/games/wild-quest/`。舊網址 `chengyu-adventure` repo 仍然有效（同網域，`localStorage` 進度共用）。
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

## 7. Joycelyn Biodiversity Island（Wild Quest，小六常識 Unit 1 Biodiversity）

個島用小朋友個名命名（Gavin 2026-11-01 要求）。程式入面仍然叫 Wild Quest，資料夾 `games/wild-quest`。

詳細玩法、內容來源同「待確認」睇 `games/wild-quest/README.md`。

### 7.1 同成語大冒險唔同嘅地方

- **原始碼係模組化**（`games/wild-quest/src/`，ES modules），因為有 3D 島（three.js）同 198 張圖。上線嘅 `games/wild-quest/index.html` 係 build 出嚟嘅單一檔案（約 2 MB），所有 JS、CSS、three.js、圖都 inline，冇網都玩得（Google Fonts 除外）。**唔好直接改 build 出嚟嗰個檔。**
- 常識科用英文授課，所以介面同題目係英文；圖鑑卡附中文名。
- 音樂同音效全部用 Web Audio 即時合成（`src/js/audio.js`），冇聲音檔。

### 7.2 架構

| 檔案 | 內容 |
|---|---|
| `src/js/data.js` | **全部學習內容**：`GROUPS`、`CREATURES`、`PLANTS`、`BIOMES`、每個小遊戲嘅資料表（`SORT_WAVES`、`LAB_*`、`DETECTIVE_CASES`、`FLOW_NODES`、`PLANT_*`、`AIRLIFT_*`、`SURVIVAL`、`HIDE_SCENES`、`PANIC_ROUNDS`、`FEEDERS`、`STATEMENTS`、`BLANKS`、`WHO_RIGHT`、`COVERAGE`） |
| `src/js/main.js` | `ZONES`（7 區、12 個 mode）、標題畫面、島嶼大廳、`launch()` 遊戲啟動、`finish()` 結算、`MODS` 靜態模組表 |
| `src/js/world.js` | three.js 低多邊形島、7 個區域標籤、動物 billboard、鏡頭飛行 |
| `src/js/games/*.js` | 每個小遊戲一個檔，`export default async function play(api)` |
| `src/js/games/faller.js` | 共用「跌落嚟分類」引擎（Sort Storm、Seed Sorter、Animal Airlift） |
| `src/js/guide.js` | Field Guide、Oops Book、For grown-ups 頁 |
| `src/js/items.js` | 商店貨品（`COSTUMES`、`PETS`、`DECOR`、`POWERUPS`）、`BOSS_PRIZES`、`ROAD`（Star Road 里程碑）。`only: 'boss' / 'road'` 即係買唔到 |
| `src/js/economy.js` | `openShop`、`openRoad`、`openGift`、`grant`（已擁有就退星）、`powerTray`（開波前揀道具）、`avatarEl` |
| `src/js/bosses.js` | `BOSSES`：6 隻區域大佬，每隻有 `gens`（題目產生器，回傳 `{key,prompt,options,correct,explain}`）同對白 |
| `src/js/games/bossfight.js` | 區域大佬戰（mode id `boss-<zone>`）；Fake-Bot 仍然係 `games/boss.js` |
| `src/js/store.js` | 進度：`localStorage` key `wildquest-bio-p6-v1`（星星、最高分、已解鎖卡、錯題；v2 加 `pouch`、`lifetime`、`owned`、`equip`、`decor`、`bosses`、`road`、`power`，`ensure()` 補預設值，舊玩家嘅星星會放入 pouch） |
| `src/js/art.js` | `art(id)`（Fluent 3D 貼紙圖）、`creatureArt(id)`、手繪 SVG（螳螂、竹節蟲、葉形海龍、鵜鶘、蜂鳥、鋸鰩、蕨、苔蘚、生石花、蕁麻、含羞草、紅樹……） |

小遊戲收到嘅 `api`：`body`／`frame`（HUD：`setHearts`、`setScore`、`setCombo`、`setProgress`）、`intro()`、`ask()`、`toast()`、`wait()`、`loop()`、`learn(id)`（解鎖圖鑑卡）、`miss({key,q,you,ans,why})`（入錯題簿）、`finish({score,correct,total,stars?,won,headline?})`、`sfx`、`music()`、`fever()`。

v2 加咗：`hearts(n)`（開局心數，已計 Extra heart）、`loseHeart(cur)`（Lucky shield 擋第一次、剩 1 心開 danger 音樂）、`slow`（Slow-mo 時係 1.25，計時乘佢）、`intensity(n)`（音樂加鼓加快）。小遊戲 export `HEARTS`／`TIMED` 決定介紹畫面顯示邊啲道具。

音樂 API（`audio.js`）：`playMusic(name)` 會 crossfade；歌：`island`、`garden`、`jungle`、`arcade`、`lab`、`shop`、`boss`（Fake-Bot）、`miniboss`（區域大佬）、`victory`；`setDanger(on)`、`setIntensity(n)`、`setFever(on)`。

### 7.3 加內容

- 加動物：`CREATURES` 加一項（`art` 用 `src/art/` 入面嘅檔名，或者 `svg:名`；`fx` 可以用 CSS filter 變色）。之後喺對應遊戲資料表引用佢個 id。
- 加 Fact/Fake 句子：`STATEMENTS`，錯嗰個字用 `[ ]` 包住，`fix` 係正確字，`alts` 係兩個錯嘅改法。
- 加填充：`BLANKS`，句子用 `___` 做空格，`a` 答案，`d` 三個干擾字。
- 加新圖：將 Fluent Emoji 3D PNG 轉 256px webp 放入 `src/art/`。
- 加商店貨品：`items.js` 對應陣列加一項（`art` 係 `src/art/` 檔名；服裝 id 本身就係圖名）；島上裝飾要喺 `world.js` 嘅 `DECOR_SPOT` 加位置。
- 加大佬題目：`bosses.js` 嗰隻大佬嘅 `gens` 加一個 function；smoke test 會自動每款生成 40 次檢查答案喺選項入面。

### 7.4 Build、測試、上線

```bash
node tools/build_wild_quest.mjs          # 生成 games/wild-quest/index.html（第一次會用 npx 下載 esbuild）
python tools/smoke_wild_quest.py         # 資料檢查 + 大佬題目 + 12 個小遊戲 + 6 場大佬戰 + Sort Storm 打通 + 大佬／商店／Star Road + 4 個闊度冇橫向 scroll
```

開發時用 local server 開 `src/index.html`（ES modules 唔可以用 file:// 開）；網址加 `?no3d=1` 可以跳過 3D 島（測試用）。

上線位：
- 主網址：https://gavinck.github.io/bigsister/games/wild-quest/（push 去 `main` 就自動更新）。
- 後備：Claude Artifact https://claude.ai/artifact/CQC1SWHwt51jtckznCKQf6（private；Gavin 喺 Share menu 分享先開到）。更新方法：將 build 出嚟嘅 HTML 去掉 `<!DOCTYPE>`／`<html>`／`<head>`／`<body>` 外殼再 publish 去同一條 URL。
