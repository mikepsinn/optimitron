import path from "node:path"

export function pinAppNextAuthInstance(config, appDirectory) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "next-auth": path.join(appDirectory, "node_modules/next-auth"),
  }

  return config
}
