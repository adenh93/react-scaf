#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var yargs = require("yargs");
var generation_1 = require("./utils/generation");
var args = yargs(process.argv.slice(2))
    .usage('Usage: $0 <command> [options]')
    .command('gen', 'Generates provided components')
    .example('$0 gen -n Component1 Component2', 'Generates component files for Component1 and Component2')
    .alias('n', 'componentNames')
    .describe('n', 'A list of component names to generate')
    .demandOption(['n'])
    .string('n')
    .array('n')
    .help()
    .alias('h', 'help')
    .parseSync();
(0, generation_1.default)(args);
