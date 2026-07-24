export interface ShortcutContext {
  defaultPrevented: boolean;
  isComposing: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  targetTagName?: string;
  targetIsContentEditable: boolean;
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function shouldHandleGlobalShortcut(context: ShortcutContext): boolean {
  if (
    context.defaultPrevented ||
    context.isComposing ||
    context.metaKey ||
    context.ctrlKey ||
    context.altKey
  ) {
    return false;
  }

  return (
    !context.targetIsContentEditable &&
    !EDITABLE_TAGS.has(context.targetTagName?.toUpperCase() ?? "")
  );
}
