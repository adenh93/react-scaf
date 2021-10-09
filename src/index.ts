#!/usr/bin/env node

import * as yargs from 'yargs'
import type { Args } from './types'
import generate from './utils/generation'

const args: Args = yargs(process.argv.slice(2))
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

generate(args)
