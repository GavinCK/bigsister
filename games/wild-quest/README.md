# 🐸 Joycelyn Biodiversity Island（Wild Quest，小六常識）

小六 GS（Science）Unit 1 Biodiversity 嘅溫習遊戲。一個 3D 生態島，7 個區域、12 個小遊戲，先有好玩嘅玩法，知識藏喺入面：要贏就要識。

- **對象**：小六（英文好，常識用英文上堂，所以題目同介面都係英文；圖鑑卡附中文名）
- **主要裝置**：iPad 橫向（Safari），電腦都得
- **localStorage key**：`wildquest-bio-p6-v1`（唔好改）

## 內容來源

Gavin 提供嘅常識科 PDF（36 頁）：
- 課本 Unit 1：Ch.1 Classification of Living Things（p.3–9）、Ch.2 Plants and Environment（p.10–15）、Ch.3 Animals and Environment（p.16–24）
- Workbook p.2–9（Matching、Classifying、Short questions、Data analysis、Drawing、Fill in the blanks、Completing the table、Judging、Analysis、Multiple choice、Long questions）
- Task 1 classification flowchart、Supplementary Notes 1–5

## 7 個區域 / 12 個小遊戲

| 區域 | 小遊戲 | 玩法 | 內容 | 對應題型 |
|---|---|---|---|---|
| Ark Beach | Sort Storm | 動物由暴風雨跌落嚟，撳啱方舟門；連擊 6 次入 FEVER；最後 X-ray 掃描「有冇脊骨」 | 六大類動物、易錯例子（蝙蝠、海豚、企鵝、海龜、蠑螈、鱷魚……）、特徵卡 | Matching、Classifying |
| Lab Tower | Build-a-Beast | 科學怪人機器：轉 5 條轉輪（皮膚、呼吸、BB、身體、體溫）再拉 lever；錯就變「變種怪獸」 | 各類動物特徵、warm/cold-blooded | Completing the table |
| | Flowchart Detective | 睇 3 條線索，沿住 Task 1 flowchart 答 YES/NO，行到正確字母先揭曉 | Task 1 flowchart（A–F） | Flowchart、Data analysis |
| Greenhouse | Seed Sorter | 植物跌落嚟：開花／不開花、陸生／水生 | 植物分類 | Matching |
| | Plant Survivor | 揀根、莖、葉，即時畫出植物，再捱 3 日天氣考驗 | 根、莖、葉點樣適應沙漠、雨林、濕地 | Picture scenario、Fill in blanks |
| | Garden Guard | 草食動物行埋嚟，揀嗰棵植物自己嘅防衛方法 | 夾竹桃、生石花、蕁麻、含羞草 | Picture scenario |
| Biome Peaks | Animal Airlift | 熱氣球掉落動物同天氣箱，撳啱棲息地 | 四種環境嘅氣候、水、食物、動物種類 | Matching |
| | Survival Suit | 暴風雪／熱浪倒數，揀啱身體特徵救動物 | 北極熊、企鵝、北極兔、沙漠棉尾兔、駱駝、蝸牛、陸龜、蛇 | Multiple choice、Long questions |
| Hide & Seek | Hide & Seek | 喺場景搵保護色／擬態動物，再答佢點樣匿埋 | Protective colouration vs mimicry | Picture analysis |
| | Predator Panic | 掠食者衝埋嚟，揀啱自保方法 | 四種自保方法 | Picture analysis |
| Savanna Diner | Feeding Frenzy | 輸送帶送菜，撳啱「身體構造啱食」嘅動物 | 喙、頸、牙、爪、前足 | Circle the answer |
| Fake-Bot Volcano | Fake-Bot Showdown | 大佬戰：Fact or Fake＋點出錯字再改正、Word Blaster 填充、Who's right? | 全單元溫習 | Judging（改錯）、Fill in blanks、Data analysis |

其他：Field Guide（87 張收集卡，答啱先解鎖）、Oops Book（每條錯題連正確答案同原因）、For grown-ups 頁（題型對照表）。

## 檔案結構

```
games/wild-quest/
├── index.html        ← build 出嚟嘅單一檔案（唔好直接改）
├── README.md
└── src/              ← 原始碼（改呢度）
    ├── index.html    開發版入口（要用 local server 開）
    ├── css/game.css
    ├── js/data.js    ← 全部學習內容（動物、植物、句子、填充、flowchart……）
    ├── js/main.js    島嶼大廳、遊戲啟動、結算
    ├── js/world.js   3D 島（three.js）
    ├── js/audio.js   Web Audio 即時合成音樂同音效
    ├── js/games/*.js 12 個小遊戲
    ├── art/*.webp    Microsoft Fluent Emoji 3D（MIT）
    └── lib/          three.js r170（MIT）
```

## 點樣改

1. 改 `src/`（內容只需要改 `src/js/data.js`）。
2. 開發時：`cd games/wild-quest/src && python -m http.server 8000`，開 http://localhost:8000（加 `?no3d=1` 可以跳過 3D 島）。
3. Build：`node tools/build_wild_quest.mjs` → 生成 `games/wild-quest/index.html`（約 2 MB，所有圖、three.js 都 inline，只有 Google Fonts 要網）。
4. 測試：`python tools/smoke_wild_quest.py`，ALL PASS 先 commit。

## 待確認

1. **介面語言**：repo 守則寫「介面用粵語口語」，但呢個係英文授課嘅常識科，課本同 workbook 全部英文，所以遊戲介面同題目用英文，圖鑑卡附中文名。如果想轉中文介面，話一聲。
2. **課本以外嘅例子**：為咗玩法多樣，加咗少量課本冇直接出現嘅動物做分類／例子（例如 skunk 做 warning 例子、scorpion／spider 做「冇脊骨但唔係昆蟲」、kangaroo、goat、cow、owl、flamingo 等常見動物）。答案原則全部跟課本同 notes。
3. **Build-a-Beast 昆蟲身體覆蓋**：用咗「Hard outer body case」做昆蟲選項（課本冇明講，notes 表格寫「Some with hair」）。
4. **北極兔耳仔細**：課本只係將北極兔同沙漠棉尾兔比較；notes 只講北極兔毛厚而長。遊戲當「細耳朵」係啱答案。
5. **Ch.3 p.18 Q3（邊啲動物冬天深睡）**：課本有魚、松鼠、蛇三個選項，notes 只寫明蛇，所以遊戲淨係考蛇，冇考松鼠。
6. PDF 第 8 頁（課本 p.8）冇掃描到；Gavin 講嘅 4 張出卷模式圖冇收到，題型係按 PDF 入面 workbook 頁對應。

## 更新紀錄

- 2026-11-01：個島改名做 Joycelyn Biodiversity Island（標題畫面、沙灘木牌、歡迎訊息）。資料夾同網址仍然係 `wild-quest`。
- 2026-11-01：第一版。7 區 12 個小遊戲、Field Guide、Oops Book、家長頁；即時合成音樂同音效；單一 HTML build。
