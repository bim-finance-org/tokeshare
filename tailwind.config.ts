import { title } from "process";
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			titleBold: [
  				'NewOrderBold',
  				'sans-serif'
  			],
  			titleSemibold: [
  				'NewOrderSemibold',
  				'sans-serif'
  			],
  			textRegular: [
  				'RubikRegular',
  				'sans-serif'
  			],
  			textLight: [
  				'RubikLight',
  				'sans-serif'
  			]
  		},
  		colors: {
  			color1: 'hsl(var(--color1))',
  			color2: 'hsl(var(--color2))',
  			color3: 'hsl(var(--color3))',
  			color4: 'hsl(var(--color4))',
  			color5: 'hsl(var(--color5))',
  			color6: 'hsl(var(--color6))',
  			color7: 'hsl(var(--color7))'
  		},
  		blur: {
  			xs: '2px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
