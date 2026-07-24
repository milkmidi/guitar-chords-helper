import { useCallback, useEffect, useRef, useState } from "react";
import type { CompactSelector } from "../lib/chordControls";
import { shouldHandleShortcutEvent } from "./shortcutGuard";

export interface ChordControlsUi {
  fullControlsRef: React.RefObject<HTMLElement | null>;
  searchDialogRef: React.RefObject<HTMLDialogElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  compactVisible: boolean;
  compactSelector: CompactSelector;
  searchOpen: boolean;
  searchQuery: string;
  openSearch: (trigger?: HTMLElement | null) => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  toggleCompactSelector: (selector: Exclude<CompactSelector, null>) => void;
  closeCompactSelector: () => void;
}

export function useChordControlsUi(): ChordControlsUi {
  const fullControlsRef = useRef<HTMLElement>(null);
  const searchDialogRef = useRef<HTMLDialogElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLElement | null>(null);
  const wasSearchOpen = useRef(false);
  const [compactVisible, setCompactVisible] = useState(false);
  const [compactSelector, setCompactSelector] = useState<CompactSelector>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const openSearch = useCallback((trigger?: HTMLElement | null) => {
    searchTriggerRef.current =
      trigger ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setCompactSelector(null);
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const toggleCompactSelector = useCallback(
    (selector: Exclude<CompactSelector, null>) => {
      setCompactSelector((current) => (current === selector ? null : selector));
    },
    [],
  );
  const closeCompactSelector = useCallback(() => setCompactSelector(null), []);

  useEffect(() => {
    const target = fullControlsRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      setCompactVisible(nextVisible);
      if (!nextVisible) setCompactSelector(null);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dialog = searchDialogRef.current;
    if (!dialog) return;

    if (searchOpen && !dialog.open) {
      dialog.showModal();
      searchInputRef.current?.focus();
      wasSearchOpen.current = true;
      return;
    }

    if (!searchOpen && dialog.open) dialog.close();
    if (!searchOpen && wasSearchOpen.current) {
      searchTriggerRef.current?.focus();
      wasSearchOpen.current = false;
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldHandleShortcutEvent(event)) return;
      if (event.key === "Escape" && searchOpen) {
        event.preventDefault();
        closeSearch();
        return;
      }
      if (event.key === "Escape" && compactSelector) {
        event.preventDefault();
        setCompactSelector(null);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      openSearch();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch, compactSelector, openSearch, searchOpen]);

  return {
    fullControlsRef,
    searchDialogRef,
    searchInputRef,
    compactVisible,
    compactSelector,
    searchOpen,
    searchQuery,
    openSearch,
    closeSearch,
    setSearchQuery,
    toggleCompactSelector,
    closeCompactSelector,
  };
}
