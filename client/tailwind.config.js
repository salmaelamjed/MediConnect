// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blue gradient for charts, matching CSS
        "chart-1": {
          DEFAULT: "hsl(221, 83%, 53%)", // Bright blue (desktop)
          dark: "hsl(221, 83%, 63%)", // Lighter for dark mode
        },
        "chart-2": {
          DEFAULT: "hsl(217, 91%, 60%)", // Light blue (mobile)
          dark: "hsl(217, 91%, 70%)",
        },
        "chart-3": {
          DEFAULT: "hsl(212, 95%, 68%)", // Sky blue
          dark: "hsl(212, 95%, 78%)",
        },
        "chart-4": {
          DEFAULT: "hsl(199, 89%, 65%)", // Cyan blue
          dark: "hsl(199, 89%, 75%)",
        },
        "chart-5": {
          DEFAULT: "hsl(204, 94%, 72%)", // Pale blue
          dark: "hsl(204, 94%, 82%)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "hsl(var(--primary-foreground))",
        },
        green_success:{
         DEFAULT:" #10B981",
         foreground:"hsl(var(--green-success-foreground))"
        },
        secondary: {
          DEFAULT: "#2563EB",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
     keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // Add sheet animations to tailwind.config.js
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}

