export default { content: ['./index.html', './src/**/*.{ts,tsx}'],
 theme: { extend: { colors: { ink: '#07080c', panel: '#0e1016', brand: '#7c5cff', lime: '#c6ff3d' },
 fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['"Space Grotesk"', 'Inter', 'sans-serif'] },
 keyframes: { marquee: { to: { transform: 'translateX(-50%)' } }, float: { '50%': { transform: 'translateY(-14px)' } } },
 animation: { marquee: 'marquee 30s linear infinite', float: 'float 6s ease-in-out infinite' } } } }
