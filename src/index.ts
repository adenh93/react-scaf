#!/usr/bin/env node

import * as yargs from 'yargs'
import * as fs from 'fs'
import * as chalk from 'chalk'
import type { Args, FileOpts } from './types'
import getUserConfig from './utils/config'

const dirsAdded: string[] = []

const argv: Args = yargs(process.argv.slice(2))
  .usage('Usage: $0 <command> [options]')
  .command('gen', 'Generates provided components')
  .example(
    '$0 gen -n Component1 Component2',
    'Generates component files for Component1 and Component2',
  )
  .alias('n', 'componentNames')
  .describe('n', 'A list of component names to generate')
  .demandOption(['n'])
  .string('n')
  .array('n')
  .help()
  .alias('h', 'help')
  .parseSync()

const addComponentDirectory = (directoryName: string): void => {
  fs.mkdirSync(directoryName)
  dirsAdded.push(directoryName)
}

const rollbackChanges = (): void => {
  dirsAdded.forEach((dirName: string) => {
    if (fs.existsSync(dirName)) fs.rmdirSync(dirName, { recursive: true })
  })
}

const outputFiles = (files: FileOpts[], componentName: string, componentsDir: string): void => {
  files.forEach(({ fileName, subDirName, template }: FileOpts) => {
    let newComponentsDir = componentsDir

    if (subDirName) {
      newComponentsDir += `/${subDirName}`
      if (!fs.existsSync(newComponentsDir)) fs.mkdirSync(newComponentsDir)
    }

    const parsedFilename = fileName.replace('[componentName]', componentName)
    const outputFilename = `${newComponentsDir}/${parsedFilename}`

    if (!fs.existsSync(outputFilename)) {
      const parsedTemplate = template(componentName)
      fs.writeFileSync(outputFilename, parsedTemplate)
    }
  })
}

const run = async (): Promise<void> => {
  const config = await getUserConfig()
  const { componentsDir, files } = config
  const componentNames: string[] = argv.n

  componentNames.forEach((componentName: string) => {
    try {
      const outputDir = `${process.cwd()}/${componentsDir}/${componentName}`

      if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir)

      if (!fs.existsSync(outputDir)) {
        addComponentDirectory(outputDir)
        outputFiles(files, componentName, outputDir)
      } else {
        console.log(chalk.yellow(`Warning: ${outputDir} already exists, skipping.`))
      }
    } catch (err) {
      console.log(chalk.red('An error occured generating components, rolling back.'))
      rollbackChanges()
      throw err
    }
  })
}

run()
