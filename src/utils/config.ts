import path from 'path'
import type { Config } from '../types'

const getUserConfig = async (): Promise<Config> => {
  const filePath = path.join(process.cwd(), '.scaffed', 'config.js')

  let config: Config = {} as Config

  try {
    config = (await import(filePath)).default
  } catch (err) {
    throw Error(`Failed to load config file ${filePath}: ${err}`)
  }

  if (!Object.keys(config).length) throw Error('Empty config file detected!')
  return config
}

export default getUserConfig
