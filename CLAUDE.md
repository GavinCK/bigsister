# CLAUDE.md：BIGSISTER 學習遊戲室

俾之後接手嘅 AI 用嘅工作守則。開工前先讀 `README.md` 同 `docs/HANDOFF.md`。

## 專案

- 家姐三個小朋友嘅學習小遊戲，一個遊戲一個資料夾：`games/<name>/index.html`。
- 主要裝置係 iPad（Safari、加入主畫面），一定要支援觸控同細 mon。
- Gavin 用繁體中文（粵語口語）溝通，technical terms 用英文。

## 內容守則

- 題目只用 Gavin 提供嘅功課紙、工作紙、課本內容；唔好加範圍以外嘅答案。
- 介面文字用粵語口語，題目同例句用書面語，全部繁體中文（香港用字）。
- 睇唔清或者有矛盾嘅工作紙內容，唔好估，記入該遊戲 README 嘅「待確認」，再話俾 Gavin 知。

## 技術守則

- 每個遊戲係單一 HTML，CSS／JS／資料全部 inline；外部資源只限 Google Fonts，冇網都要玩得。
- 唔好用 `alert`／`confirm`／`prompt`，用頁內 modal。
- `localStorage` key 每個遊戲唔同，而且唔好改舊 key（會清走小朋友進度）；要加欄位就喺 `ensure()` 補預設值。
- 成語大冒險嘅模組：第一章（global）、`C2`（第二章）、`DLC`（修辭樂園）；按鈕用 `data-go`／`data-c2`／`data-rh` 分派。
- 主角係 Q 版熊貓「圈圈」（`catSVG()`）。
- 例外：Joycelyn's Islands（`games/joycelyn-world`，即係舊 Wild Quest＋數學島＋成語島）原始碼係模組化，放喺 `src/`（`core/` 共用、`world/` 3D 群島、`islands/<科>/` 每個島一個 pack）；改完要 `node tools/build_world.mjs` 生成單一 HTML，再跑 `python tools/smoke_world.py`。唔好直接改 build 出嚟嘅 `index.html`。
  - 常識島同數學島用英文（英文授課）；**數學島全部英文**，包括介面、提示、鼓勵說話同家長頁數學嗰節（Gavin 指定）。成語島用中文。
  - 進度 key 仍然係 `wildquest-bio-p6-v1`，唔好改；每個島嘅資料放 `store.pack(id)`；mode id 全局唯一（數學 `m-`／`mz-`／`miv-`，中文 `cn-`），改 id 會清走星星。
  - 數學答案用 `R()` 分數精確計，唔好用 float；新題目產生器要過 smoke test 嘅 200 次檢查。
  - 成語島用 iframe 開成語大冒險再 call `window.go()`，星星讀 `chengyuAdventure_v1`；改成語大冒險時唔好整爛呢兩樣。
  - 舊網址 `games/wild-quest/index.html` 係轉址頁，要保留（iPad 主畫面 icon 用緊）。

## 每次改完

1. `python tools/smoke_test.py`（成語大冒險）同 `python tools/smoke_world.py`（群島）：全部 PASS 先 commit。
2. 更新遊戲資料夾 `README.md` 嘅更新紀錄。
3. 要上線就同步去 `GavinCK/chengyu-adventure` 嘅 `index.html`（詳見 `docs/HANDOFF.md` 第 5 節）。
