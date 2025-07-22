/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

/** @type {import("tailwindcss").Config} */ 
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1600px',
        // Breakpoints específicos para móvil
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
      },
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        // Espaciado específico para móvil
        'mobile-xs': '0.375rem', // 6px
        'mobile-sm': '0.5rem',   // 8px  
        'mobile-md': '0.75rem',  // 12px
        'mobile-lg': '1rem',     // 16px
        'mobile-xl': '1.25rem',  // 20px
      },
      minHeight: {
        'screen-safe': 'calc(100vh - 4rem)',
        'touch-target': '44px',
      },
      minWidth: {
        'touch-target': '44px',
      },
      maxWidth: {
        'screen-xl': '1280px',
        'mobile': '100vw',
      },
      fontSize: {
        'mobile-xs': ['0.75rem', { lineHeight: '1.5' }],    // 12px
        'mobile-sm': ['0.875rem', { lineHeight: '1.5' }],   // 14px
        'mobile-base': ['1rem', { lineHeight: '1.5' }],     // 16px
        'mobile-lg': ['1.125rem', { lineHeight: '1.4' }],   // 18px
      },
    }
  },
  darkMode: "class",
  plugins: [require("@tailwindcss/forms")],
}
