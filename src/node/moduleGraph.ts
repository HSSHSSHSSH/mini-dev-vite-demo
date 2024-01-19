import { PartialResolvedId, TransformResult } from 'rollup'
import { cleanUrl } from './utils'

export class ModuleNode {
  url: string;
  id: string | null = null;
  importers = new Set<ModuleNode>(); // 依赖当前模块的模块
  importedModules = new Set<ModuleNode>(); // 当前模块依赖的模块
  transformResult: TransformResult | null = null;
  lastHMRTimestamp = 0;
  constructor(url: string) {
    this.url = url
  }
}


export class ModuleGraph {
  urlToModuleMap = new Map<string, ModuleNode>();
  idToModuleMap = new Map<string, ModuleNode>();
  constructor(
    private resolveId:(url: string) => Promise<PartialResolvedId | null>
  ){}

  private async _resolve(url: string): Promise<{url: string, resolvedId: string}> {
    const resolved = await this.resolveId(url)
    const resolvedId = resolved?.id || url
    return {
      url,
      resolvedId
    }
  }

  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(id)
  }

  async getModuleByUrl(rawUrl: string): Promise<ModuleNode | undefined> {
    const {url} = await this._resolve(rawUrl)
    return this.urlToModuleMap.get(url)
  }

  
  async ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode> {
    const {url, resolvedId} = await this._resolve(rawUrl)
    if(this.urlToModuleMap.has(url)) {
      return this.urlToModuleMap.get(url) as ModuleNode
    }
    const mod = new ModuleNode(url)
    mod.id = resolvedId
    this.urlToModuleMap.set(url, mod)
    this.idToModuleMap.set(resolvedId, mod)
    return mod
  }

  // 更新模块信息
  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>
  ) {
    const prevImports = mod.importedModules
    for(const curImports of importedModules) {
      const dep = 
        typeof curImports === 'string'
        ? await this.ensureEntryFromUrl(curImports)
        : curImports
      if(dep) {
        mod.importedModules.add(dep)
        dep.importers.add(mod)
      }
    }
    // 清除不再引用的依赖
    for(const prevImport of prevImports){
      if(!importedModules.has(prevImport.url)) {
        prevImport.importers.delete(mod)
      }
    }
  }

  invalidateModule(file: string) {
    const mod = this.idToModuleMap.get(file)
    if(mod) {
      mod.lastHMRTimestamp = Date.now()
      mod.transformResult = null
      mod.importers.forEach((importer) => {
        this.invalidateModule(importer.id! as string)
      })
    }
  }

}