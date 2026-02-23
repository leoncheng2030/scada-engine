import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import prefixSelector from 'postcss-prefix-selector'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

const banner = `/*!
 * @nywqs/scada-engine v${pkg.version}
 * Copyright (c) 2025 leoncheng
 * Licensed under proprietary license - see LICENSE file
 * Contact: nywqs@outlook.com
 */`

export default defineConfig(({ command }) => {
	const isDev = command === 'serve'
	
	return {
		plugins: [
			vue(),
			dts({
				include: ['src/**/*.ts', 'src/**/*.vue'],
				outDir: 'dist',
				insertTypesEntry: true,
				cleanVueFileName: true,
				// 忽略 Vue 组件的类型声明警告
				logLevel: 'silent',
				compilerOptions: {
					skipLibCheck: true,
					noEmitOnError: false,
					// @ts-ignore 警告
					suppressWarnings: true,
					// 忽略 TS4094 错误
					suppressExcessPropertyErrors: true
				}
			})
		],
		resolve: {
			alias: {
				'@': resolve(__dirname, 'src')
			}
		},
		server: {
			port: 3000,
			host: '0.0.0.0'
		},
		css: {
			postcss: {
				plugins: [
					prefixSelector({
						prefix: '[data-scada-theme]',
						transform: (prefix, selector, prefixedSelector) => {
							// 排除基础全局选择器(html, body, #app)
							if (selector.match(/^(html|body|#app)([s,]|$)/)) {
								return selector
							}
							// 如果选择器已包含 data-scada-theme,直接返回
							if (selector.includes('[data-scada-theme')) {
								return selector
							}
							// 排除 scoped 样式(包含 data-v- 的选择器)
							if (selector.includes('[data-v-')) {
								return selector
							}
							// .scada-layout 本身及其子选择器不需要添加前缀
							if (selector.includes('.scada-layout')) {
								return selector
							}
							// X6 相关样式已经在 style.css 中手动处理，不需要前缀
							if (selector.startsWith('.x6-')) {
								return selector
							}
							// 其他全局样式添加前缀
							return prefixedSelector
						}
					})
				]
			}
		},
		build: {
			// 生产模式：构建库
			lib: {
				entry: resolve(__dirname, 'src/index.ts'),
				name: 'ScadaEngine',
				fileName: (format) => `scada-engine.${format}.js`,
				formats: ['es', 'umd']
			},
			worker: {
				format: 'es',
				rollupOptions: {
					output: {
						banner
					}
				}
			},
			rollupOptions: {
				// 外部化依赖，不打包进库
				external: ['vue', 'vue-router', '@antv/x6', '@antv/x6-plugin-selection', '@antv/x6-plugin-snapline', 'echarts', 'pinia', '@vueuse/core'],
				output: {
					exports: 'named',
					// 添加版权信息
					banner,
					// 为外部化的依赖提供全局变量
					globals: {
						vue: 'Vue',
						'vue-router': 'VueRouter',
						'@antv/x6': 'X6',
						'@antv/x6-plugin-selection': 'X6PluginSelection',
						'@antv/x6-plugin-snapline': 'X6PluginSnapline',
						echarts: 'echarts',
						pinia: 'Pinia',
						'@vueuse/core': 'VueUse'
					},
					// 导出 CSS
					assetFileNames: (assetInfo) => {
						if (assetInfo.name === 'style.css') {
							return 'scada-engine.css'
						}
						return assetInfo.name || ''
					}
				}
			}
		}
	}
})
