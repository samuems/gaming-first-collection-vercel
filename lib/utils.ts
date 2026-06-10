import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Extract a leading emoji from a theme label, e.g. "🏈 Quarterback" → { emoji: "🏈", text: "Quarterback" }
export function parseAffinityLabel(label: string): { emoji: string | null; text: string } {
  const m = label.match(/^(\p{Extended_Pictographic})\s*/u)
  if (m) return { emoji: m[1], text: label.slice(m[0].length).trim() }
  return { emoji: null, text: label }
}
