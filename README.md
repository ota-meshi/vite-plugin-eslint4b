# vite-plugin-eslint4b

Vite plugin for running ESLint on browser

Note that it is not a plugin for running ESLint during the build process.

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
