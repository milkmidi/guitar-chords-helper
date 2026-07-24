# Chord Controls Layout Redesign

Date: 2026-07-24
Status: Approved

## 目的

重新整理 `chord-stage` 下方的和弦控制區，解決目前根音、分類與 36 個和弦同時使用 pill
button 所造成的擁擠感。新 layout 應保留快速切換能力、鍵盤操作與現有品牌視覺，同時讓桌面
與手機都能清楚區分「選根音」、「選分類」、「選和弦」三個層級。

## 設計判讀

- 模式：既有產品的保留式 redesign，不變更頁面資訊架構。
- 主要使用者：練習中需要快速切換和弦的吉他與鍵盤使用者。
- 設計語言：沿用現有 native CSS、Bricolage Grotesque、單一橘色 accent、pill controls。
- 設計參數：`DESIGN_VARIANCE 5`、`MOTION_INTENSITY 3`、`VISUAL_DENSITY 6`。
- 不導入新的設計系統或元件套件。

## 現況問題

1. `Show All` 是預設分類，會一次攤開全部 36 個和弦。
2. 根音、分類與和弦類型都使用近似的 pill button，視覺層級不清楚。
3. 完整 controls 使用 sticky positioning，捲動後持續占用較大的垂直空間。
4. 手機版和弦類型使用兩列水平捲動，右側選項不容易被發現。
5. 既有分類 state 包含 `all`，從全目錄選取和弦時沒有「選取 symbol 與同步分類」的單一操作。

## 已確認決策

1. `Show All` 不再是預設分類，也不出現在正常分類 tabs。
2. 桌面保留全部 12 個根音，使用 `6 × 2` grid。
3. 桌面 controls 使用單一面板，左側根音、右側分類與和弦。
4. 手機根音使用 `6 × 2` grid，和弦類型使用三欄 grid，不再水平捲動。
5. 分類使用底線 tabs，不再使用 pill buttons。
6. 全部 36 個和弦移入可搜尋的「全部和弦」面板。
7. 桌面搜尋使用置中的 command dialog，手機使用 bottom sheet。
8. 從搜尋面板選取和弦後，自動同步到該和弦所屬分類。
9. 完整 controls 不再 sticky；捲出畫面後顯示 compact controls。
10. compact controls 可直接切換根音與和弦，不只是返回完整 controls。
11. 分類名稱維持英文，中文只作輔助說明與無障礙文字。
12. 保留既有快捷鍵，新增 `/` 開啟全部和弦搜尋。

## 資訊架構

### 桌面版，寬度大於等於 768px

```text
┌──────────────────────────────────────────────────────────┐
│ 根音，約 300px       │ Major  Minor  Dominant  ...  全部和弦 │
│ C   C#  D   D#  E  F │                                    │
│ F#  G   G#  A   A# B │ 目前分類的和弦 grid                 │
└──────────────────────────────────────────────────────────┘
```

- 外層是單一控制面板，不拆成多張卡片。
- 使用 `grid-template-columns: minmax(260px, 300px) minmax(0, 1fr)`。
- 左右欄之間只有一條垂直分隔線。
- 左欄放「根音」標籤、快捷鍵提示與 `KeySelector`。
- 右欄第一列放 category tabs 與「全部和弦」按鈕。
- 右欄第二列只顯示目前分類內的和弦，最多 9 個。
- 和弦按鈕使用自適應 grid，最小寬度 84px，不使用水平捲動。

### 手機版，寬度小於 768px

```text
┌──────────────────────────┐
│ 根音                      │
│ C  C# D  D# E  F          │
│ F# G  G# A  A# B          │
├──────────────────────────┤
│ Major Minor Dominant ...  │  可水平捲動
│ maj     6      6/9        │
│ maj7    maj9   maj13      │
│ add9    sus2   sus4       │
│                 全部和弦  │
└──────────────────────────┘
```

- 控制面板改為上下排列，垂直分隔線轉成水平分隔線。
- 根音固定 `6 × 2`，12 個選項全部可見。
- 360px 以下將頁面左右 gutter 降為 12px，根音 grid gap 降為 6px，讓每個按鈕仍可維持
  至少 44px 寬。
- category tabs 維持單列水平捲動。
- 和弦類型固定三欄 grid，單一分類最多三列。
- 「全部和弦」放在分類列尾端，保持可見文字，不只顯示 icon。
- 只有分類列可以水平捲動；根音與和弦 grid 不得產生水平溢位。

## 視覺層級

### 根音

- 保留現有 pill button 與選中狀態。
- 每個按鈕最小高度 44px。
- desktop 與 mobile 都採固定 `6 × 2` 位置，建立一致的位置記憶。

### 分類

- 使用 `role="tablist"`、`role="tab"` 與 `aria-selected`。
- 未選中分類不使用外框或背景。
- 選中分類以現有 accent 色底線與較深文字表示。
- tabs 保留英文：
  - Major
  - Minor
  - Dominant
  - Diminished
  - Augmented
  - Altered
- `Show All` 從 tabs 移除。

### 和弦類型

- 保留可點擊的 pill 或 soft button，與 category tabs 形成明確層級。
- 選中狀態沿用 accent surface、深色 edge 與輕微實體陰影。
- 每個按鈕文字保持單行。
- grid 使用目前分類的實際項目數，不製造空白 placeholder。

### 控制面板

- 使用現有 `--surface`、`--line`、`--r-card` 與 dark-mode tokens。
- 不新增額外 accent、漸層或巢狀卡片。
- 完整面板本身不 sticky。
- 面板與 `chord-stage` 保留 24px 間距。

## 全部和弦搜尋

### 觸發方式

- 完整 controls 的「全部和弦」按鈕。
- compact controls 的「搜尋」按鈕。
- 鍵盤 `/`。

### Desktop command dialog

- 使用原生 `<dialog>` 作為 modal 與 focus boundary，不新增 dialog 套件。
- 寬度上限約 640px，置中顯示。
- 開啟後 autofocus 搜尋欄位。
- 搜尋結果依分類分組。
- 支援滑鼠、Tab、Arrow Up、Arrow Down、Enter 與 Escape。

### Mobile bottom sheet

- 使用同一個 `<dialog>` 與資料模型，只在 `<768px` 改為貼齊畫面底部。
- 最大高度 `min(78dvh, 680px)`，內容區內部捲動。
- 保留清楚的標題、搜尋欄位與關閉按鈕。
- 開啟 bottom sheet 時隱藏 compact bottom dock，避免重複控制。

### 搜尋規則

- 搜尋 `symbol`、顯示 `label` 與 category。
- 不分大小寫。
- `#` 與 `♯` 視為相同。
- ASCII `b` 與 `♭` 視為相同。
- 支援 substring match，例如：
  - `maj` 找到 `maj7`、`maj9`、`mMaj7`。
  - `sus` 找到 `sus2`、`sus4`、`7sus4`。
  - `b9` 或 `♭9` 找到 `7♭9`。
- 無結果時顯示：「找不到符合的和弦」。

### 選取行為

1. 使用者選取搜尋結果。
2. 以 catalog symbol 更新 `symbol`。
3. 由 catalog 找出所屬 category，原子性地同步更新 `category`。
4. 關閉 dialog。
5. focus 回到原觸發按鈕。
6. `chord-stage`、指板、鋼琴與按法區依既有資料流更新。

## Compact controls

### 顯示條件

- 使用 `IntersectionObserver` 觀察完整 controls。
- 只有使用者已向下捲動，且完整 controls 的底部離開 viewport 後才顯示。
- 完整 controls 回到 viewport 時隱藏。
- 禁止使用 `window` scroll listener 或 React state 追蹤連續 scroll position。

### Desktop

- 固定在 viewport 頂部中央。
- 內容：

```text
[ C ▾ ] [ maj7 ▾ ] [ 上一個 ] [ 下一個 ] [ 搜尋 ]
```

- 根音 trigger 開啟 `6 × 2` floating selector。
- 和弦 trigger 開啟目前分類的和弦 selector。
- 上一個與下一個只在目前分類內循環。
- 搜尋開啟全部和弦 dialog。
- 不重複顯示 category tabs。

### Mobile

- 固定在 viewport 底部，尊重 `env(safe-area-inset-bottom)`。
- 保留根音、和弦、上一個、下一個與搜尋五個操作，但可使用較短的 aria-hidden 視覺標籤。
- 所有互動目標至少 44 × 44px。
- dock 顯示時，既有 `.metronome-fab` 必須上移到 dock 上方。
- dock 隱藏時，`.metronome-fab` 回到目前的右下位置。
- compact selector 在手機使用 bottom sheet，不使用容易超出 viewport 的小型 popover。

### Motion

- compact controls 只使用 `opacity` 與 `transform` 做短距離進出。
- 動畫只用來表達 controls 已從完整面板切換成 compact 狀態。
- `prefers-reduced-motion: reduce` 時立即顯示或隱藏。

## State 與資料模型

### Category state

- 正常 category state 只允許：
  - `major`
  - `minor`
  - `dominant`
  - `diminished`
  - `augmented`
  - `altered`
- `all` 不再是正常 category state。
- 初始 symbol 為 `major` 時，初始 category 為 `major`。
- 其他 initial symbol 由 `categoryForSymbol(initialSymbol)` 推導初始 category；無效 symbol fallback
  到 `major`。
- 全目錄搜尋直接讀取 `CHORD_CATALOG`，不需要 `all` category。

### `useChordCatalog`

應提供：

```ts
{
  category,
  symbol,
  changeCategory,
  selectSymbol,
  cycleSymbol,
  cycleCategory,
}
```

- `changeCategory(next)`：
  - 更新 category。
  - 如果目前 symbol 不屬於 next，選取 next 的第一個和弦。
- `selectSymbol(nextSymbol)`：
  - 更新 symbol。
  - 自動同步 nextSymbol 所屬 category。
- `cycleSymbol(dir)`：只在目前 category 內循環。
- `cycleCategory(dir)`：只在六個正常 categories 內循環。
- UI 不再直接呼叫裸 `setSymbol`，避免 category 與 symbol 不一致。

### Catalog helpers

新增或調整純函式：

```ts
categoryForSymbol(symbol: string): ChordCategory
normalizeChordQuery(query: string): string
searchChordCatalog(query: string): CatalogChord[]
```

- `categoryForSymbol` 找不到 symbol 時應有明確 fallback 或回傳 `undefined`，不得靜默產生錯誤分類。
- 搜尋結果維持 catalog 順序，分組時維持 category 定義順序。

## 元件邊界

建議拆分：

```text
ChordControls
├── KeySelector
├── ChordCategoryTabs
├── ChordTypeGrid
├── ChordSearchDialog
└── CompactChordControls
    └── CompactSelector
```

- `ChordControls` 負責完整面板 layout 與 observer target ref。
- `ChordCategoryTabs` 只負責分類 tabs，不含搜尋狀態。
- `ChordTypeGrid` 只接收目前分類的和弦與 selected symbol。
- `ChordSearchDialog` 擁有 query、結果游標、dialog focus lifecycle。
- `CompactChordControls` 與完整 controls 共用同一組 state callbacks。
- `CompactSelector` 負責根音或目前分類和弦的快速選擇。
- `App` 保留單一 chord state source，不複製 category 或 symbol state。

## 鍵盤規格

- `1-7`：維持切換 C、D、E、F、G、A、B。
- `← / →`：切換目前分類內上一個或下一個和弦。
- `↑ / ↓`：切換上一個或下一個分類。
- `/`：開啟全部和弦搜尋並 focus input。
- `Escape`：關閉最上層搜尋或 compact selector。
- 全域快捷鍵在以下情況不得觸發：
  - target 是 `input`、`textarea`、`select`。
  - target 或其祖先是 `contenteditable`。
  - 使用者正在進行 IME composition。
  - event 已被元件層 `preventDefault`。
- category tabs 使用正常 Tab navigation，並支援 Left 與 Right 在 tabs 間移動。
- category tab 處理 Left 與 Right 時必須阻止事件繼續傳到全域和弦循環快捷鍵。

## 無障礙

- 完整 controls 使用 `aria-label="建立和弦"`。
- 根音與和弦按鈕繼續使用 `aria-pressed`。
- category 使用 tablist semantics，對應和弦 grid 使用 `role="tabpanel"`。
- 搜尋 dialog 使用可見標題與 `aria-labelledby`。
- bottom sheet 開啟時背景不可操作。
- dialog 關閉後 focus 回到觸發來源。
- compact controls 使用 `aria-label="快速切換和弦"`。
- icon-only control 必須有 aria-label；可以使用純文字以避免新增 icon dependency。
- 所有 focus-visible 狀態沿用現有高對比 outline。
- light 與 dark mode 都必須維持 WCAG AA 對比。

## 響應式與碰撞規則

- 320px viewport 使用 12px page gutter 與 6px root-grid gap，不得產生 document-level 水平捲動。
- 390px viewport 應完整顯示 `6 × 2` 根音 grid 與三欄和弦 grid。
- 768px 是 controls 從上下排列切換成左右分欄的 breakpoint。
- compact bottom dock 不得遮住：
  - 最後一段內容。
  - footer。
  - metronome FAB。
  - bottom sheet。
- mobile 頁面底部需增加與 dock 高度相當的 safe padding，只有 dock 啟用時生效。

## Loading、empty 與 error states

- Catalog 是本地同步資料，不需要 loading skeleton。
- 搜尋 query 為空時顯示全部 36 個和弦並按 category 分組。
- 搜尋無結果時顯示清楚的 empty state，不顯示空白 dialog。
- 如果 symbol 不存在於 catalog：
  - 不得讓 UI crash。
  - 保留目前有效 selection。
  - 開發環境可輸出警告。

## 不做

- 不改 `chord-stage`、指板、鋼琴、按法或音軌 layout。
- 不改和弦 catalog 內容與分類。
- 不加入最近使用、收藏或自訂排序。
- 不加入可拖曳 compact dock。
- 不新增 routing 或 URL query state。
- 不新增外部 command palette、popover、dialog 或 icon 套件。
- 不改現有品牌配色、字體與 shape system。

## 測試

### Unit tests

- `categoryForSymbol` 對 36 個 catalog symbols 都回傳正確 category。
- `searchChordCatalog`：
  - 支援 ASCII 與 glyph accidental。
  - 不分大小寫。
  - 維持 catalog 順序。
  - 無結果回傳空陣列。
- `useChordCatalog` 的純 state transition：
  - 初始 category 是 `major`。
  - change category 必要時選第一個和弦。
  - select symbol 會同步 category。
  - category cycle 不包含 `all`。
- 快捷鍵 target guard：
  - input、textarea、select、contenteditable 與 IME 不觸發。

### Browser verification

- Desktop：
  - controls 是單一左右分欄面板。
  - 根音是 `6 × 2`。
  - 分類是底線 tabs。
  - 切分類只顯示該分類和弦。
  - controls 離開 viewport 後 compact bar 出現。
  - compact bar 可切根音、前後和弦與開啟搜尋。
- Mobile 390px：
  - 根音 `6 × 2` 全部可見。
  - 和弦 grid 是三欄且不水平捲動。
  - 搜尋以 bottom sheet 顯示。
  - compact dock、metronome FAB 與 safe area 不重疊。
- Search：
  - `/` 開啟並 focus input。
  - `b9` 能找到 `7♭9`。
  - 選 `7♭9` 後 category 自動切到 Altered。
  - Escape 關閉並恢復 focus。
- Accessibility：
  - 全流程可只用鍵盤完成。
  - dialog 背景不可 focus。
  - light 與 dark mode 都可讀。
  - reduced motion 下沒有滑入動畫。

## 完成條件

1. `Show All` 不再出現在正常分類 tabs。
2. 完整 controls 不再 sticky。
3. Desktop 與 mobile layout 符合本規格。
4. 全部和弦搜尋、分類同步與 compact controls 可用。
5. 既有根音、和弦、指板、鋼琴、按法與聲音功能無回歸。
6. `npm run harness-verify` 通過。
7. 實際瀏覽器完成 desktop、390px mobile、鍵盤、dark mode 與 reduced motion 驗證。
