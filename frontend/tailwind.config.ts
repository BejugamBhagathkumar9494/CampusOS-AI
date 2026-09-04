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
          DEFAULT: "#C85A32",
          hover: "#B44E27",
          light: "#FDF2ED",
          subtle: "#FAF0E9",
          glow: "rgba(200, 90, 50, 0.16)",
        },
        // 2. Neutral Backgrounds (Warm Cream & White)
        cream: {
          warm: "#FAF7F2",
          alt: "#F4EFEA",
          darker: "#EFE8DF",
          card: "#FFFFFF",
          cardSubtle: "#FDFBF8",
        },
        // 3. Typography & Text Hierarchy (Charcoal & Warm Greys)
        charcoal: {
          DEFAULT: "#1C211F",
          body: "#2D3330",
          secondary: "#5E6763",
          muted: "#8E9893",
        },
        // 4. Secondary & Functional Accents
        sage: {
          DEFAULT: "#5E8C71",
          light: "#F0F6F2",
        },
        amberAccent: {
          DEFAULT: "#D9822B",
          light: "#FEF7ED",
        },
        navy: {
          DEFAULT: "#3D5A80",
          light: "#EEF3F8",
        },
        purpleAccent: {
          DEFAULT: "#786498",
          light: "#F4F1F8",
        },
        // 5. Borders & Dividers (Warm Beige)
        beige: {
          DEFAULT: "#EAE3D8",
          light: "#F3ECE2",
          dark: "#DCD2C3",
          accent: "rgba(200, 90, 50, 0.3)",
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
