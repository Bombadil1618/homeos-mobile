#!/usr/bin/env node
/**
 * Run EAS Android development build with project root set to this app directory.
 * Required when the repo root is the parent (monorepo); ensures only homeos-mobile is uploaded.
 */
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
process.env.EAS_NO_VCS = '1';
process.env.EAS_PROJECT_ROOT = projectRoot;

const result = spawnSync(
  'eas',
  ['build', '--platform', 'android', '--profile', 'development', '--non-interactive'],
  { stdio: 'inherit', env: process.env, shell: true }
);
process.exit(result.status ?? 1);
