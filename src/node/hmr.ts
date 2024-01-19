

import { ServerContext } from './server'
import {blue, green} from 'picocolors'
import {getShortName, normalizePath} from './utils'

export function bindingHMREvents(serverContext: ServerContext) {
  const {watcher, ws, root} = serverContext
  watcher.on("change",async (file) => {
    console.log(`✨${blue("[hmr]")} ${green(file)} changed`);
    const {moduleGraph} = serverContext
    // 清除模块依赖图中的缓存
    await moduleGraph.invalidateModule(file)
    // 向客户端发送更新消息
    ws.send({
      type: 'update',
      updates: [
        {
          type: 'js-update',
          timestamp: Date.now(),
          path: '/' + getShortName(normalizePath(file), root),
          acceptPath: '/' + getShortName(normalizePath(file), root),
        }
      ]
    })
  })
}