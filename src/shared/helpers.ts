export function formatDatetime(dt: Date | null, formatStr: string = "%Y-%m-%d %H:%M:%S"): string {
  if (!dt) return "";
  return dt.toISOString();
}

export function truncateText(text: string, maxLength: number = 100, suffix: string = "..."): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}