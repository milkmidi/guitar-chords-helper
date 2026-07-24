# AGENTS.md

> 本檔案是 AI coding agent 在此 repo 工作時的**最高準則**。
> 當本檔案與任何預設行為衝突時，**以本檔案為準**；當本檔案與使用者當下明確指示衝突時，以使用者指示為準，但仍需遵守第 7 章「禁止事項」中標記為【絕對禁止】的條目。
> 全文以繁體中文撰寫，所有規則皆為**可執行、可驗證**的硬性要求，不是建議。

---

## 1. Project Overview（專案總覽）

### 1.1 這是什麼

一個吉他學習用的單頁應用（SPA）：同一畫面上、同一個和弦，**同時**呈現在吉他指板與鋼琴鍵盤上。

使用者選一個根音（C…B）與一個和弦類型（category 過濾後約 36 種，涵蓋 Major / Minor / Dominant / Diminished / Augmented / Altered），透過**一組共用控制列**同時驅動：

- **吉他欄（`GuitarSection`）**：水平 SVG 指板、和弦組成音 hero 行、voicing 圖 v1–vN、以及目前用 `SHOW_TRACK = false` 關閉的 track sequencer。
- **鋼琴欄（`PianoSection`）**：VexFlow 大譜表 + 鍵盤。即時 Web MIDI 輸入會被反向解析成和弦名稱，且**只**驅動鋼琴欄。
- **浮動節拍器（`MetronomeLauncher` / `Metronome`）**：右下角 FAB 開關的可拖曳面板，含 BPM 轉盤、Tap tempo、3/4/5 拍號、靜音與播放。

點吉他音格 / 鋼琴鍵 → 播放該單音；點 voicing 圖 / 譜表 → 刷該和弦；所有聲音皆為 **Web Audio 合成，無音檔**。

### 1.2 目標

- 學習者能在**一個畫面**同時看懂一個和弦在兩種樂器上的位置與組成音。
- 音名顯示必須**音樂學正確**（見 §3.6 等音策略）。
- 保持**零 runtime 相依膨脹**：能用純函式與內建 API 解決的，不引入新套件。

### 1.3 技術棧（不得擅自更換）

| 類別 | 選型 |
|---|---|
| 建置工具 | Vite 8 |
| 框架 | React 19 |
| 語言 | TypeScript（strict） |
| 樣式 | Tailwind CSS v4（但實際採「語意化 CSS class + design token」，見 §3.3） |
| 樂理 | tonal |
| 樂譜 | VexFlow 5（heavy，須 lazy 載入） |
| 聲音 | Web Audio API（module 級單一 `AudioContext`） |
| 測試 | Vitest 4 |
| Lint | oxlint |
| Voicing 資料來源 | `@tombatossals/chords-db`（**devDependency only**） |

> 規格與實作計畫放在 `docs/superpowers/specs/` 與 `docs/superpowers/plans/`。**擴充任一功能前，先讀對應的 spec。**

---

## 2. Repository Structure（資料夾結構）

以下為現行且必須維持的結構。新增檔案時，**依職責歸位**，不得把邏輯寫進元件、也不得把狀態寫進 `src/lib/`。

```
guitar-chords-helper/
├─ AGENTS.md                    # 本檔（最高準則）
├─ CLAUDE.md                    # symlink → AGENTS.md
├─ README.md
├─ index.html
├─ package.json                 # scripts 見 §4
├─ vite.config.ts               # dev port = 3000
├─ tsconfig.json / tsconfig.app.json / tsconfig.node.json
├─ .oxlintrc.json               # lint 設定
├─ scripts/
│  └─ extract-voicings.mjs      # 產生 src/data/voicings.json（見 §3.7）
├─ docs/superpowers/
│  ├─ specs/                    # 設計規格（YYYY-MM-DD-<topic>-design.md）
│  └─ plans/                    # 實作計畫（YYYY-MM-DD-<feature>.md）
└─ src/
   ├─ main.tsx                  # 進入點
   ├─ App.tsx                   # 唯一頁面；擁有共用選擇與鍵盤快捷鍵
   ├─ index.css                 # 全站語意化 class + design token（light/dark）
   ├─ lib/                      # 純邏輯，Vitest 覆蓋，colocated *.test.ts
   │  ├─ chords.ts / chordCatalog.ts / chordDetect.ts
   │  ├─ fretboard.ts / voicings.ts / staff.ts / player.ts
   │  ├─ metronome.ts           # BPM/角度/tap 純數學
   │  └─ audio.ts               # Web Audio（無法在 node 測試）
   ├─ hooks/                    # 有狀態 / 副作用的邏輯
   │  ├─ useChordCatalog.ts / useArrowCycle.ts / useRootShortcut.ts
   │  ├─ useTrackPlayer.ts / useMidiInput.ts
   │  ├─ useMetronome.ts        # 精準 rAF 排程器
   │  └─ useDraggable.ts        # 浮動面板拖曳
   ├─ components/               # 純、無狀態、props 驅動的顯示元件（SVG 在此）
   │  ├─ 吉他：GuitarSection / Fretboard / ChordDiagram / VoicingsPanel / TrackPanel / TrackControls
   │  ├─ 鋼琴：PianoSection / Staff / MidiKeyboard
   │  ├─ 共用：KeySelector / ChordCatalogSelector / ChordNotesDisplay / ChordReadout
   │  └─ 節拍器：MetronomeLauncher / Metronome / Pie
   └─ data/
      └─ voicings.json          # 由 extract-voicings.mjs 產生並 commit 進 repo
```

**歸位規則（硬性）：**

- 純函式、樂理計算、資料轉換 → `src/lib/`，且**必須**有 colocated `*.test.ts`。
- React state / effect / 事件監聽 / 計時器 → `src/hooks/`。
- 只吃 props、只負責畫面（含所有 SVG）→ `src/components/`，**不得**有商業邏輯或狀態。
- 跨樂器的共用選擇狀態與鍵盤快捷鍵 → 只放 `App.tsx`。

---

## 3. Coding Standards & Naming Conventions（程式風格與命名）

### 3.1 TypeScript

- **一律 strict**。不得使用 `any`；必要時用 `unknown` + narrowing，或明確的 union / 泛型。
- 不得用 `// @ts-ignore` / `// @ts-nocheck` 繞過型別錯誤（見 §7）；型別錯誤要**修好**，不是壓掉。
- 匯出的函式與 hook **必須**標註參數與回傳型別（純 lib 函式尤其）。
- 元件 props 用 `interface Props { ... }`；跨檔共用型別放對應的 `src/lib` 模組並具名匯出。
- 優先 `const`；避免 `let` 除非有重新指派；不得用 `var`。

### 3.2 檔案與命名

| 對象 | 規則 | 範例 |
|---|---|---|
| Component 檔 | `PascalCase.tsx`，default export，檔名 = 元件名 | `MetronomeLauncher.tsx` |
| Hook 檔 | `useXxx.ts`，named export `useXxx` | `useMetronome.ts` |
| lib 檔 | `camelCase.ts`，named export | `chordDetect.ts` |
| 測試檔 | 與被測檔同名 + `.test.ts`，同資料夾 colocated | `metronome.test.ts` |
| 常數 | `UPPER_SNAKE_CASE` | `BPM_MIN`、`FRETBOARD` |
| 變數 / 函式 | `camelCase`，命名描述「做什麼」而非「怎麼做」 | `bpmFromAngle` |
| 型別 / interface | `PascalCase` | `Position`、`Voicing` |

### 3.3 Tailwind 與樣式

- 本專案雖裝了 Tailwind v4，但**慣例是語意化 CSS class + design token**，寫在 `src/index.css`；**不得**在 JSX 堆砌 utility class 洪流。
- 顏色一律用既有 token，**禁止硬編 hex/rgb**：`--bg --ink --surface --chip --line --muted --accent --accent-deep --on-accent --edge --board --board-line --string`；圓角 `--r-card --r-block`；字體 `--display --sans --mono`；動畫 `--spring`。
  - 例外：陰影（box-shadow）沿用 `index.css` 既有的 raw `rgba(0,0,0,…)` 慣例。
- 樣式要同時支援 light / dark（token 已在 `:root` 與 `@media (prefers-color-scheme: dark)` 定義好，用 token 即自動生效）。
- 互動元件狀態用 `is-*` modifier class（如 `is-selected`、`is-active`、`is-muted`），toggle 類按鈕**必須**有 `aria-pressed`，並提供 `aria-label`。

### 3.4 React

- 元件保持純、無副作用；副作用一律進 hook。
- 會頻繁變動但不該重啟 effect 的值（如計時器內讀取的 `bpm`/`muted`/callback）→ 用 **ref 讀取**，並**不**列入 effect deps（這是刻意且正確的，見 `useMetronome.ts`）。
- 事件監聽（`document.addEventListener` / rAF / MIDI）**必須**在 cleanup 移除 / 取消；pointer 互動要同時處理 `pointerup` 與 `pointercancel`，並在 unmount 清乾淨。
- VexFlow 很重：`Staff` 必須維持 `lazy()` + `Suspense`。

### 3.5 分層（硬性，違反即為架構錯誤）

- `src/lib/` 內**不得** import React 或 DOM。
- `src/components/` 內**不得**有商業邏輯或 `useState`/`useEffect` 以外的狀態管理；SVG 幾何計算若複雜，抽到 `src/lib/`（如 `Pie` 的弧線、`fretboard` 的座標）。
- 跨樂器共用狀態只在 `App.tsx`；每個 section 自持其樂器區域狀態。

### 3.6 等音策略（Enharmonic policy）— 核心設計，改動前必讀

- 音的**比對**用 chroma（pitch class 0–11），所以 C# ≡ Db。
- 音的**顯示**用該和弦自己的 tonal 拼法（C minor 顯示 Eb，永不顯示 D#）。
- 由 `chromas`/`notes` 平行陣列建 `noteLabels: Map<chroma, spelledName>` 傳給 `Fretboard`。
- **絕對不要**直接顯示 fretboard 推導出的音名——那是 sharp 拼法，只能用於音高（audio），不可用於畫面文字。

### 3.7 兩種相反的弦序（極易搞錯）

- `fretboard.ts` 的 `TUNING = ["E4","B3","G3","D3","A2","E2"]`：index 0 = **第 1 弦 = 高音 E**（水平指板畫在最上方）。
- Voicing 資料（`Voicing.frets`/`fingers`，來自 chords-db）：index 0 = **低音 E**（垂直和弦圖畫在最左）。`frets`：`-1` = 悶音、`0` = 空弦、其餘為相對 `baseFret`。

### 3.8 Voicing 資料管線

- `@tombatossals/chords-db` 只是 **devDependency**；runtime 只 import 已 commit 的 `src/data/voicings.json`（12 keys × 34 chords）。
- `scripts/extract-voicings.mjs` 產生該 JSON，任一對應的 key×chord 無 position 時**以非零碼結束**。腳本內有兩張 map（因無法 import .ts）：`KEY_MAP`（sharp key → chords-db 名稱）與 `SYMBOL_TO_SUFFIX`（catalog symbol → chords-db suffix）。
- 無 chords-db 資料的 catalog 和弦（如 `m13`、`13#11`）被略過，`getVoicings` 回 `[]`，`VoicingsPanel` 不渲染。
- **新增 key 或和弦時**：更新 `chordCatalog.ts` + `SYMBOL_TO_SUFFIX`，再跑 `npm run extract-voicings`，並確認 `voicings.test.ts` 通過。

### 3.9 Audio

- 全站單一 module 級 `AudioContext`，於首次使用者手勢時 lazy 建立/resume（瀏覽器自動播放政策）。
- `playNote("C4")` 吃帶八度音名；`playStrum(midi[])` 由低到高每 60ms 排一個 oscillator、單音 gain 調低（0.15 vs 0.25）避免削波；`playClick(isAccent)` 為節拍器方波（重拍 800Hz / 弱拍 400Hz）。
- 三者共用 `ensureContext()`（含 iOS playback session 靜音處理）：**要擴充就延伸這些共用函式，不要複製 oscillator 接線**。

---

## 4. Quality Gates（品質關卡，必須 100% 通過）

每一項都是**硬性門檻**。任何一項未過，**不得** commit、不得宣稱完成、不得建立 PR。

| 關卡 | 指令 | 通過標準 |
|---|---|---|
| Lint | `npm run lint`（= `oxlint`；若本機 hook 干擾可直接 `npx oxlint`） | 0 error、0 warning |
| 型別檢查 | `npm run type-check`（= `tsc -b --noEmit`，references-aware） | 0 型別錯誤 |
| 測試 | `npm test`（= `vitest run`） | 全數通過，輸出乾淨無警告 |
| 建置 | `npm run build`（= `vite build`） | 成功產出 |
| 一鍵全跑 | `npm run harness-verify` | 依序跑完上列四關並印出 `✅ Harness Verify PASS`（見 §9） |

補充指令：

```bash
npm run dev                              # dev server → http://localhost:3000
npx vitest run src/lib/<name>.test.ts    # 只跑單一測試檔
npm run extract-voicings                 # 重新產生 voicings.json
```

**規則：**

- 提交前**必須**跑過上表四關並貼出實際輸出作為證據；**不得**憑印象宣稱「應該會過」。
- `vite build` 出現「chunk > 500 kB」屬既有警告（VexFlow 很重），非本次變更造成者可忽略；但**不得**用它掩蓋你自己引入的新問題。
- 測試輸出中的任何 warning / 雜訊視為**未通過**，需清乾淨。

---

## 5. Testing Strategy（測試策略）

### 5.1 三層

1. **Unit test（必寫）**：`src/lib/` 內所有純樂理 / 數學 / 資料轉換邏輯，colocated `*.test.ts`，用 Vitest。
   - 涵蓋邊界值與等音情境（如 `bpmFromAngle(45)=30`、`bpmFromAngle(315)=300`、C minor 拼成 Eb）。
2. **Integration / matrix test（必維持）**：跨模組與資料漂移守門。
   - **保留全矩陣測試**：全 12 keys × catalog / 吉他支援的和弦。這是 tonal 升級與資料漂移的唯一防線，**不得**為了加速而刪減。
   - `voicings.test.ts`：每個吉他支援的 catalog symbol 在 12 keys 內都要 ≥1 voicing。
3. **Smoke（手動，瀏覽器）**：SVG 渲染、Web Audio、Web MIDI、拖曳/pointer 互動——**無法在 node/Vitest 跑**，一律在瀏覽器手動驗證。
   - 每個含上述行為的功能，其 spec/plan 要附一份手動驗收清單，並在完成前實際走過。

### 5.2 硬性規則

- 新增或修改 `src/lib/` 邏輯 → **先或同時**補/改對應測試（見 §6 閉環）。
- 測試要驗**真實行為**，不得只驗 mock；不得寫「assert 什麼都沒驗」的空殼測試。
- `audio.ts`、`useMidiInput`、rAF 排程器、拖曳 hook 屬手動驗證範疇，不強制單元測試，但其可抽出的純邏輯（如 `metronome.ts`、`chordDetect.ts`）**必須**單元測試。

---

## 6. Agent Workflow Rules（每次改 code 的閉環）

**每一次**對程式碼的修改都必須跑完以下閉環，缺一不可：

```
① 讀 spec / 現有程式與慣例
        ↓
② 寫 code（遵守 §3 分層與命名）
        ↓
③ 寫 / 改測試（§5：純邏輯先補測試）
        ↓
④ 跑測試 → 失敗就回 ②/③ 修（systematic debugging，不亂猜）
        ↓
⑤ 跑 §4 全部 Quality Gates（type / lint / test / build）
        ↓
⑥ 全綠且輸出乾淨 → commit（訊息說明「做了什麼、為什麼」）
        ↓
⑦ 有不確定或牽涉不可逆/對外動作 → 依 §8 停下來找人類
```

**細則：**

- **一次只做一個小步**：能獨立測試、獨立 review 的最小單位；不要把不相關變更混在一個 commit。
- **改到 `src/lib/` 一定連帶跑該測試檔**；改到多檔就跑 `npm test`。
- **不得**在測試紅燈、型別錯誤、lint 有 error 的狀態下往下走或宣稱完成。
- **遇到既有 bug/壞味道**：只在「與當前任務相關」時就地修好；不做無關的大範圍重構（那要先與人類確認）。
- **debug 時**：先重現、再定位根因，禁止「換個寫法碰運氣」式亂改（見 systematic-debugging 精神）。
- **完成宣稱**：必須附上實際跑過的指令與輸出，證據先於結論。

---

## 7. Forbidden Actions（禁止事項）

標【絕對禁止】者，即使使用者當下要求也需先停下確認風險（見 §8）；其餘為預設禁止、除非使用者明確授權。

- 【絕對禁止】讀取或寫入任何 `.env`、`.env.local`（可讀寫 `.env.example`）。
- 【絕對禁止】執行破壞性 / 不可逆指令而未先確認：`git reset --hard`、`git push --force`、`git clean -fdx`、`rm -rf`、刪除分支、drop 資料等。
- 【絕對禁止】用 `@ts-ignore`、`@ts-nocheck`、`eslint-disable`（除非 §3.4 的 ref 模式且 lint 真的報錯時才加、並註明原因）、或 `any` 來「讓它過」而非修好根因。
- 【絕對禁止】跳過或造假 Quality Gates：不得在紅燈下 commit、不得謊報測試通過、不得刪測試/改斷言來讓測試變綠。
- 【絕對禁止】把錯誤吞掉（空 `catch`、`?? 0` 之類的沉默 fallback 掩蓋解析失敗）而不處理或不回報。
- 未經同意**不得**新增 runtime 相依套件（本專案刻意零膨脹；圖示用 inline SVG，數學用純函式）。
- 未經同意**不得**更換技術棧、升級主要框架大版本、或改動建置設定（`vite.config.ts`、`tsconfig*`、`.oxlintrc.json`、`package.json` scripts）。
- **不得**破壞既有分層：`src/lib/` 不碰 React/DOM；`src/components/` 不放邏輯/狀態。
- **不得**硬編顏色 hex/rgb（陰影 rgba 例外，見 §3.3）、不得堆砌 Tailwind utility 洪流。
- **不得**直接顯示 fretboard 推導的 sharp 音名（違反 §3.6 等音策略）。
- 未經明確要求**不得** commit、push、建立 PR、或合併分支；若在預設分支（main）上，先開分支再改。
- **不得**把秘密、金鑰、個資寫進程式碼、log 或 commit。

---

## 8. How to Ask for Help / When to Stop（何時找人類、何時停止）

### 8.1 立即停下、先問人類（不要自行決定）

- 需要**不可逆或對外**的動作：force push、刪分支、合併、部署、發 PR、對外送出資料、刪檔覆寫。
- 任務牽涉**多種合理架構選擇**，且 spec 沒指定（例如資料模型、狀態擁有權、API 邊界）。
- 需求**本身矛盾**、或按任何合理假設執行都會讓成果無用 / 不安全。
- 要**新增相依、改技術棧、改建置設定**（§7）。
- 要**觸碰 `.env` 類機密**或任何看起來像密鑰/個資的東西。
- 反覆嘗試後仍**無法定位根因**、或同一個修法試了 2–3 次仍失敗——停下說明，而不是繼續亂試。

### 8.2 可先自行推進、但要在回報時標記

- spec 有小模糊：先做**不依賴該答案**的部分，對依賴的部分**寫明假設**並繼續，最後把問題帶到回覆結尾（不阻塞整體交付）。
- 發現與任務相關的小 bug：就地修好並在回報中說明。

### 8.3 停下時怎麼說（可執行）

回報必須包含：**我試了什麼 → 觀察到什麼（含實際輸出）→ 卡在哪 → 需要哪種決定/資訊**，並在需要抉擇時給出**建議選項**，而非開放式「你想怎麼做？」。

### 8.4 完成時怎麼說

- 只有在 §4 全綠、且（若有）手動驗收清單走過後，才可宣稱「完成」。
- 據實回報：測試失敗就貼輸出說失敗；有步驟跳過就明講；完成且驗證過才平實地說完成，不誇大、不含糊。
