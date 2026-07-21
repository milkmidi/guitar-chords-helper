import { lazy, Suspense } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import ChordFinderView from "./components/ChordFinderView";

// MIDI 分頁才需要 VexFlow（較大），延後載入讓預設的吉他分頁初始包更輕
const MidiDetectorView = lazy(() => import("./components/MidiDetectorView"));

const TABS: { to: string; label: string }[] = [
  { to: "/chords", label: "和弦查詢" },
  { to: "/midi", label: "MIDI 偵測器" },
];

export default function App() {
  return (
    <main className="page">
      <header className="masthead">
        <h1>Guitar Chords Helper</h1>
        <p className="masthead-subtitle">選根音與和弦類型，查看組成音、指板位置與常用按法。</p>
      </header>

      <nav className="tab-bar" aria-label="功能切換">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `tab-button${isActive ? " is-active" : ""}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Suspense fallback={<p className="section-note">載入中…</p>}>
        <Routes>
          <Route path="/chords" element={<ChordFinderView />} />
          <Route path="/midi" element={<MidiDetectorView />} />
          <Route path="*" element={<Navigate to="/chords" replace />} />
        </Routes>
      </Suspense>

      <footer className="page-footer">
        <span>Guitar Chords Helper</span>
        <span>點擊音符或按法即可播放，聲音由 Web Audio 即時合成</span>
      </footer>
    </main>
  );
}
