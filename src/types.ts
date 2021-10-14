export interface Args {
  [x: string]: unknown
  c?: string
  n: string[]
}

export interface Config {
  componentsDir: string
  files: FileOrSubDir[]
}

export interface File {
  fileName: string
  template: (componentName: string) => string
}

export interface SubDir {
  subDirName: string
  files: FileOrSubDir[]
}

export type FileOrSubDir = File | SubDir
