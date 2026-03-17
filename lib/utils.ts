import { clsx, type ClassValue } from "clsx";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toMonthKey(date: Date) {
  return format(date, "yyyy-MM");
}

export function monthLabel(date: Date) {
  return format(date, "LLLL yyyy", { locale: es });
}

export function getMonthBounds(date: Date) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
