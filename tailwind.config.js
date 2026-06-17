export default  {
  mode: "jit",
  content: [
    "./index.html",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
    "./src/**/*.js",
    "./src/**/*.jsx",
    "./src/**/*.ts",
    "./src/**/*.tsx",
  ],
  darkMode: "class",
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  safelist: [
    "bg-blue-50",
    "bg-blue-100",
    "bg-blue-500",
    "bg-blue-600",
    "bg-blue-700",
    "bg-blue-800",
    "bg-blue-900",
    "bg-blue-950",
    "dark:bg-blue-950",
    "dark:bg-blue-900",
    "dark:bg-blue-800",
    "dark:bg-blue-700",
    "text-blue-200",
    "text-blue-300",
    "text-blue-400",
    "text-blue-700",
    "text-blue-800",
    "text-gray-200",
    "dark:text-white",
    "dark:text-gray-200",
    "dark:text-gray-300",
    "dark:text-blue-200",
    "dark:text-blue-300",
    "border-blue-200",
    "border-blue-300",
    "border-blue-800",
    "border-blue-700",
    "dark:border-blue-800",
    "dark:border-blue-700",
    "dark:border-blue-600",
    "from-blue-700",
    "to-blue-900",
    "via-blue-800",
    "hover:shadow-lg",
    "hover:-translate-y-0.5",
    "hover:bg-blue-50",
    "hover:bg-blue-900/30",
    "focus:ring-2",
    "ring-2",
    "ring-blue-500/30",
    "focus:ring-2",
    "focus:ring-blue-500/30",
    "border-blue-400",
    "focus:border-blue-400",
    "border-blue-300/40",
    "dark:border-blue-700/40",
    "text-green-700",
    "border-green-200",
    "dark:bg-green-900/30",
    "dark:text-green-300",
    "dark:border-green-800/40",
    "text-red-700",
    "border-red-200",
    "dark:bg-red-900/30",
    "dark:text-red-300",
    "dark:border-red-800/40",
    "border-gray-200",
    "dark:border-gray-700/40",
    "text-blue-600",
    "border-blue-200/60",
    "border-gray-200/60",
    "border-green-200/60",
  ],
  variants: {
    extend: {},
  },
  plugins: [
      require("tailwindcss-animate")
],
};