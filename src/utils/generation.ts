import fs from 'fs'
import chalk from 'chalk'
import path from 'path'
import type { Args, FileOpts } from '../types'
import getUserConfig from './config'

export const addComponentDirectory = (directoryName: string, dirsAdded: string[]): void => {
  fs.mkdirSync(directoryName)
  dirsAdded.push(directoryName)
}

export const rollbackChanges = (dirsAdded: string[]): void => {
  dirsAdded.forEach((dirName: string) => {
    if (fs.existsSync(dirName)) fs.rmdirSync(dirName, { recursive: true })
  })
}

export const outputFiles = (
  files: FileOpts[],
  componentName: string,
  componentsDir: string,
): void => {
  files.forEach(({ fileName, subDirName, template }: FileOpts) => {
    let newComponentsDir = componentsDir

    if (subDirName) {
      newComponentsDir = path.join(newComponentsDir, subDirName)
      if (!fs.existsSync(newComponentsDir)) fs.mkdirSync(newComponentsDir)
    }

    const parsedFilename = fileName.replace('[componentName]', componentName)
    const outputFilename = path.join(newComponentsDir, parsedFilename)

    if (!fs.existsSync(outputFilename)) {
      const parsedTemplate = template(componentName)
      fs.writeFileSync(outputFilename, parsedTemplate)
    }
  })
}

const generate = async (args: Args): Promise<void> => {
  const componentNames: string[] = args.n
  const dirsAdded: string[] = []

  try {
    const config = await getUserConfig(args.c)
    const { componentsDir, files } = config

    componentNames.forEach((componentName: string) => {
      const outputDir = path.join(process.cwd(), componentsDir, componentName)

      if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true })

      if (!fs.existsSync(outputDir)) {
        addComponentDirectory(outputDir, dirsAdded)
        outputFiles(files, componentName, outputDir)
      } else {
        console.log(chalk.yellow(`Warning: ${outputDir} already exists, skipping.`))
      }
    })
  } catch (err) {
    console.log(chalk.red('An error occured generating components, rolling back.'))
    console.error(err)
    rollbackChanges(dirsAdded)
  }
}

export default generate
