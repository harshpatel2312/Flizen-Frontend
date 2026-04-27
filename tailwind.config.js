/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-tertiary-fixed": "#1b1b1c",
        "surface-container-lowest": "#0e0e0e",
        "on-secondary": "#002c71",
        "primary-fixed-dim": "#c6c6c7",
        "on-tertiary": "#303030",
        "surface-tint": "#c6c6c7",
        "inverse-surface": "#e5e2e1",
        "secondary-container": "#0460e3",
        "surface-dim": "#141313",
        "on-background": "#e5e2e1",
        "surface-variant": "#353434",
        "primary-container": "#e2e2e2",
        "on-secondary-container": "#e2e7ff",
        "inverse-primary": "#5d5f5f",
        "on-primary-container": "#636565",
        "tertiary-fixed": "#e5e2e1",
        "secondary": "#b1c5ff",
        "tertiary-container": "#e5e2e1",
        "surface": "#141313",
        "on-tertiary-fixed-variant": "#474746",
        "tertiary-fixed-dim": "#c8c6c5",
        "on-secondary-fixed-variant": "#00419f",
        "on-primary-fixed": "#1a1c1c",
        "inverse-on-surface": "#313030",
        "on-error": "#690005",
        "secondary-fixed-dim": "#b1c5ff",
        "secondary-fixed": "#dae2ff",
        "surface-container-highest": "#353434",
        "on-surface": "#e5e2e1",
        "on-error-container": "#ffdad6",
        "surface-container-low": "#1c1b1b",
        "on-surface-variant": "#c4c7c8",
        "tertiary": "#ffffff",
        "on-primary-fixed-variant": "#454747",
        "surface-bright": "#3a3939",
        "surface-container": "#201f1f",
        "on-tertiary-container": "#656464",
        "outline": "#8e9192",
        "on-secondary-fixed": "#001947",
        "error": "#ffb4ab",
        "primary-fixed": "#e2e2e2",
        "surface-container-high": "#2a2a2a",
        "outline-variant": "#444748",
        "error-container": "#93000a",
        "primary": "#ffffff",
        "background": "#141313",
        "on-primary": "#2f3131"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "section-gap": "40px",
        "unit": "8px",
        "gutter": "16px",
        "container-margin": "24px",
        "element-gap": "12px"
      },
      fontFamily: {
        "label-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Plus Jakarta Sans", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"]
      },
      fontSize: {
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }]
      },
      keyframes: {
        dash: {
          to: {
            strokeDashoffset: '-1000'
          }
        }
      },
      animation: {
        dash: 'dash 20s linear infinite'
      }
    }
  },
  darkMode: "class",
  plugins: [],
}
