// 扫描依赖项
import { Plugin } from 'esbuild'
import { BARE_IMPORT_RE, EXTERNAL_TYPES } from '../constants'

export function scanPlugin(deps: Set<string>): Plugin {
  return {
    name: 'scan-plugin',
    setup(build) {
      // 忽略文件夹的类型
      build.onResolve(
        { filter: new RegExp(`\\.(${EXTERNAL_TYPES.join("|")})$`) },
        (resolveInfo) => {
          return {
            path: resolveInfo.path,
            external: true,
          }
        }
      ),
      // 记录依赖项
      build.onResolve(
        {filter: BARE_IMPORT_RE}, // 裸导入
        (resolveInfo) => {
          const { path: id } = resolveInfo
          deps.add(id)
          return {
            path: id,
            external: true,
          }
        }
      ) 
    }
  }
}