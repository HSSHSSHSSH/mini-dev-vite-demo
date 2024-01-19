// 此插件用于解析 import 语句中的路径，准确的找的模块

import resolve from 'resolve'
import { Plugin } from '../plugin'
import { ServerContext } from '../server'
import path from 'path'
import { pathExists } from 'fs-extra'
import { DEFAULT_EXTENSIONS } from '../constants'
import { cleanUrl, normalizePath } from '../utils'

export function resolvePlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'm-vite:resolve',
    configureServer(_s) {
      serverContext = _s
    },
    async resolveId(id: string, importer?: string) {
      if (path.isAbsolute(id)) {
        // 绝对路径
        if (await pathExists(id)) {
          return { id }
        }
        id = path.join(serverContext.root, id) // 添加 root 前缀
        if(await pathExists(id)) {
          return { id }
        }
      } else if (id.startsWith('.')) {
        if(!importer) {
          throw new Error('importer is required')
        }
        const hasExtension = path.extname(id).length > 1 // 是否有后缀
        let resolveId: string
        // 文件名包含后缀 如 index.js
        if(hasExtension) {
          resolveId = normalizePath(resolve.sync(id, {basedir: path.dirname(importer)}))
          if(await pathExists(resolveId)) {
            return {id: resolveId}
          }
        } else { // 不包含后缀 如 index
          for(const extname of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${extname}` // 拼接后缀
              resolveId = normalizePath(resolve.sync(withExtension,{
                basedir: path.dirname(importer)
              }))
              if(await pathExists(resolveId)) {
                return {id: resolveId}
              }
            } catch (error) {
              continue
            }
          }
        }
      }
      return null
    },
  }
}
