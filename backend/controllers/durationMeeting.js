function formatDurationMs(ms) {
  if (ms == null || isNaN(ms)) return "";
  ms = Math.abs(Math.floor(ms));

  const hours = Math.floor(ms / 3600000);
  ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000);
  ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}min`);
  if (hours === 0 && minutes === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ") || "0s";
}

export default function formatDurationFromISOs(isoStart, isoEnd) {
  const t1 = Date.parse(isoStart);
  const t2 = Date.parse(isoEnd);
  if (isNaN(t1) || isNaN(t2)) return "";
  return formatDurationMs(t2 - t1);
}
