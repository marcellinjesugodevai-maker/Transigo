/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                primary: { DEFAULT: '#FF6B00', dark: '#E55A00', light: '#FF8A3D' },
                secondary: { DEFAULT: '#00C853', dark: '#00A344', light: '#4ADE80' },
            },
            fontFamily: { sans: ['Poppins', 'sans-serif'] },
        },
    },
    plugins: [],
};
