export const MAX_AUTOMATIC_ENHANCEMENT_CHARS = 512 * 1024;

export function canAutomaticallyEnhance(content) {
  return (
    typeof content === "string" &&
    content.length <= MAX_AUTOMATIC_ENHANCEMENT_CHARS
  );
}

export function initialMarkdownViewMode(content, preferredMode = "preview") {
  if (preferredMode === "edit") {
    return "edit";
  }
  return canAutomaticallyEnhance(content) ? "preview" : "edit";
}
