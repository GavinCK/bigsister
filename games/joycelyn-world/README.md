# 🏝️ Joycelyn's Islands（學習群島）

丫妹（Joycelyn，小六）一個網頁就溫晒所有科：一片海、每科一個島，星星同獎勵全部共用。

| 島 | 科目 | 語言 | 內容 |
|---|---|---|---|
| 🐸 **Biodiversity Island** | 常識 P6 Unit 1 | 英文 | 原本嘅 Wild Quest：7 區、12 個小遊戲、6 隻區域大佬、Fake-Bot（詳細：[`docs/science-island.md`](docs/science-island.md)） |
| 🦉 **Maths Island** | 數學（升中面試心算） | **全英文** | 19 個題種、89 個題目產生器；Practice／Test／Zone Test／Mock Interview |
| 🐼 **成語島 Idiom Island** | 中文 | 中文 | 直接喺頁內開返原本嘅「成語大冒險」（第一章、第二章、修辭樂園、成績表） |

- **網址**：https://gavinck.github.io/bigsister/games/joycelyn-world/（`?island=maths` 可以直接去某個島）
- **舊網址**：`games/wild-quest/` 會自動跳去呢度嘅 Biodiversity Island，iPad 主畫面 icon 照用得。
- **主要裝置**：iPad（Safari、加入主畫面），橫向直向都得（數學同中文直向都好用）。
- **進度**：localStorage key `wildquest-bio-p6-v1`（Wild Quest 原本嗰個，**唔好改**）；而家成個群島共用，新欄位由 `ensure()` 補。成語大冒險繼續用自己嘅 `chengyuAdventure_v1`（只讀）。

## 共用嘅獎勵

- **星星袋（pouch）**：每個島玩完都會入星（科學小遊戲、數學練習／小測／Zone Test／面試、成語大冒險新攞到嘅星）。
- **Star Shop**：服裝、寵物、裝飾（每件裝飾屬於一個島，例如 Rocket 喺 Maths Island、Lotus pond 喺成語島）、道具。
- **Star Road**：按「一共賺過幾多粒星」開禮物，所有島都計。
- **Oops Book**：所有島嘅錯題，有 All／Science／Maths／中文分頁；數學錯題有「Practise it」（同類型新數字）同「Fix my maths mistakes」。
- **每日 streak 🔥**、**For grown-ups 家長頁**（每個島一節）。
- **收集**：Biodiversity 有 Field Guide（89 張卡），Maths 有 Maths Pals（19 隻，Test 80%+ 先贏到，贏咗會喺 Maths Island 上面周圍行）。

## Maths Island（全英文）

升中面試係即場考、口答都得，所以數學島全部英文：介面、題目、提示、鼓勵說話、家長頁嗰節都係英文。題型根據 Gavin 提供嘅 8 張 P6 Mental 卷（P1–5 = Core、最重要；P6–8 = Challenge）。原卷有版權聲明而 repo 係 public，所以冇放 PDF、冇抄原題，全部係按原題結構用新數字生成。

### 區域

| 區域 | 題種（Maths Pal） | 卷 | 大佬（Zone Test） | 第一次贏 |
|---|---|---|---|---|
| Calc Cove（巨型算盤） | Order of Operations 🦉、Decimals × ÷ 0.1 & 0.01 🐬、Fraction Mix 🐙 | P1–P4 | Captain Calc（alien） | Octopus 寵物 |
| Fraction Falls（缺咗一件嘅批） | Fraction ⇄ Decimal ⇄ % 🦎、Compare & Order 🐊 | P1, P2, P4 | Squiddy Slice | Flamingo |
| Algebra Bridge（會搖嘅天秤） | Solve Equations 🦩、Patterns & Averages 🐞 | P1–P5 | King Balance | Kangaroo |
| Shape Garden（立體雕塑） | 3-D Shapes, Circles & Angles 🐝、Volume & Capacity 🦛、Circles 🐌 | P1–P5 | Mammoth Prism | Peacock |
| Measure Market（鐘樓市集） | Units & Time 🦘、Percentages 🦊、Speed 🐆 | P1, P3–P5 | Major Metre | Ladybird |
| Challenge Peak（雪山） | Tricky Equations 🐉、Circles Pro 🦚、Discounts & % 🦜、Speed & Time Pro 🐇、Angles & Symmetry 🦋、Number Sense Pro 🦄 | P6–P8 | Rex the Riddler | Baby T-rex |
| Interview Hall（中間） | Mock Interview · Core／Full | 全部 | — | — |

每條原題對應邊個產生器、每個產生器考咩，詳細列喺 `src/js/islands/maths/mathlib.js` 每個題種嘅 `src` 同 `gens[].label`（家長頁亦有表）。

### 玩法

| 模式 | 題數 | 提示 | 草稿紙 | 對答案 | 獎勵（入星星袋） |
|---|---|---|---|---|---|
| Practice | 8 | 💡 兩級提示 → 👣 解法 | 有 | 即時；錯 1 次再試，錯 2 次出解法再補一條同類新題 | 第一次就啱 7–8 題 3★、5–6 題 2★、3–4 題 1★ |
| Test | 8 | 冇 | 預設有（設定可熄） | 做完先對 | 100% 🏆 3★、80% 🥈 2★、60% 1★；80%+ 贏 Maths Pal |
| Zone Test（大佬） | 10（成個區混合） | 冇 | 預設有 | 做完先對 | 80%+ 打贏；第一次贏 +5 星＋寵物 |
| Mock Interview | 12（Q1–Q8、9a/b、10a/b） | 冇 | **冇** | 做完先對；每題讀出嚟、倒數（預設 45 秒）、可 Pass | 11+ 題 3★、9+ 2★、6+ 1★；10 秒內答啱有 ⚡ |
| Fix my mistakes | 4–8 | 有 | 有 | 同 Practice | 第一次答啱，嗰類錯題由 Oops Book 刪走 |

- Zone Test 喺嗰區每個題種 Practice 最少 1★ 先會瞓醒。
- 口講模式：面試開始時揀「Say it out loud」，大人做面試官，撳 Show answer 再判 ✅／❌。
- 答題：屏幕數字鍵（a/b 分數格、a b/c 帶分數格）、Apple Pencil 直接寫入答案格（iPadOS 隨手寫）、iPad 鍵盤聽寫（設定揀 iPad keyboard）、瀏覽器支援就有 🎤。
- 改卷跟學校：分數要最簡、指定形式（decimal／fraction）、四捨五入保留尾 0（2.0）、排序符號、a.m./p.m.。

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
            ├── maths/         pack.js、island.js、data.js（區域、進度）、mathlib.js（分數運算＋19 題種＋產生器）、engine.js（所有數學畫面，Shadow DOM）、style.js
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

測試內容：科學島原本全部測試（12 個小遊戲、6 隻大佬、Kraken Kaptain、商店、Star Road）；數學 89 個產生器各 200 題；19 個題種 Practice 用屏幕數字鍵打通；答錯→解法→補題→Oops；19 個 Test（100%＋Maths Pal）；6 個 Zone Test（打贏＋寵物）；Core／Full 面試 12/12；倒數、Pass、口講模式；Fix my mistakes；草稿紙；成語大冒險星星轉入星星袋、頁內開到指定章節、返回再轉新星；海圖、島嶼卡、Map chip；舊 Wild Quest 進度照讀；舊網址轉址；3D（SwiftShader）；1180／1024／768／390 闊度冇橫向 scroll；冇 JS error。

上線：push 去 `main`，GitHub Pages 大約 1 分鐘後更新。

## 待確認

1. **數學卷以外嘅變化**：為咗題目多樣，有少量同課題但卷冇直接考過嘅答案（圓嘅其他名稱 arc／radius／diameter／semicircle、更多角嘅組合、km → m、柱體「面」數、三角數以外嘅數列、三角形／四邊形內角和、其他圖形嘅對稱軸、「買二送一」等）。學校未教嘅可以喺 `mathlib.js` 刪走。
2. **P5 Q7**（Kelly 200 m／1 分 20 秒）原題冇講單位，遊戲寫明 m/s；**P8 Q8**（倉鼠轆）原題數字唔現實，遊戲改用合理圈數；**P8 Q2** 手寫答案被遮，按題目計 Y = 0.1。
3. **iPad 實機**：Apple Pencil 隨手寫入答案格、Safari 🎤 語音辨識（要網、要開 Siri／聽寫）、成語大冒險喺 iframe 入面嘅聲音，要喺佢部 iPad 試一次。
4. **面試每題時間**預設 45 秒，唔知學校實際幾快，Maths settings 可改。
5. **成語大冒險第一次轉星**：開群島時會一次過將佢已有嘅星星轉入星星袋（可能一下多咗幾十粒）。如果想由 0 開始計，話一聲。
6. **Biodiversity Island 內容**冇改，原本 Wild Quest 嘅待確認仍然有效（介面英文、課本以外例子、昆蟲身體覆蓋、北極兔耳仔、松鼠冬眠題、PDF p.8 冇掃描），詳細睇 `docs/science-island.md`。

## 更新紀錄

- 2026-11-11：第一版（群島 v3）。Wild Quest 重新設計成可擴充嘅群島平台（shell + core + 3D 群島引擎 + 島嶼 pack）；新增 Maths Island（全英文：19 題種、Practice／Test／Zone Test 大佬／Mock Interview、Maths Pals、Fix my mistakes、數字鍵／Pencil／語音、草稿紙）；新增成語島（頁內開成語大冒險＋星星橋）；共用星星袋、商店（新寵物同各島裝飾）、Star Road、多島 Oops Book、家長頁、每日 streak。舊進度同 localStorage key 冇改；舊網址轉址。
- 2026-11-01：Wild Quest v2（區域大佬、Star Shop、Star Road、按情況轉嘅音樂）。
- 2026-11-01：Wild Quest 第一版。
