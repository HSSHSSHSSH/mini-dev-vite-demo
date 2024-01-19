// 完成预构建
import path from 'path'
import { build } from 'esbuild'
import { green } from 'picocolors'
import { scanPlugin } from './scanPlugin'
import { PRE_BUNDLE_DIR } from '../constants'
import {preBundlePlugin} from './preBundlePlugin'

export async function optimize(root: string) {
  /**
   * 1. 确定入口文件
   * 2. 从入口处扫描依赖项
   * 3. 预构建依赖
   */
  console.log('蛙叫你预构建！！！')
  // 1.
  const entry = path.resolve(root, 'src/main.tsx')
  // 2.
  const deps = new Set<string>()
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)],
  })
  console.log(
    `${green('需要预构建的依赖')}:\n${[...deps]
      .map(green)
      .map((item) => `  ${item}`)
      .join('\n')}`,
  )
  /**
   * 3.
   * 3.1 将代码格式转化为 esm
   * 3.2 将依赖项中的依赖合并在一起，减少 http 请求
   */
  await build({
    entryPoints: [...deps],
    bundle: true,
    write: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)],
  })

}
