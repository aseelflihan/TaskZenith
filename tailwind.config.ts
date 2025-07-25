import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
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
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			shimmer: {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			fadeIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'border-glow': {
  				'0%': {
  					'border-color': 'hsl(var(--primary) / 0.6)',
  					'box-shadow': '0 0 8px hsl(var(--primary) / 0.3)'
  				},
  				'25%': {
  					'border-color': 'hsl(var(--accent) / 0.8)',
  					'box-shadow': '0 0 12px hsl(var(--accent) / 0.4)'
  				},
  				'50%': {
  					'border-color': 'hsl(var(--secondary) / 0.7)',
  					'box-shadow': '0 0 16px hsl(var(--secondary) / 0.5)'
  				},
  				'75%': {
  					'border-color': 'hsl(var(--accent) / 0.8)',
  					'box-shadow': '0 0 12px hsl(var(--accent) / 0.4)'
  				},
  				'100%': {
  					'border-color': 'hsl(var(--primary) / 0.6)',
  					'box-shadow': '0 0 8px hsl(var(--primary) / 0.3)'
  				}
  			},
  			'radial-glow': {
  				'0%': {
  					'box-shadow': '0 0 0 0 hsl(var(--primary) / 0.7), 0 0 20px hsl(var(--primary) / 0.4), inset 0 0 20px hsl(var(--primary) / 0.1)'
  				},
  				'25%': {
  					'box-shadow': '0 0 0 3px hsl(var(--accent) / 0.6), 0 0 30px hsl(var(--accent) / 0.5), inset 0 0 25px hsl(var(--accent) / 0.15)'
  				},
  				'50%': {
  					'box-shadow': '0 0 0 6px hsl(var(--secondary) / 0.5), 0 0 40px hsl(var(--secondary) / 0.6), inset 0 0 30px hsl(var(--secondary) / 0.2)'
  				},
  				'75%': {
  					'box-shadow': '0 0 0 3px hsl(var(--accent) / 0.6), 0 0 30px hsl(var(--accent) / 0.5), inset 0 0 25px hsl(var(--accent) / 0.15)'
  				},
  				'100%': {
  					'box-shadow': '0 0 0 0 hsl(var(--primary) / 0.7), 0 0 20px hsl(var(--primary) / 0.4), inset 0 0 20px hsl(var(--primary) / 0.1)'
  				}
  			},
  			'gradient-spin': {
  				'0%': {
  					'background': 'conic-gradient(from 0deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.9), hsl(var(--secondary) / 0.8), hsl(var(--destructive) / 0.7), hsl(var(--primary) / 0.8))'
  				},
  				'100%': {
  					'background': 'conic-gradient(from 360deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.9), hsl(var(--secondary) / 0.8), hsl(var(--destructive) / 0.7), hsl(var(--primary) / 0.8))'
  				}
  			},
  			'press-down': {
  				'0%': { transform: 'scale(1)' },
  				'50%': { transform: 'scale(0.97)' },
  				'100%': { transform: 'scale(1)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			shimmer: 'shimmer 2s infinite',
  			fadeIn: 'fadeIn 0.6s ease-in-out forwards',
  			'border-glow': 'border-glow 3s ease-in-out infinite',
  			'radial-glow': 'radial-glow 3s ease-in-out infinite',
  			'gradient-spin': 'gradient-spin 4s linear infinite',
  			'press-down': 'press-down 0.15s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
