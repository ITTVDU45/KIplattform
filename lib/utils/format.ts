export function formatNumber(num: number, locale = "de-DE"): string {
  return num.toLocaleString(locale);
}

export function formatCurrency(amount: number, locale = "de-DE", currency = "EUR"): string {
  return amount.toLocaleString(locale, {
    style: "currency",
    currency,
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
