export interface Args {
  [x: string]: unknown
  c?: string
  n: string[]
}

export interface Config {
  componentsDir: string
  files: FileOpts[]
}

export interface FileOpts {
  fileName: string
  subDirName?: string | null
  template: (componentName: string) => string
}
