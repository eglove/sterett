const {nextui} = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'./node_modules/@nextui-org/**/dist/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		extend: {},
	},
	plugins: [
		require('@tailwindcss/typography'),
		nextui()
	],
}
