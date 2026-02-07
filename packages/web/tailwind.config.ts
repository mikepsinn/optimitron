import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Neobrutalist color tokens (matching dih-earth)
        "brutal-pink": "rgb(var(--brutal-pink))",
        "brutal-pink-foreground": "rgb(var(--brutal-pink-foreground))",
        "brutal-cyan": "rgb(var(--brutal-cyan))",
        "brutal-cyan-foreground": "rgb(var(--brutal-cyan-foreground))",
        "brutal-yellow": "rgb(var(--brutal-yellow))",
        "brutal-yellow-foreground": "rgb(var(--brutal-yellow-foreground))",
        "brutal-red": "rgb(var(--brutal-red))",
        "brutal-red-foreground": "rgb(var(--brutal-red-foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Hard neobrutalist shadows (matching dih-earth shadow system)
        brutal: "var(--shadow-x) var(--shadow-y) var(--shadow-blur) var(--shadow-spread) var(--shadow-color)",
        "brutal-sm": "calc(var(--shadow-x) * 0.5) calc(var(--shadow-y) * 0.5) var(--shadow-blur) var(--shadow-spread) var(--shadow-color)",
        "brutal-lg": "calc(var(--shadow-x) * 1.5) calc(var(--shadow-y) * 1.5) var(--shadow-blur) var(--shadow-spread) var(--shadow-color)",
        "brutal-xl": "calc(var(--shadow-x) * 2) calc(var(--shadow-y) * 2) var(--shadow-blur) var(--shadow-spread) var(--shadow-color)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
