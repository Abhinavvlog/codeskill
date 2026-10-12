import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes constraints input (multiline string or array) into an array of clean string constraints.
 * Splits on newline characters, trims whitespace from each line, and removes empty lines.
 */
export function formatConstraints(constraints: string | string[] | null | undefined): string[] {
  if (!constraints) return [];
  if (Array.isArray(constraints)) {
    return constraints
      .map((c) => (typeof c === "string" ? c.trim() : String(c).trim()))
      .filter(Boolean);
  }
  if (typeof constraints === "string") {
    return constraints
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}
