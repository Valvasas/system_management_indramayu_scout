import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.css',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-dm-sans)', 'var(--font-inter)', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        surface: {
          base: 'var(--surface-base)',
          raised: 'var(--surface-raised)',
          subtle: 'var(--surface-subtle)',
          sunken: 'var(--surface-sunken)',
          inverse: 'var(--surface-inverse)',
          scrim: 'var(--surface-scrim)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
          'on-brand': 'var(--text-on-brand)',
          accent: 'var(--accent-text)',
        },
        action: {
          primary: 'var(--action-primary)',
          'primary-hover': 'var(--action-primary-hover)',
          'primary-active': 'var(--action-primary-active)',
          secondary: 'var(--action-secondary)',
          'secondary-hover': 'var(--action-secondary-hover)',
          'secondary-text': 'var(--action-secondary-text)',
          danger: 'var(--action-danger)',
          'danger-hover': 'var(--action-danger-hover)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
          brand: 'var(--border-brand)',
        },
        focus: {
          ring: 'var(--focus-ring)',
          inverse: 'var(--focus-ring-inverse)',
        },
        status: {
          'info-surface': 'var(--status-info-surface)',
          'info-text': 'var(--status-info-text)',
          'info-border': 'var(--status-info-border)',
          'success-surface': 'var(--status-success-surface)',
          'success-text': 'var(--status-success-text)',
          'success-border': 'var(--status-success-border)',
          'warning-surface': 'var(--status-warning-surface)',
          'warning-text': 'var(--status-warning-text)',
          'warning-border': 'var(--status-warning-border)',
          'danger-surface': 'var(--status-danger-surface)',
          'danger-text': 'var(--status-danger-text)',
          'danger-border': 'var(--status-danger-border)',
          'neutral-surface': 'var(--status-neutral-surface)',
          'neutral-text': 'var(--status-neutral-text)',
          'neutral-border': 'var(--status-neutral-border)',
        },
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
        neutral: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
        },
      },
      spacing: {
        'section-primary': 'var(--section-y-primary)',
        'section-secondary': 'var(--section-y-secondary)',
        // Target sentuh minimum WCAG 2.2 / standar internal (44px)
        touch: '2.75rem',
      },
      minHeight: {
        touch: '2.75rem',
      },
      minWidth: {
        touch: '2.75rem',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.25rem',
        pill: '999px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        dialog: 'var(--shadow-dialog)',
      },
      maxWidth: {
        prose: '65ch',
      },
    },
  },
  plugins: [],
}
export default config
