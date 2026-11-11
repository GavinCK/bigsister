# BIGSISTER 學習遊戲室

家姐三個小朋友嘅學習小遊戲。每個遊戲都係一個獨立 HTML，唔使安裝、唔使上網都玩得。

## 點樣開

| 用咩裝置 | 做法 |
|---|---|
| Windows／Mac 電腦 | 雙擊根目錄嘅 `index.html`（遊戲大廳），或者直接開 `games/<遊戲>/index.html` |
| iPad／iPhone | 唔可以喺「檔案」App 直接開 HTML。要用網址開：放上 GitHub Pages、Netlify 或者自己嘅 server，再用 Safari「加入主畫面」 |

## 遊戲一覽

| 遊戲 | 資料夾 | 對象 | 內容 | 狀態 |
|---|---|---|---|---|
| 🐼 成語大冒險 | [`games/chengyu-adventure`](games/chengyu-adventure/) | 小六 | 成語、詞語、量詞、擬聲詞、複句、關聯詞、同音形近字、修辭 | 使用中 |
| 🏝️ Joycelyn's Islands（學習群島） | [`games/joycelyn-world`](games/joycelyn-world/) | 小六 | 一個網頁三個島：Biodiversity Island（常識 Unit 1，英文）、Maths Island（升中面試心算，全英文，一頁卷一個區）、成語島（開成語大冒險）；星星、商店、錯題簿共用 | 新 |

上線網址（呢個 repo 嘅 GitHub Pages）：
- 遊戲大廳：https://gavinck.github.io/bigsister/
- 成語大冒險：https://gavinck.github.io/bigsister/games/chengyu-adventure/（舊網址 https://gavinck.github.io/chengyu-adventure/ 仍然有效）
- Joycelyn's Islands：https://gavinck.github.io/bigsister/games/joycelyn-world/（`?island=maths`／`science`／`chinese` 直接去某個島；舊 Wild Quest 網址 `games/wild-quest/` 會自動轉過嚟）

## 結構

```
bigsister/
├── index.html                  遊戲大廳（列出所有遊戲）
├── games/
│   ├── chengyu-adventure/
│   │   ├── index.html          成語大冒險（單一檔案）
│   │   └── README.md           範圍、玩法、更新紀錄
│   ├── joycelyn-world/
│   │   ├── index.html          Joycelyn's Islands（build 出嚟嘅單一檔案）
│   │   ├── src/                原始碼（core／world／islands，改呢度再 build）
│   │   └── README.md           群島架構、每個島嘅內容、點樣加新島
│   └── wild-quest/
│       └── index.html          舊網址：轉去 joycelyn-world 嘅 Biodiversity Island
├── docs/
│   └── HANDOFF.md              交接文件：架構、資料格式、點樣加內容、部署
├── tools/
│   ├── smoke_test.py           成語大冒險自動打通測試（Playwright）
│   ├── build_world.mjs         將 joycelyn-world/src build 成單一 HTML
│   ├── smoke_world.py          群島自動測試（三個島＋共用獎勵＋3D，Playwright）
│   └── maths_pages_doc.mjs     生成 Maths Island 8 頁 × 12 題對照表（docs/maths-pages.md）
└── CLAUDE.md                   俾之後接手嘅 AI 睇嘅工作守則
```

## 加新遊戲

1. 喺 `games/` 開一個新資料夾（英文小楷、用 `-` 分隔），主檔叫 `index.html`。
2. 喺資料夾放一份 `README.md`：對象、內容來源、玩法、更新紀錄。
3. 喺根目錄 `index.html` 加一張遊戲卡，同埋更新上面「遊戲一覽」表。
4. 跑 `tools/smoke_test.py`（或者新遊戲自己嘅測試），冇錯先 commit。

詳細做法睇 [`docs/HANDOFF.md`](docs/HANDOFF.md)。
