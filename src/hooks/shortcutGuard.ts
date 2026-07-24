import { shouldHandleGlobalShortcut } from "../lib/keyboard";

export function shouldHandleShortcutEvent(event: KeyboardEvent): boolean {
  const target = event.target instanceof HTMLElement ? event.target : undefined;
  return shouldHandleGlobalShortcut({
    defaultPrevented: event.defaultPrevented,
    isComposing: event.isComposing,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    targetTagName: target?.tagName,
    targetIsContentEditable: target?.isContentEditable ?? false,
  });
}
