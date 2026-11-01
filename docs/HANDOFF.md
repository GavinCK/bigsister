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
| `GavinCK/bigsister`（呢個 repo，private） | 原始碼主檔 | 正常 commit／push |
| `GavinCK/chengyu-adventure`（public）→ https://gavinck.github.io/chengyu-adventure/ | 小朋友實際用緊嘅網址 | 將 `games/chengyu-adventure/index.html` 複製去嗰個 repo 嘅 `index.html`，commit＋push，大約 1 分鐘後生效 |
| Claude Artifact 連結 | 後備 | 由 Claude 重新 publish |

注意：
- GitHub Pages 喺 private repo 要付費 plan，所以暫時用 public 嘅 `chengyu-adventure` repo 上線。
- 同一個網域（`gavinck.github.io`）下面嘅遊戲共用 `localStorage`；唔同遊戲一定要用唔同 key。
- iPad 唔可以喺「檔案」App 開 HTML，一定要經網址用 Safari 開，再「加入主畫面」。

---

## 6. 設計守則

- 每個學習重點配一種唔同嘅玩法，唔好全部都係選擇題。
- 答錯唔懲罰：同一題會稍後再出，並即時解釋點解。
- 錯題全部入錯題簿（成績表），考試前可以專攻。
- iPad 優先：按鈕夠大、`touch-action: manipulation`、唔用原生 `confirm()`（改用 `askConfirm()`）。
- 尊重 `prefers-reduced-motion`。
