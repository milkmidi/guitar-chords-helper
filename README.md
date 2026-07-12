# Guitar Chords Helper

吉他學習用的 Web App：選一個調（C～B）和和弦類型（major、minor、7、maj7、m7、sus2、sus4、dim、aug），就能看到——

- **橫式指板**（6 弦 × 12 格 + 空弦）亮起該和弦的**所有組成音位置**：根音橘色、其他組成音藍色，圓點內顯示音名（等音以和弦拼法呈現，例如 Cm 顯示 Eb 而不是 D#）
- **組成音列表**，例如 `C Major = C - E - G`
- **按法圖（voicings）**：該和弦的常見按法 v1–vN 直式和弦圖，含把位標示（3fr、5fr…）、封閉條、手指編號、悶音/空弦記號

聲音部分全用 Web Audio 合成、零音檔：

- 點指板上的音 → 播放該弦該格的實際音高
- 點按法圖 → 由低音到高音掃弦播放整個和弦

## 開發

```bash
npm install
npm run dev        # http://localhost:5173
```

| 指令 | 說明 |
|---|---|
| `npm run dev` | 開發伺服器 |
| `npm test` | 跑 Vitest 測試（樂理邏輯） |
| `npm run build` | type-check + production build |
| `npm run lint` | oxlint |
| `npm run extract-voicings` | 重新從 chords-db 產生按法資料（見下） |

## 技術

- **Vite + React 19 + TypeScript + Tailwind CSS v4**
- **[tonal](https://github.com/tonaljs/tonal)** — 和弦組成音與音高計算
- **[@tombatossals/chords-db](https://github.com/tombatossals/chords-db)** — 按法資料來源（僅 devDependency：`scripts/extract-voicings.mjs` 抽出 12 調 × 9 類型的子集產成 `src/data/voicings.json`，runtime 只吃這份生成的 JSON）
- 指板與和弦圖皆為自繪 SVG；掃弦用 Web Audio API `OscillatorNode` 合成

## 結構

```
src/
  lib/         純邏輯（有單元測試）：chords / fretboard / voicings / audio
  components/  純顯示元件：Fretboard、ChordDiagram、VoicingsPanel、選擇器
  data/        generated 按法資料（extract-voicings 產生）
  App.tsx      唯一的 state（selectedKey + chordType）
docs/superpowers/  設計 spec 與實作計畫
```
