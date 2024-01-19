import { CLIENT_PUBLIC_PATH, HMR_PORT } from '../constants'
import { Plugin } from '../plugin'
import fs from 'fs-extra'
import path from 'path'
import { ServerContext } from '../server'

export function clientInjectPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'm-vite:client-inject',
    configureServer(_s) {
      serverContext = _s
    },
    resolveId(id) {
      if (id === CLIENT_PUBLIC_PATH) {
        return { id }
      }
      return null
    },
    async load(id) {
      // 加载 hmr 脚本
      if (id === CLIENT_PUBLIC_PATH) {
        const realPath = path.join(
          serverContext.root,
          'node_modules',
          'my-vite',
          'dist',
          'client.mjs',
        )
        const code = await fs.readFile(realPath, 'utf-8')
        return {
          code: code.replace('__HMR_PORT__', JSON.stringify(HMR_PORT)),
        }
      }
    },
    transformIndexHtml(raw) {
      // 插入客户端脚本
      return raw.replace(
        /(<head[^>]*>)/i,
        `$1<script type="module" src="${CLIENT_PUBLIC_PATH}"></script>`,
      )
    },
  }
}
