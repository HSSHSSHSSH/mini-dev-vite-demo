import {
  LoadResult,
  PartialResolvedId,
  SourceDescription,
  PluginContext as RollupPluginContext,
  ResolvedId,
} from 'rollup'
import { Plugin } from './plugin'

export interface PluginContainer {
  resolveId(id: string, importer?: string): Promise<PartialResolvedId | null>
  load(id: string): Promise<LoadResult | null>
  transform(code: string, id: string): Promise<SourceDescription>
}

// 模拟 rollup 的插件机制
export const createPluginContainer = (plugins: Plugin[]): PluginContainer => {
  // @ts-ignore
  class Context implements RollupPluginContext {
    async resolve(id: string, importer?: string) {
      let out = await pluginContainer.resolveId(id, importer)
      if (typeof out === 'string') out = { id: out }
      return null
    }
  }

  const pluginContainer: PluginContainer = {
    // 依次调用 plugin 的 resolveId 方法，直到有返回值
    async resolveId(id: string, importer?: string) {
      const ctx = new Context() as any
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const newId = await plugin.resolveId.call(ctx as any, id, importer)
          if(newId) {
            id = typeof newId === 'string' ? newId : newId.id
            return {id}
          }
        }
      }
      return null
    },
    // 依次调用 plugin 的 load 方法，直到有返回值
    async load(id) {
      const ctx = new Context() as any
      for(const plugin of plugins) {
        if(plugin.load) {
          const result = await plugin.load.call(ctx as any, id)
          if(result) {
            return result
          }
        }
      }
    },
    // 依次调用 plugin 的 transform 方法，直到有返回值
    async transform(code, id) {
      const ctx = new Context() as any
      for(const plugin of plugins) {
        if(plugin.transform) {
          const result = await plugin.transform.call(ctx as any, code, id)
          if(!result) continue
          if(typeof result === 'string') {
            code = result
          } else if(result.code) {
            code = result.code
          }
        }
      }
      return {code}
    }
  }

  return pluginContainer
}
