import { DEFAULT_CURRENCY } from "@/lib/constants";

export function formatCurrency(
  value: number,
  currency = DEFAULT_CURRENCY,
  locale = "es-ES",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
