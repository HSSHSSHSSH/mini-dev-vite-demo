// 此插件用于将 JS/TS/JSX/TSX 文件编译为浏览器可识别的代码,核心时使用 esbuild 的 Transform API

import {readFile} from 'fs-extra'
import {Plugin} from '../plugin'
import {isJSRequest} from '../utils'
import esbuild from 'esbuild'
import path from 'path'



export function esbuildTransformPlugin(): Plugin {
  return {
    name: 'm-vite:esbuild-transform',
    async load(id) {
      if(isJSRequest(id)) {
        try {
          const code = await readFile(id, 'utf-8')
          return code
        } catch (e) {
          console.log('在esbuildTransformPlugin中的load出错',e)
          return null
        }
      }
    },
    async transform(code, id) {
      if(isJSRequest(id)) {
        const extname = path.extname(id).slice(1)
        const {code: transformedCode, map} = await esbuild.transform(code, {
          target: 'esnext',
          format:'esm',
          sourcemap: true,
          loader: extname as "js" | "jsx" | "ts" |"tsx",
        })
        return {
          code: transformedCode,
          map,
        }
      }
      return null;
    }
  }
}