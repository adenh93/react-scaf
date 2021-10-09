#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var yargs = require("yargs");
var fs = require("fs");
var chalk = require("chalk");
var config_1 = require("./utils/config");
var dirsAdded = [];
var argv = yargs(process.argv.slice(2))
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
var addComponentDirectory = function (directoryName) {
    fs.mkdirSync(directoryName);
    dirsAdded.push(directoryName);
};
var rollbackChanges = function () {
    dirsAdded.forEach(function (dirName) {
        if (fs.existsSync(dirName))
            fs.rmdirSync(dirName, { recursive: true });
    });
};
var outputFiles = function (files, componentName, componentsDir) {
    files.forEach(function (_a) {
        var fileName = _a.fileName, subDirName = _a.subDirName, template = _a.template;
        var newComponentsDir = componentsDir;
        if (subDirName) {
            newComponentsDir += "/" + subDirName;
            if (!fs.existsSync(newComponentsDir))
                fs.mkdirSync(newComponentsDir);
        }
        var parsedFilename = fileName.replace('[componentName]', componentName);
        var outputFilename = newComponentsDir + "/" + parsedFilename;
        if (!fs.existsSync(outputFilename)) {
            var parsedTemplate = template(componentName);
            fs.writeFileSync(outputFilename, parsedTemplate);
        }
    });
};
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var config, componentsDir, files, componentNames;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, config_1.default)()];
            case 1:
                config = _a.sent();
                componentsDir = config.componentsDir, files = config.files;
                componentNames = argv.n;
                componentNames.forEach(function (componentName) {
                    try {
                        var outputDir = process.cwd() + "/" + componentsDir + "/" + componentName;
                        if (!fs.existsSync(componentsDir))
                            fs.mkdirSync(componentsDir);
                        if (!fs.existsSync(outputDir)) {
                            addComponentDirectory(outputDir);
                            outputFiles(files, componentName, outputDir);
                        }
                        else {
                            console.log(chalk.yellow("Warning: " + outputDir + " already exists, skipping."));
                        }
                    }
                    catch (err) {
                        console.log(chalk.red('An error occured generating components, rolling back.'));
                        rollbackChanges();
                        throw err;
                    }
                });
                return [2 /*return*/];
        }
    });
}); };
run();
