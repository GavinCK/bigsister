# 🏝️ Joycelyn's Islands（學習群島）

丫妹（Joycelyn，小六）一個網頁就溫晒所有科：一片海、每科一個島，星星同獎勵全部共用。

| 島 | 科目 | 語言 | 內容 |
|---|---|---|---|
| 🐸 **Biodiversity Island** | 常識 P6 Unit 1 | 英文 | 原本嘅 Wild Quest：7 區、12 個小遊戲、6 隻區域大佬、Fake-Bot（詳細：[`docs/science-island.md`](docs/science-island.md)） |
| 🦉 **Maths Island** | 數學（升中面試心算） | **全英文** | 一頁卷一個區（8 區）：每區 12 題跟足嗰頁卷嘅題型同難度；Practice paper／Drill／Interview（詳細：[`docs/maths-pages.md`](docs/maths-pages.md)） |
| 🐼 **成語島 Idiom Island** | 中文 | 中文 | 直接喺頁內開返原本嘅「成語大冒險」（第一章、第二章、修辭樂園、成績表） |

- **網址**：https://gavinck.github.io/bigsister/games/joycelyn-world/（`?island=maths` 可以直接去某個島）
- **舊網址**：`games/wild-quest/` 會自動跳去呢度嘅 Biodiversity Island，iPad 主畫面 icon 照用得。
- **主要裝置**：iPad（Safari、加入主畫面），橫向直向都得（數學同中文直向都好用）。
- **進度**：localStorage key `wildquest-bio-p6-v1`（Wild Quest 原本嗰個，**唔好改**）；而家成個群島共用，新欄位由 `ensure()` 補。成語大冒險繼續用自己嘅 `chengyuAdventure_v1`（只讀）。

## 共用嘅獎勵

- **星星袋（pouch）**：每個島玩完都會入星（科學小遊戲、數學 Practice paper／Drill／Interview、成語大冒險新攞到嘅星）。
- **Star Shop**：服裝、寵物、裝飾（每件裝飾屬於一個島，例如 Rocket 喺 Maths Island、Lotus pond 喺成語島）、道具。
- **Star Road**：按「一共賺過幾多粒星」開禮物，所有島都計。
- **Oops Book**：所有島嘅錯題，有 All／Science／Maths／中文分頁；數學錯題有「Practise it」（同類型新數字）同「Fix my maths mistakes」。
- **每日 streak 🔥**、**For grown-ups 家長頁**（每個島一節）。
- **收集**：Biodiversity 有 Field Guide（89 張卡）；Maths 每頁第一次 Interview 有 10/12 或以上，就贏嗰頁嘅寵物（8 隻）。

## Maths Island（全英文）

升中面試係即場口問心算、口答都得，所以數學島全部英文：介面、題目、提示、鼓勵說話、家長頁嗰節都係英文。

**2026-11-12 重做（v2）**：第一版按「題種」分區，加咗唔少卷以外嘅變化，好多題深過心算。而家改成**一頁卷一個區**，每區嘅 12 題（Q1–Q8、9a、9b、10a、10b）逐題對應原卷嗰題：**同一個題型、同一種步數、同樣大細嘅數字**，每次換新數字，答案都係心算得到嘅「好數」。每頁每題嘅類型、方法提示同 3 條例子，睇 [`docs/maths-pages.md`](docs/maths-pages.md)（由 `node tools/maths_pages_doc.mjs games/joycelyn-world/docs/maths-pages.md` 生成）。

原卷有版權聲明而 repo 係 public，所以冇放 PDF；計數題全部用新數字，提示例子都冇用原卷嘅數字。概念題（例如 sector 定義、棱柱有幾多條棱、「買一送一」嘅折扣率）本身係標準知識，有時會出到同卷一樣嘅問法。

### 8 個區（一頁一個）

| 區 | 卷 | 程度 | 島上地標 | 10/12 贏 |
|---|---|---|---|---|
| Page 1 | Mental Practice | Core | 巨型算盤 | Octopus |
| Page 2 | Mental 1 · Oct 2023 | Core | 缺咗一件嘅批 | Flamingo |
| Page 3 | Mental 2 · Oct 2023 | Core | 立體圖形 | Kangaroo |
| Page 4 | Mental 3 · Nov 2023 | Core | 天秤 | Peacock |
| Page 5 | Mental 1 · Jan 2024 | Core | 鐘樓 | Ladybird |
| Page 6 | Mental 2 · Feb 2024 | Challenge | 大圓輪 | Otter |
| Page 7 | Mental 3 · Mar 2024 | Challenge | 減價攤 | Hedgehog |
| Page 8 | Mental 4 · Apr 2024 | Challenge | 雪山頂 | Baby T-rex |

Page 1–5 喺前面沙灘排成一條弧，Page 6–8 喺後面（Page 8 喺雪山頂），中間係 Interview Hall（裝飾）。

### 玩法

| 模式 | 題數 | 提示 | 草稿紙 | 對答案 | 獎勵（入星星袋） |
|---|---|---|---|---|---|
| 頁面 | — | — | — | — | 列出嗰頁 12 題嘅題型、每題準確率，每題有 **Drill** |
| Practice paper | 12（跟卷次序） | 💡 兩級提示 → 👣 解法 → 📘 Tip | 有 | 即時；錯 1 次再試，錯 2 次出解法，最尾補一條同類新題 | 第一次就啱 11–12 題 3★、8–10 題 2★、5–7 題 1★ |
| Drill | 5（同一題型） | 有 | 有 | 同 Practice | 5/5 3★、4 2★、3 1★ |
| Interview | 12（跟卷次序） | 冇 | **冇** | 做完先對；每題讀出嚟、倒數（預設 45 秒）、可 Pass | 11+ 3★、9+ 2★、6+ 1★；12/12 金、10+ 銀、8+ 銅；**第一次 10/12 以上：+5 星＋嗰頁寵物** |
| Fix my mistakes | 4–8 | 有 | 有 | 同 Practice | 第一次答啱，嗰類錯題由 Oops Book 刪走 |

- 口講模式：Interview 開始時揀「Say it out loud」，大人做面試官，撳 Show answer 再判 ✅／❌。
- 答題：屏幕數字鍵（a/b 分數格、a b/c 帶分數格）、Apple Pencil 直接寫入答案格（iPadOS 隨手寫）、iPad 鍵盤聽寫（設定揀 iPad keyboard）、瀏覽器支援就有 🎤。
- 改卷跟學校：分數要最簡、指定形式（decimal／fraction）、四捨五入保留尾 0（2.0）、排序符號、a.m./p.m.。
- 第一版留低嘅舊數學錯題（題種已經冇咗）會喺第一次開新版時自動清走；設定（每題秒數等）同星星袋保留。

## 成語島（成語大冒險）

- 冇改寫成語大冒險：撳島上嘅地方，就喺頁內（iframe）開 `../chengyu-adventure/index.html`，再 call 佢嘅 `go('ch2')`／`go('dlc')`／`go('report')` 跳去嗰章。上面有「返回成語島」。
- 星星橋：返回島上時讀 `chengyuAdventure_v1`（第一章擂台星 + 第二章星 + 修辭樂園星），**新增**嘅星星入共用星星袋（記住已經轉咗幾多，唔會重複俾）。第一次開群島會一次過轉入已有嘅星星。
- 成語大冒險亦仍然可以單獨用（大廳、舊網址 `GavinCK/chengyu-adventure`），進度同一份。

## 架構（擴充用）

```
games/joycelyn-world/
├── index.html                 ← build 出嚟嘅單一檔案（約 2.8 MB；唔好直接改）
├── README.md
├── docs/science-island.md     Biodiversity Island 玩法、內容來源、待確認（原 Wild Quest README）
├── docs/maths-pages.md        Maths Island 8 頁 × 12 題對照表（自動生成）
└── src/
    ├── index.html             開發版入口（要用 local server 開）
    ├── css/game.css           全部島共用嘅樣式（最尾一段係群島 shell）
    ├── art/*.webp             Microsoft Fluent Emoji 3D（MIT）
    ├── lib/                   three.js r170（MIT）
    └── js/
        ├── main.js            Shell：標題、海圖、島嶼 HUD、zone card、launch。PACKS = [science, maths, chinese]
        ├── world/engine.js    3D 群島引擎：海、每個島一個 THREE.Group、label、tap、鏡頭飛行、主角、大佬、裝飾
        ├── core/              全部島共用
        │   ├── store.js       進度（key 唔好改）＋ store.pack(id) 俾每個島放自己資料
        │   ├── runner.js      遊戲框＋api（finish＝標準結果卡；complete＝只記錄同出星）
        │   ├── economy.js     Star Shop、Star Road、禮物、道具
        │   ├── items.js       商品、大佬獎品（BOSS_PRIZES）、ISLAND_NAME
        │   ├── books.js       Oops Book（多島）、家長頁（每島一節）
        │   └── ui.js art.js audio.js fx.js
        └── islands/
            ├── science/       pack.js（zones、mods、Field Guide、家長節）、island.js（3D）、data.js、bosses.js、guide.js、games/*.js
            ├── maths/         papers.js（8 頁 × 12 題產生器）、mathlib.js（分數運算、改卷、語音、圖）、engine.js（所有數學畫面，Shadow DOM）、pack.js、data.js（進度、獎品）、island.js、style.js
            └── chinese/       pack.js（iframe＋星星橋）、island.js
```

### 一個島（pack）要提供咩

```js
export default {
  id: 'maths', title: 'Maths Island', short: 'Maths', subject: '…', art: 'owl', color: '#5BC8FF',
  at: { x: 84, z: -34 }, radius: 24, labelY: 22,      // 喺海入面嘅位置
  build: (kit) => ({ zones, avatar, bosses, decor, update }),   // 3D 島（本地座標）
  zones: [{ id, title, art, learn, modes: [{ id, title, art, desc, mod, … }], boss: { id, title, art, mod, isBoss: true, reward } }],
  mods: { maths: () => import('./engine.js') },       // 遊戲模組：export default async function play(api)
  // 可選：open(mode, shell)（唔經 runner，例如 iframe）、zoneStars/zoneMax/modeStars/modeExtra、books、parents、
  //       oopsHeader/oopsAction、refreshIsland(islandApi)、onBoot/onEnter、isCard、welcome、music
};
```

### 加一個新島（例如 Science Unit 2、英文、或者細佬妹嘅島）

1. 開 `src/js/islands/<id>/`，寫 `pack.js`（照上面格式）同 `island.js`（3D：`kit.terrain()`、`kit.critter()`、`kit.sign()`……，參考 maths／chinese）。
2. `main.js` import 佢，加入 `PACKS`。`at` 揀海入面一個空位（現有：science (0,0)、maths (84,−34)、chinese (−84,−34)；海圖會自動縮放包晒所有島）。
3. Mode id 要全局唯一（加前綴，例如 `u2-`）；島嘅資料放 `store.pack('<id>')`。
4. 大佬獎品加入 `core/items.js` 嘅 `BOSS_PRIZES`；裝飾加 `island: '<id>'`，再喺島嘅 `decor(id)` 放位置。
5. `node tools/build_world.mjs` → `python tools/smoke_world.py`，再喺測試加嗰個島嘅流程。

## Build、測試、上線

```bash
node tools/build_world.mjs                 # 生成 games/joycelyn-world/index.html
python tools/smoke_world.py                # 全群島自動測試（自己開 local server）
python tools/smoke_world.py --shots out/   # 順便影 screenshot
```

開發：喺 repo 根目錄 `python -m http.server 8000`，開 http://localhost:8000/games/joycelyn-world/src/index.html（`?no3d=1` 跳過 3D）。

測試內容：科學島原本全部測試（12 個小遊戲、6 隻大佬、Kraken Kaptain、商店、Star Road）；數學 8 頁 × 12 題 = 96 個產生器各 200 題；8 頁 Practice paper 用屏幕數字鍵打通（跟卷次序）；答錯→解法→補題→Oops；Drill；8 頁 Interview 12/12＋每頁寵物；唔夠分唔會出獎；倒數、Pass、口講模式；Fix my mistakes；草稿紙；Tip；舊數學存檔轉換；成語大冒險星星轉入星星袋、頁內開到指定章節、返回再轉新星；海圖、島嶼卡、Map chip；舊 Wild Quest 進度照讀；舊網址轉址；3D（SwiftShader）；1180／1024／768／390 闊度冇橫向 scroll；冇 JS error。

上線：push 去 `main`，GitHub Pages 大約 1 分鐘後更新。

## 待確認

1. **同一題型嘅小變化**：v2 已經收窄到跟卷，但為咗唔好次次一樣，有幾題仍然有少量同類變化：圓嘅部分（sector 以外仲有 radius／diameter／circumference／arc）、角嘅組合（straight + acute、2 個直角等）、數列（三角數以外仲有平方數、等差、雙倍）、圖形（三角形／四邊形內角和、其他正多邊形嘅對稱軸）、優惠（買一送一以外仲有買二送一、買三送一）。學校未教嘅，喺 `papers.js` 嗰題刪走就得。
2. **P5 Q7**（Kelly 200 m／1 分 20 秒）原題冇講單位，遊戲寫明 m/s；**P8 Q8**（倉鼠轆）原題數字唔現實，遊戲改用合理圈數；**P8 Q2** 手寫答案被遮，按題目計 Y = 0.1。
3. **iPad 實機**：Apple Pencil 隨手寫入答案格、Safari 🎤 語音辨識（要網、要開 Siri／聽寫）、成語大冒險喺 iframe 入面嘅聲音，要喺佢部 iPad 試一次。
4. **面試每題時間**預設 45 秒，唔知學校實際幾快，Maths settings 可改。
5. **成語大冒險第一次轉星**：開群島時會一次過將佢已有嘅星星轉入星星袋（可能一下多咗幾十粒）。如果想由 0 開始計，話一聲。
6. **Biodiversity Island 內容**冇改，原本 Wild Quest 嘅待確認仍然有效（介面英文、課本以外例子、昆蟲身體覆蓋、北極兔耳仔、松鼠冬眠題、PDF p.8 冇掃描），詳細睇 `docs/science-island.md`。

## 更新紀錄

- 2026-11-12：Maths Island v2。Gavin 試玩後覺得數學島太跟原本島嘅玩法、題目太深。改成一頁卷一個區（8 區），每區 12 題逐題跟原卷題型同數字大細（96 個產生器，Python 獨立重算 14 400 條全部一致）；Practice paper（跟卷次序）、Drill（一個題型 5 條）、Interview（每頁第一次 10/12 贏寵物，新增 Otter、Hedgehog）；刪走 Topic／Test／Zone Test／Maths Pals；3D 島改成 8 個地標；自動生成 `docs/maths-pages.md` 對照表；舊數學錯題自動清走。
- 2026-11-11：第一版（群島 v3）。Wild Quest 重新設計成可擴充嘅群島平台（shell + core + 3D 群島引擎 + 島嶼 pack）；新增 Maths Island（全英文：19 題種、Practice／Test／Zone Test 大佬／Mock Interview、Maths Pals、Fix my mistakes、數字鍵／Pencil／語音、草稿紙）；新增成語島（頁內開成語大冒險＋星星橋）；共用星星袋、商店（新寵物同各島裝飾）、Star Road、多島 Oops Book、家長頁、每日 streak。舊進度同 localStorage key 冇改；舊網址轉址。
- 2026-11-01：Wild Quest v2（區域大佬、Star Shop、Star Road、按情況轉嘅音樂）。
- 2026-11-01：Wild Quest 第一版。
