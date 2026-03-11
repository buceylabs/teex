function stripQueryAndFragment(path) {
  const qIndex = path.indexOf("?");
  const hIndex = path.indexOf("#");
  if (qIndex === -1 && hIndex === -1) return path;
  const end =
    qIndex === -1 ? hIndex : hIndex === -1 ? qIndex : Math.min(qIndex, hIndex);
  return path.substring(0, end);
}

export function resolveImagePath(src, fileDir) {
  if (/^https?:\/\//.test(src)) {
    return null;
  }
  const cleaned = stripQueryAndFragment(src);
  if (cleaned.startsWith("/")) {
    return cleaned;
  }
  const joined = `${fileDir}/${cleaned}`;
  const parts = joined.split("/");
  const resolved = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return `/${resolved.join("/")}`;
}

export function toLocalImageUrl(absolutePath) {
  return `localimage://localhost${absolutePath}`;
}

export function rewritePreviewImages(previewEl, fileDir) {
  const images = previewEl.querySelectorAll("img");
  for (const img of images) {
    const src = img.getAttribute("src");
    if (!src) continue;
    const resolved = resolveImagePath(src, fileDir);
    if (resolved !== null) {
      img.src = toLocalImageUrl(resolved);
    }
  }
}
