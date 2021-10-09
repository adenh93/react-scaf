import type { Args, FileOpts } from '../types';
export declare const addComponentDirectory: (directoryName: string, dirsAdded: string[]) => void;
export declare const rollbackChanges: (dirsAdded: string[]) => void;
export declare const outputFiles: (files: FileOpts[], componentName: string, componentsDir: string) => void;
declare const generate: (args: Args) => Promise<void>;
export default generate;
