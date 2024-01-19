import connect from 'connect'

import { blue, green } from 'picocolors'

import { optimize } from '../optimizer'
import { resolvePlugins } from '../plugins'
import { createPluginContainer, PluginContainer } from '../pluginContainer'
import { Plugin } from '../plugin'
import { IndexHtmlMiddleware } from './middlewares/indexHtml'
import { transformMiddleware } from './middlewares/transform'
import { staticMiddleware } from './middlewares/static'
import { ModuleGraph } from '../moduleGraph'
import chokidar, { FSWatcher } from 'chokidar'
import { createWebSocketServer } from '../ws'
import {bindingHMREvents} from '../hmr'
import {normalizePath} from '../utils'

export interface ServerContext {
  root: string
  pluginContainer: PluginContainer
  app: connect.Server
  plugins: Plugin[]
  moduleGraph: ModuleGraph,
  ws: {
    send: (data: any) => void
    close: () => void
  },
  watcher: FSWatcher
}

export async function startDevServer() {
  const app = connect()
  const ws = createWebSocketServer(app)
  const root = process.cwd()
  console.log(blue(`Serving ${root}`))
  const startTime = Date.now()
  const plugins = resolvePlugins()
  const pluginContainer = createPluginContainer(plugins)
  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url))
  const watcher = chokidar.watch(root, {
    ignored: ["**/node_modules/**", "**/.git/**"],
    ignoreInitial: true,
  })  
  const serverContext: ServerContext = {
    root: normalizePath(process.cwd()),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher
  }

  bindingHMREvents(serverContext)

  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext)
    }
  }
  // 核心编译
  app.use(transformMiddleware(serverContext))
  // 入口 html 编译
  app.use(IndexHtmlMiddleware(serverContext))
  // 静态文件的处理
  app.use(staticMiddleware(serverContext.root))
  app.listen(3000, async () => {
    await optimize(root) // 预构建
    console.log(green(`Server started in ${Date.now() - startTime}ms`))
    console.log(blue(`Server running at http://localhost:3000`))
  })
}
