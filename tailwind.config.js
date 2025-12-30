/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
      sans: ['font/font-sans', 'sans-serif'],
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
        "button-coloured": {
          DEFAULT: "hsl(var(--button-coloured))",
          foreground: "hsl(var(--button-coloured-foreground))",
        },
        "button-generic": {
          DEFAULT: "hsl(var(--button-generic))",
          foreground: "hsl(var(--button-generic-foreground))",
        },
        "foundation-beige": {
          DEFAULT:"hsl(var(--foundation-beige))",
        },
        "base-background":"#FAFAF9",
        "black-primary": "#1C1917",
        "dark-grey": "#050505",
        "dark-grey-2": "#06030E",
        "grey-primary": "#737373",
        "grey-2": "#57534D",
        "grey-3":"#D6D3D1",
        "grey-4":"#677084",
        "light-grey": "#F3F3F5",
        "light-grey-2": "#F5F5F5",
        "light-grey-3": "#E5E5E5",
        "light-yellow": "#FEF3C6",
        "dark-blue":"#041E42",
        // "yellow":"#FED22F",
        "brown": "#7B3306",
        "dark-blue":"#041E42",
        "green-primary": "#00A63E",
        "green-2": "#B9F8CF",
        "green-3": "#F0FDF4",
        "green-4": "#DCFCE7",
        "dark-green": "#0D542B",
        "beige": "#E1CAA1",
        "beige-2": "#F6EEE3",
        "golden": "#E8D1AB",
      }
    },
  },
  plugins:[]
  // plugins: [require("daisyui")],
  // daisyui: {
  //   themes: ["light", "dark"],
  // },
};
