import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import fsMock from 'mock-fs'
import { Args, File, FileOrSubDir } from '../../types'
import * as Config from '../config'
import generate, {
  addComponentDirectory,
  addComponentFile,
  outputFiles,
  rollbackChanges,
} from '../generation'

describe('addComponentDirectory utility', () => {
  beforeAll(() => {
    fsMock({
      src: {
        components: {},
      },
    })
  })

  test('it creates a new directory', () => {
    const directoryName = path.join('src', 'components', 'TestComponent')
    const dirsAdded: string[] = []

    addComponentDirectory(directoryName, dirsAdded)

    expect(fs.existsSync(directoryName)).toBe(true)
    expect(dirsAdded).toContain(directoryName)
  })

  afterAll(fsMock.restore)
})

describe('addComponentFile utility', () => {
  // const consoleLogSpy = jest.spyOn(console, 'log')

  jest.mock('chalk', () => ({
    green: (text: string) => text,
  }))

  beforeEach(() => {
    // consoleLogSpy.mockClear()
  })

  beforeAll(() => {
    fsMock(
      {
        src: {
          components: {
            NewComponent: {},
          },
        },
      },
      { createCwd: true },
    )
  })

  test('it creates a new component file', () => {
    const file: File = {
      fileName: '[componentName].test.tsx',
      template: (componentName) => `describe('${componentName} tests', () => {})`,
    }

    const componentName = 'NewComponent'
    const componentsDir = path.join('src', 'components')
    const outputDir = path.join(process.cwd(), componentsDir, componentName)

    addComponentFile(file, componentName, componentsDir, outputDir)

    const newFilePath = path.join(outputDir, `${componentName}.test.tsx`)
    const newFile = fs.readFileSync(newFilePath)

    expect(newFile.toString()).toEqual("describe('NewComponent tests', () => {})")

    const expectedPath = path.join(componentsDir, componentName, `${componentName}.test.tsx`)

    expect(console.log).toHaveBeenCalledWith(chalk.green(`Added file: ${expectedPath}`))
  })

  afterAll(fsMock.restore)
})

describe('rollbackChanges utility', () => {
  beforeAll(() => {
    fsMock({
      [path.join('src', 'components', 'TestComponent1')]: {
        'TestComponent1.js': 'test',
      },
      [path.join('src', 'components', 'TestComponent2')]: {
        'TestComponent2.js': 'test',
      },
      [path.join('src', 'components', 'TestComponent3')]: {
        'TestComponent3.js': 'test',
      },
    })
  })

  test('it removes the appropriate component directories', () => {
    const dirsAdded: string[] = [
      path.join('src', 'components', 'TestComponent1'),
      path.join('src', 'components', 'TestComponent3'),
    ]

    rollbackChanges(dirsAdded)

    expect(fs.existsSync(dirsAdded[0])).toBe(false)
    expect(fs.existsSync(path.join('src', 'components', 'TestComponent2'))).toBe(true)
    expect(fs.existsSync(dirsAdded[2])).toBe(false)
  })

  afterAll(fsMock.restore)
})

describe('outputFiles utility', () => {
  beforeAll(() => {
    fsMock(
      {
        [path.join('src', 'components', 'TestComponent1')]: {},
        [path.join('src', 'components', 'TestComponent2')]: {},
      },
      { createCwd: true },
    )
  })

  test('it ouputs files properly', () => {
    const files: FileOrSubDir[] = [
      {
        fileName: '[componentName].jsx',
        template: (componentName: string) => `export default <${componentName} />`,
      },
      {
        fileName: 'index.js',
        template: (componentName: string) => `export { default } from "./${componentName}"`,
      },
    ]

    const componentName = 'TestComponent1'
    const componentsDir = path.join('src', 'components', 'TestComponent1')
    const outputDir = path.join(process.cwd(), componentsDir)

    outputFiles(files, componentName, componentsDir, outputDir)

    const jsxFile = fs.readFileSync(
      path.join('src', 'components', 'TestComponent1', 'TestComponent1.jsx'),
    )
    expect(jsxFile.toString()).toEqual('export default <TestComponent1 />')

    const jsFile = fs.readFileSync(path.join('src', 'components', 'TestComponent1', 'index.js'))
    expect(jsFile.toString()).toEqual('export { default } from "./TestComponent1"')
  })

  test('it outputs subdirectories properly', () => {
    const files: FileOrSubDir[] = [
      {
        subDirName: '__tests__',
        files: [
          {
            fileName: '[componentName].test.jsx',
            template: (componentName: string) => `describe("${componentName} tests", () => {})`,
          },
        ],
      },
      {
        fileName: '[componentName].jsx',
        template: (componentName: string) => `export default <${componentName} />`,
      },
    ]

    const componentName = 'TestComponent2'
    const componentsDir = path.join('src', 'components', 'TestComponent2')
    const outputDir = path.join(process.cwd(), componentsDir)

    outputFiles(files, componentName, componentsDir, outputDir)

    const testFile = fs.readFileSync(
      path.join('src', 'components', 'TestComponent2', '__tests__', 'TestComponent2.test.jsx'),
    )
    expect(testFile.toString()).toEqual('describe("TestComponent2 tests", () => {})')

    const jsFile = fs.readFileSync(
      path.join('src', 'components', 'TestComponent2', 'TestComponent2.jsx'),
    )
    expect(jsFile.toString()).toEqual('export default <TestComponent2 />')
  })

  afterAll(fsMock.restore)
})

describe('generate utility', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('')

  beforeEach(() => {
    consoleLogSpy.mockClear()
    consoleErrorSpy.mockClear()
    cwdSpy.mockClear()
  })

  jest.mock('chalk', () => ({
    red: (text: string) => text,
    yellow: (text: string) => text,
  }))

  test("it generates the components directory if it doesn't exist", async () => {
    fsMock(
      {
        src: {},
      },
      { createCwd: true },
    )

    jest.spyOn(Config, 'default').mockResolvedValue({
      componentsDir: 'src/components',
      files: [
        {
          fileName: '[componentName].jsx',
          template: (componentName: string) => `export default <${componentName} />`,
        },
      ],
    })

    const args: Args = { n: ['TestComponent1'] }
    await generate(args)

    const componentsDirExists = fs.existsSync(path.join(process.cwd(), 'src', 'components'))
    expect(componentsDirExists).toBe(true)
  })

  test('it generates components correctly', async () => {
    fsMock(
      {
        src: {},
      },
      { createCwd: true },
    )

    jest.spyOn(Config, 'default').mockResolvedValue({
      componentsDir: 'src/components',
      files: [
        {
          fileName: '[componentName].jsx',
          template: (componentName: string) => `export default <${componentName} />`,
        },
        {
          subDirName: '__tests__',
          files: [
            {
              fileName: '[componentName].test.jsx',
              template: (componentName: string) => `describe("${componentName} tests", () => {})`,
            },
          ],
        },
        {
          fileName: 'index.js',
          template: (componentName: string) => `export { default } from "./${componentName}"`,
        },
      ],
    })

    const args: Args = { n: ['TestComponent1', 'TestComponent2'] }
    await generate(args)

    args.n.forEach((componentName: string) => {
      const jsxFile = fs.readFileSync(
        path.join(process.cwd(), 'src', 'components', componentName, `${componentName}.jsx`),
      )
      expect(jsxFile.toString()).toEqual(`export default <${componentName} />`)

      const testFile = fs.readFileSync(
        path.join(
          process.cwd(),
          'src',
          'components',
          componentName,
          '__tests__',
          `${componentName}.test.jsx`,
        ),
      )
      expect(testFile.toString()).toEqual(`describe("${componentName} tests", () => {})`)

      const indexFile = fs.readFileSync(
        path.join(process.cwd(), 'src', 'components', componentName, 'index.js'),
      )
      expect(indexFile.toString()).toEqual(`export { default } from "./${componentName}"`)
    })
  })

  test('it skips components that already exist in filesystem', async () => {
    fsMock(
      {
        [path.join('src', 'components', 'TestComponent2')]: {
          'TestComponent2.jsx': 'export default <TestComponent2 />',
        },
      },
      { createCwd: true },
    )

    jest.spyOn(Config, 'default').mockResolvedValue({
      componentsDir: 'src/components',
      files: [
        {
          fileName: '[componentName].jsx',
          template: (componentName: string) => `export default <${componentName} />`,
        },
      ],
    })

    const args: Args = { n: ['TestComponent1', 'TestComponent2'] }
    await generate(args)

    args.n.forEach((componentName: string) => {
      const exists = fs.existsSync(
        path.join(process.cwd(), 'src', 'components', componentName, `${componentName}.jsx`),
      )

      expect(exists).toBe(true)
    })

    expect(console.log).toBeCalledWith(
      chalk.yellow(
        `Warning: ${path.join(
          process.cwd(),
          'src',
          'components',
          'TestComponent2',
        )} already exists, skipping.`,
      ),
    )
  })

  test('it rolls back changes if an error occurs', async () => {
    fsMock(
      {
        src: {},
      },
      { createCwd: true },
    )

    jest.spyOn(Config, 'default').mockResolvedValue({
      componentsDir: 'src/components',
      files: [
        {
          fileName: '[componentName].jsx',
          template: (componentName: string) => `export default <${componentName} />`,
        },
        {
          fileName: 'index.js',
          template: () => {
            throw Error('Test Error')
          },
        },
      ],
    })

    const args: Args = { n: ['TestComponent1', 'TestComponent2'] }

    try {
      await generate(args)
    } catch (err) {
      expect(err).toEqual(Error('Test Error'))
      expect(console.log).toBeCalledWith(
        chalk.red('An error occured generating components, rolling back.'),
      )
    }

    args.n.forEach((componentName: string) => {
      const exists = fs.existsSync(
        path.join(process.cwd(), 'src', 'components', componentName, `${componentName}.jsx`),
      )
      expect(exists).toBe(false)
    })
  })

  afterAll(fsMock.restore)
})
