import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
        // 1. Primary Brand Accents (Terracotta)
        terracotta: {
          DEFAULT: "#E85D24",
          hover: "#D44E18",
          light: "#FFF4EF",
          subtle: "#FAF0E9",
          glow: "rgba(232, 93, 36, 0.16)",
        },
        // 2. Neutral Backgrounds (Warm Ivory & White)
        cream: {
          warm: "#FFFCF7",
          alt: "#FAF5EE",
          darker: "#F2ECE1",
          card: "#FFFFFF",
          cardSubtle: "#FDFBF8",
        },
        ivory: {
          DEFAULT: "#FFFCF7",
          warm: "#FFFCF7",
          alt: "#FAF5EE",
          darker: "#F2ECE1",
          card: "#FFFFFF",
          cardSubtle: "#FDFBF8",
        },
        // 3. Typography & Text Hierarchy
        charcoal: {
          DEFAULT: "#142B43",
          body: "#142B43",
          secondary: "#63768A",
          muted: "#8898AA",
        },
        navy: {
          DEFAULT: "#142B43",
          deep: "#142B43",
          heading: "#142B43",
          muted: "#2C435A",
          light: "#F0F5FA",
        },
        slateText: {
          DEFAULT: "#63768A",
          muted: "#8898AA",
        },
        // 4. Secondary & Functional Accents
        sage: {
          DEFAULT: "#2E9B65",
          light: "#EAF7F0",
        },
        successGreen: {
          DEFAULT: "#2E9B65",
          light: "#EAF7F0",
        },
        amberAccent: {
          DEFAULT: "#D9822B",
          light: "#FEF7ED",
        },
        purpleAccent: {
          DEFAULT: "#8B5CF6",
          light: "#F5F3FF",
        },
        skyAccent: {
          DEFAULT: "#38BDF8",
          light: "#F0F9FF",
        },
        lavenderAccent: {
          DEFAULT: "#8B5CF6",
          light: "#F5F3FF",
        },
        // 5. Borders & Dividers (Warm Beige & Gray)
        beige: {
          DEFAULT: "#EAE5DE",
          light: "#F2EFEB",
          dark: "#DDD6CD",
          accent: "rgba(232, 93, 36, 0.3)",
        },
        warmBorder: {
          DEFAULT: "#EAE5DE",
          light: "#F2EFEB",
          dark: "#DDD6CD",
          accent: "rgba(232, 93, 36, 0.3)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
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
    },
  },
  plugins: [],
} satisfies Config
