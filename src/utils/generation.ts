import fs from 'fs'
import chalk from 'chalk'
import path from 'path'
import type { Args, File, FileOrSubDir } from '../types'
import getUserConfig from './config'

export const addComponentFile = (
  file: File,
  componentName: string,
  componentsDir: string,
  outputDir: string,
): void => {
  const parsedFilename = file.fileName.replace('[componentName]', componentName)
  const outputFilename = path.join(outputDir, parsedFilename)

  if (!fs.existsSync(outputFilename)) {
    const parsedTemplate = file.template(componentName)
    const logFilename = path.join(componentsDir, componentName, parsedFilename)

    fs.writeFileSync(outputFilename, parsedTemplate)
    console.log(chalk.green(`Added file: ${logFilename}`))
  }
}

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
  files: FileOrSubDir[],
  componentName: string,
  componentsDir: string,
  outputDir: string,
): void => {
  files.forEach((file: FileOrSubDir) => {
    let newOutputDir = outputDir

    if ('subDirName' in file && file.subDirName) {
      newOutputDir = path.join(newOutputDir, file.subDirName)
      if (!fs.existsSync(newOutputDir)) fs.mkdirSync(newOutputDir)
      return outputFiles(file.files, componentName, componentsDir, newOutputDir)
    } else if ('fileName' in file) {
      addComponentFile(file, componentName, componentsDir, newOutputDir)
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
        outputFiles(files, componentName, componentsDir, outputDir)
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
