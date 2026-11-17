// Metro is the bundler of React Native (the equivalent of Vite on the web).
// `mobile/` is not an npm workspace, so it is told where the shared package lives.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../shared');

const config = getDefaultConfig(projectRoot);

// Watch `shared/` so edits to schemas and types reload the app.
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot];

// Files in `shared/` import `zod`; resolve it from this app's own node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  ...(config.resolver.nodeModulesPaths ?? []),
];

module.exports = config;
