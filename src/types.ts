export interface Args {
  [x: string]: unknown
  n: string[]
}

export interface Config {
  componentsDir: string
  files: FileOpts[]
}

export interface FileOpts {
  fileName: string
  subDirName?: string
  template: (componentName: string) => string
}
