import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import fsMock from 'mock-fs'
import { Args, FileOpts } from '../../types'
import * as Config from '../config'
import generate, { addComponentDirectory, outputFiles, rollbackChanges } from '../generation'

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
    fsMock({
      [path.join('src', 'components', 'TestComponent1')]: {},
      [path.join('src', 'components', 'TestComponent2')]: {},
    })
  })

  test('it ouputs files properly', () => {
    const files: FileOpts[] = [
      {
        fileName: '[componentName].jsx',
        template: (componentName: string) => `export default <${componentName} />`,
        subDirName: null,
      },
      {
        fileName: 'index.js',
        template: (componentName: string) => `export { default } from "./${componentName}"`,
        subDirName: null,
      },
    ]

    const componentName = 'TestComponent1'
    const componentsDir = 'src/components/TestComponent1'

    outputFiles(files, componentName, componentsDir)

    const jsxFile = fs.readFileSync(
      path.join('src', 'components', 'TestComponent1', 'TestComponent1.jsx'),
    )
    expect(jsxFile.toString()).toEqual('export default <TestComponent1 />')

    const jsFile = fs.readFileSync(path.join('src', 'components', 'TestComponent1', 'index.js'))
    expect(jsFile.toString()).toEqual('export { default } from "./TestComponent1"')
  })

  test('it outputs subdirectories properly', () => {
    const files: FileOpts[] = [
      {
        fileName: '[componentName].test.jsx',
        template: (componentName: string) => `describe("${componentName} tests", () => {})`,
        subDirName: '__tests__',
      },
      {
        fileName: '[componentName].jsx',
        template: (componentName: string) => `export default <${componentName} />`,
        subDirName: null,
      },
    ]

    const componentName = 'TestComponent2'
    const componentsDir = path.join('src', 'components', 'TestComponent2')

    outputFiles(files, componentName, componentsDir)

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
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('')

  beforeEach(() => {
    consoleSpy.mockClear()
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
          subDirName: null,
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
          subDirName: null,
        },
        {
          fileName: '[componentName].test.jsx',
          template: (componentName: string) => `describe("${componentName} tests", () => {})`,
          subDirName: '__tests__',
        },
        {
          fileName: 'index.js',
          template: (componentName: string) => `export { default } from "./${componentName}"`,
          subDirName: null,
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
          subDirName: null,
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
          subDirName: null,
        },
        {
          fileName: 'index.js',
          template: () => {
            throw Error('Test Error')
          },
          subDirName: null,
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

    console.warn(process.cwd())

    args.n.forEach((componentName: string) => {
      const exists = fs.existsSync(
        path.join(process.cwd(), 'src', 'components', componentName, `${componentName}.jsx`),
      )
      expect(exists).toBe(false)
    })
  })

  afterAll(fsMock.restore)
})
