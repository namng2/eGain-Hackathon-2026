/**
 * Colors for a gift's illustrated tile. The same title always gets the same
 * colors, so a gift looks the same every time it is shown. Pure, safe in the browser.
 */
export function tileGradient(title: string): { from: string; to: string } {
  let hash = 0;
  for (const char of title.trim().toLowerCase()) {
    hash = (hash * 33 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  const hue = hash % 360;
  // Two nearby hues, light enough that a large emoji stands out on top.
  return {
    from: `hsl(${hue} 80% 88%)`,
    to: `hsl(${(hue + 40) % 360} 75% 74%)`,
  };
}
