import path from 'path'
import type { Config } from '../types'

const getUserConfig = async (): Promise<Config> => {
  const filename = '.scaffed/config.js'
  const cwd = process.cwd()
  const filePath = path.join(cwd, filename)

  let config: Config = {} as Config

  try {
    config = await import(filePath)
  } catch (err) {
    throw Error(`Failed to load config file ${filePath}: ${err}`)
  }

  if (!config) throw Error('Empty config file detected!')
  return config
}

export default getUserConfig
