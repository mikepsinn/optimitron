// EGA and VGA color palettes for the Sierra adventure game aesthetic

// EGA 16-color palette (Act I - The Horror)
// Dark, limited, ominous
export const EGA_PALETTE = {
  black: "#000000",
  blue: "#0000aa",
  green: "#00aa00",
  cyan: "#00aaaa",
  red: "#aa0000",
  magenta: "#aa00aa",
  brown: "#aa5500",
  lightGray: "#aaaaaa",
  darkGray: "#555555",
  brightBlue: "#5555ff",
  brightGreen: "#55ff55",
  brightCyan: "#55ffff",
  brightRed: "#ff5555",
  brightMagenta: "#ff55ff",
  yellow: "#ffff55",
  white: "#ffffff",
} as const;

// VGA-inspired palette (Acts II-III - The Quest & Endgame)
// Brighter, more varied, hopeful
export const VGA_PALETTE = {
  // Backgrounds
  bgDeep: "#0a0a1a",
  bgPrimary: "#1a1a2e",
  bgSecondary: "#16213e",
  bgAccent: "#1f3a5f",

  // Primary colors
  blue: "#4a90d9",
  brightBlue: "#64b5f6",
  cyan: "#4dd0e1",
  teal: "#26a69a",

  // Greens (hope, growth)
  green: "#66bb6a",
  brightGreen: "#81c784",
  lime: "#aed581",

  // Warm accents
  gold: "#ffd54f",
  orange: "#ffb74d",
  coral: "#ff8a65",

  // Text
  textPrimary: "#e8e8e8",
  textSecondary: "#b0b0b0",
  textMuted: "#808080",

  // UI
  borderLight: "#3a3a5a",
  borderDark: "#2a2a4a",

  // Status
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
} as const;

// Semantic color mappings for each palette mode
export const PALETTE_SEMANTIC = {
  ega: {
    background: EGA_PALETTE.black,
    foreground: EGA_PALETTE.lightGray,
    primary: EGA_PALETTE.brightBlue,
    secondary: EGA_PALETTE.cyan,
    accent: EGA_PALETTE.yellow,
    danger: EGA_PALETTE.brightRed,
    success: EGA_PALETTE.brightGreen,
    muted: EGA_PALETTE.darkGray,
    border: EGA_PALETTE.darkGray,
    narrator: {
      bg: `linear-gradient(180deg, ${EGA_PALETTE.blue} 0%, ${EGA_PALETTE.black} 100%)`,
      border: EGA_PALETTE.brightBlue,
      text: EGA_PALETTE.white,
    },
    death: EGA_PALETTE.brightRed,
    score: EGA_PALETTE.yellow,
  },
  vga: {
    background: VGA_PALETTE.bgPrimary,
    foreground: VGA_PALETTE.textPrimary,
    primary: VGA_PALETTE.brightBlue,
    secondary: VGA_PALETTE.cyan,
    accent: VGA_PALETTE.gold,
    danger: VGA_PALETTE.error,
    success: VGA_PALETTE.success,
    muted: VGA_PALETTE.textMuted,
    border: VGA_PALETTE.borderLight,
    narrator: {
      bg: `linear-gradient(180deg, ${VGA_PALETTE.bgSecondary} 0%, ${VGA_PALETTE.bgDeep} 100%)`,
      border: VGA_PALETTE.brightBlue,
      text: VGA_PALETTE.textPrimary,
    },
    death: VGA_PALETTE.coral,
    score: VGA_PALETTE.gold,
  },
} as const;

export type PaletteMode = keyof typeof PALETTE_SEMANTIC;
