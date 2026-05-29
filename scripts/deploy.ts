import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const cdkArgs = [
  'cdk',
  'deploy',
  '--all',
];

if (process.env.PRODUCT_CREATED_EMAIL) {
  cdkArgs.push('-c', `productCreatedEmail=${process.env.PRODUCT_CREATED_EMAIL}`);
}

if (process.env.EXPENSIVE_PRODUCT_CREATED_EMAIL) {
  cdkArgs.push('-c', `expensiveProductCreatedEmail=${process.env.EXPENSIVE_PRODUCT_CREATED_EMAIL}`);
}

const result = spawnSync('npx', cdkArgs, {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
