

import {NextHandleFunction} from 'connect'
import {
  isJSRequest,
  cleanUrl,
  isCSSRequest,
  isImportRequest
} from '../../utils'

import { ServerContext } from '../index'
import createDebug from 'debug'


const debug = createDebug("dev")

export async function transformRequest (
  url: string,
  serverContext: ServerContext
) {
  const { pluginContainer, moduleGraph } = serverContext
  url = cleanUrl(url)
  let mod = await moduleGraph.getModuleByUrl(url)
  if(mod && mod.transformResult) { // 如果已经有了 transformResult，直接返回
    return mod.transformResult
  } 
  const resolvedResult = await pluginContainer.resolveId(url)
  let transformResult
  if(resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id)
    if(typeof code === 'object' && code !== null) {
      code = code.code
    }
    mod = await moduleGraph.ensureEntryFromUrl(url);
    if(code) {
      transformResult = await pluginContainer.transform(code, resolvedResult.id)
    }
  }
  if(mod) {
    mod.transformResult = transformResult
  }
  return transformResult
}


export function transformMiddleware(
  serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if(req.method !== 'GET' || !req.url) {
      return next()
    }
    const url = req.url
    debug('transformMiddleware: %s', url)
    // 处理 js 请求
    if(isJSRequest(url) || isCSSRequest(url) || isImportRequest(url)) {
      let result: any = await transformRequest(url, serverContext)
      if(!result) {
        return next()
      }
      if(result && typeof result !== 'string') {
        result = result.code
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/javascript')
      return res.end(result)
    }
    return next()
  }
}