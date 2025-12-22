/**
 * 构建脚本
 * 使用 esbuild 将模块化代码打包成单文件 _worker.js
 */

import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 自定义插件：加载 .html 和 .py 文件为字符串
const textLoaderPlugin = {
    name: 'text-loader',
    setup(build) {
        // 处理 .html 文件
        build.onLoad({ filter: /\.html$/ }, async (args) => {
            const content = await fs.promises.readFile(args.path, 'utf8');
            return {
                contents: `export default ${JSON.stringify(content)};`,
                loader: 'js'
            };
        });

        // 处理 .py 文件
        build.onLoad({ filter: /\.py$/ }, async (args) => {
            const content = await fs.promises.readFile(args.path, 'utf8');
            return {
                contents: `export default ${JSON.stringify(content)};`,
                loader: 'js'
            };
        });
    }
};

async function build() {
    try {
        await esbuild.build({
            entryPoints: ['src/index.js'],
            bundle: true,
            outfile: '_worker.js',
            format: 'esm',
            target: 'es2022',
            platform: 'browser',
            minify: false, // 保持可读性，方便调试
            plugins: [textLoaderPlugin],
            banner: {
                js: `/**
 * HuggingFace Proxy Worker
 * 构建时间: ${new Date().toISOString()}
 * 
 * 此文件由 build.js 自动生成，请勿手动编辑
 * 源代码位于 src/ 目录
 */
`
            }
        });
        
        console.log('✅ 构建成功: _worker.js');
        
        // 显示文件大小
        const stats = fs.statSync('_worker.js');
        console.log(`📦 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
        
    } catch (error) {
        console.error('❌ 构建失败:', error);
        process.exit(1);
    }
}

build();
