# scaffed

![npm badge](https://img.shields.io/npm/v/scaffed)
![build status](https://img.shields.io/github/workflow/status/adenh93/scaffed/npm%20publish)

Scaffed is a simple solution to generating component scaffolding. It uses a template based approach, allowing you to specify the common files, along with their content, to generate when creating your component directories.

## Justification
I initially created this package out of frustration with creating new component directories. Typically when I create a new component in a library such as React, the contents of the directory of my new component look something like this:

```js
SomeComponent/
├─ __tests__/
│  ├─ SomeComponent.test.tsx // Tests
├─ SomeComponent.tsx //React component
├─ SomeComponent.css.ts // Styled Components
├─ SomeComponent.stories.tsx // Storybook
├─ index.ts
```

That's a lot of files to create each time, all with their own boilerplate content, so I decided that I needed to create a little tool to ease the pain!

Scaffed will handle creating the new component directories, along with their files, and will also handle boilerplating each of the generated files to your own specification.

I will be making changes to this package as I see fit, but if there are any features that you would like added, feel free to log an issue!

## Installation

To install scaffed, run `npm install -g scaffed`.

Next, add the required configuration file to a directory in the top level of your project: `.scaffed/config.js`.

## Usage


### Configuration

A quick example of the structure of `.scaffed/config.js` is as follows:

__.scaffed/config.js__
```js
module.exports = {
  // The 'main' configuration is required!
  main: {
    componentsDir: './src/components',
    files: [
      {
        fileName: '[componentName].tsx',
        template: componentName => `export default <${componentName} />`
      },
      {
        subDirName: '__tests__',
        files: [
          {
            fileName: '[componentName].test.tsx',
            template: componentName => `describe('${componentName} tests', () => {})`
          }
        ]
      },
      {
        fileName: 'index.js',
        template: componentName => `export { default } from './${componentName}'`
      }
    ],
  },
  // A configuration like this is optional, and can named anything you desire.
  ui: {
    componentsDir: './src/components/ui',
    files: [
      {
        fileName: '[componentName].css.tsx',
        template: componentName => `export default <${componentName} />`
      },
      {
        fileName: 'index.js',
        template: componentName => `export { default } from './${componentName}'`
      }
    ],
  }
  // You can define more custom configurations as you wish. 
}
```

The config file supports multiple different named configurations to cover all of the different component contexts in your application. For example, the `ui` key above will return its specific configuration settings if the _scaffed_ command is called like such: `scaffed -c ui -n ComponentName`.

Even if you don't define multiple configurations, you __MUST__ at least have a configuration named _main_ defined.

The configuration settings for each of these expect the following properties:

__Config__
| Name          | Type           | Required | Description                                                                  |
|---------------|----------------|----------|------------------------------------------------------------------------------|
| componentsDir | string         | true     | The name of the directory where components are created, e.g. src/components. |
| files         | FileOrSubDir[] | true     | A list of files/subdirectories to generate for each component.               |

__File__
| Name     | Type   | Required | Description                                                           |
|----------|--------|----------|-----------------------------------------------------------------------|
| fileName | string | true     | Filename for the specific file.                                       |
| template | string | true     | Template function returning a string to generate the file's contents. |

__SubDir__
| Name       | Type           | Required | Description                                                         |
|------------|----------------|----------|---------------------------------------------------------------------|
| subDirName | string         | true     | Name of the specific subdirectory.                                  |
| files      | FileOrSubDir[] | true     | A list of files/subdirectories to generate under this subdirectory. |

#### Accessing Component Name in Templates

As you will notice, the template property for each file you configure expects a function which can optionally accept a `componentName` argument. This argument will allow you to reference the component's name in your template, e.g.

```js
template: componentName => `export default <${componentName} />`
```

will generate 

```js
export default <SomeComponent />
```

if the name of the component being generated is `SomeComponent`.

Likewise, you can access the component name in the `fileName` property of each file element by simply using the tag `[componentName]`.
e.g. `[componentName].jsx` -> `SomeComponent.jsx`.

### Execution

Once your configuration is to your liking, you can start generating components by using the `scaffed` console command. The `scaffed` command requires one command-line argument, `--componentNames`, or its alias: `-n`. The `--componentNames` argument can be provided one or more component names separated by spaces, for example: `scaffed -n SomeComponent OtherComponent`.

If you wish to generate component scaffolding with a specific configuration context loaded, you can use the optional argument `--config` or its alias `-c`. The `--config` argument accepts a single string denoting the configuration to use, granted that it exists in your config file. An example of this would be `scaffed -c ui -n SomeComponent OtherComponent`. Note that if this argument is not provided a value, it will default to `main`, so you __MUST__ at the very least define a `main` configuration in `.scaffed/config.json`.

After executing the command, _scaffed_ will attempt to generate component scaffolding for all of the component names provided in the command line argument. For every component name, it will generate a component folder, along with all of the files and their content specified in the configuration.

If a component already exists when _scaffed_ attempts to generate scaffolding for it, it will simply be skipped during the generation to prevent disturbing the structure of existing components.

Alternatively, if for any reason an error occurs while _scaffed_ is generating component scaffolding, it will roll back all changes done up the the point of execution to clean up possibly corrupted component files.

### Examples

Consider the following practical _scaffed_ configuration:

__.scaffed/config.js__
```js
const files = require('./templates')
​
module.exports = {
  main: {
    componentsDir: './src/components',
    files,
  },
  ui: {
    componentsDir: './src/components/ui',
    files,
  }
}
```

__.scaffed/templates.js__
```js
const reactTemplate = (componentName) =>
  `import { FC } from 'react'
  
interface ${componentName}Props {}
​
const ${componentName}: FC<${componentName}Props> = () => <></>
​
export default ${componentName}
`
​
const testTemplate = (componentName) =>
  `import { render } from '@testing-library/react'
import ${componentName} from './${componentName}'
​
describe('${componentName} tests', () => {})
`
​
const storiesTemplate = (componentName) =>
  `import ${componentName} from './${componentName}'
​
export default {
    component: ${componentName},
    title: '${componentName}'
}
​
export const Primary = () => <${componentName} />
`
​
const styledTemplate = () =>
  `import styled from 'styled-components'
​
const StyledComponent = styled.span\`\`
​
export default StyledComponent
`
​
const indexTemplate = (componentName) => `export { default } from './${componentName}'`
​
module.exports = [
  { fileName: '[componentName].tsx', template: reactTemplate },
  { 
    subDirName: '__tests__',
    files: [
      {
        fileName: '[componentName].test.tsx', 
        template: testTemplate
      }
    ]
  },
  { fileName: '[componentName].stories.tsx', template: storiesTemplate },
  { fileName: '[componentName].css.ts', template: styledTemplate },
  { fileName: 'index.ts', template: indexTemplate },
]
```

After the following executions: `scaffed -c ui -n Box Flex` and `scaffed -n SomeComponent`, The following scaffolding will be generated, assuming that the components don't already exist:

__Directory Structure__
```
.
├── src/
└── components/
    ├── SomeComponent/
    │   ├── __tests__/
    │   │   └── SomeComponent.test.tsx
    │   ├── SomeComponent.tsx
    │   ├── SomeComponent.stories.tsx
    │   ├── SomeComponent.css.ts
    │   └── index.ts
    └── ui/
        ├── Box/
        │   ├── __tests__/
        │   │   └── Box.test.tsx
        │   ├── Box.tsx
        │   ├── Box.stories.tsx
        │   ├── Box.css.ts
        │   └── Box.index.ts
        └── Flex/
            ├── __tests__/
            │   └── Flex.test.tsx
            ├── Flex.tsx
            ├── Flex.stories.tsx
            ├── Flex.css.ts
            └── Flex.index.ts
```

The contents of each file will be determined by the templates, with the componentName substituted in wherever it is referenced from the template function argument.

e.g.

__Box.tsx__
```tsx
import { FC } from 'react'

interface BoxProps {}

const Box: FC<BoxProps> = () => <></>

export default Box
```

__Flex.stories.tsx__
```tsx
import Flex from './Flex'
​
export default {
  component: Flex,
  title: 'Flex'
}
​
export const Primary = () => <Flex />
```