# vite-plugin-eslint4b

Vite plugin for running ESLint on browser

> **Note**  
> It is not a plugin for running ESLint during the build process.

With this plugin the following imports will work on the browser:

```js
import { Linter } from 'eslint';
```

## Usage

### Installation

```bash
npm install --save-dev vite-plugin-eslint4b eslint
```

### Configuration

```js
// vite.config.ts
import type { UserConfig } from "vite";
import buildVitePluginESLint4B from "vite-plugin-eslint4b";

const config: UserConfig = {
  plugins: [
    buildVitePluginESLint4B(), // <-
  ],
};
export default config;
```
