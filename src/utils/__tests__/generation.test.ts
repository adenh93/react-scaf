import * as fs from 'fs'
import * as mock from 'mock-fs'
import { addComponentDirectory, rollbackChanges } from '../generation'

describe('addComponentDirectory utility', () => {
  beforeAll(() => {
    mock({
      src: {},
    })
  })

  test('it creates a new directory', () => {
    const directoryName = 'src/TestComponent'
    const dirsAdded: string[] = []

    addComponentDirectory(directoryName, dirsAdded)

    expect(fs.existsSync(directoryName)).toBe(true)
    expect(dirsAdded).toContain(directoryName)
  })

  afterAll(mock.restore)
})

describe('rollback changes utility', () => {
  beforeAll(() => {
    mock({
      'src/TestComponent1': {
        'TestComponent1.js': 'test',
      },
      'src/TestComponent2': {
        'TestComponent2.js': 'test',
      },
      'src/TestComponent3': {
        'TestComponent3.js': 'test',
      },
    })
  })

  test('it removes the appropriate component directories', () => {
    const dirsAdded: string[] = ['src/TestComponent1', 'src/TestComponent3']

    rollbackChanges(dirsAdded)

    expect(fs.existsSync(dirsAdded[0])).toBe(false)
    expect(fs.existsSync('src/TestComponent2')).toBe(true)
    expect(fs.existsSync(dirsAdded[2])).toBe(false)
  })

  afterAll(mock.restore)
})
