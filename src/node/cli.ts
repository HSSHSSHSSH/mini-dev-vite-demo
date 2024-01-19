// 初始化 cli

import cac from "cac";
import { startDevServer } from './server'

const cli = cac()

cli
  .command("[root]", "Run the development server")
  .alias("server")
  .alias("dev")
  .action(async () => {
    await startDevServer()
  })

cli.help()

cli.parse()
