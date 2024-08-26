import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

const pathResolve = (dir: string) => {
	return resolve(__dirname, '.', dir)
}

// https://vitejs.dev/config/
export default defineConfig({
	base: '',
	plugins: [vue(), vueJsx()],
	resolve: {
		alias: {
			// '/@': pathResolve('./src/')
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	server: {
		host: '0.0.0.0'
	}
})
