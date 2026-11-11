// Presentation promotions and video navigation do not belong in study notes.
export function cleanNoteExtras(html) {
  return html
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, figure =>
      figure.includes('b2f05667a52866d3d9bc6dca') ? '' : figure)
    .replace(/<p\b[^>]*class="[^"]*\bslide-timestamp\b[^"]*"[^>]*>[\s\S]*?<\/p>/gi, '')
    .replace(/<a\b[^>]*>\s*\d+(?::\d{2}){1,2}\s+in the video\s*<\/a>/gi, '');
}
