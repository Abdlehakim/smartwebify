import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      // Existing breakpoints (you can keep or modify them as needed)
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      // Custom 2xl breakpoint
      '2xl': '1600px', // Changed from the default 1536px
    },
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        starsCard: 'var(--color-starsCard)',
        productNameCard: 'var(--color-productNameCard)',
        HomePageTitles: 'var(--color-HomePageTitles)',
      }
    },
  },
  plugins: [],
} satisfies Config;
