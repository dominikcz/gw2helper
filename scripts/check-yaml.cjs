const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.resolve(process.cwd(), 'src');
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.yaml')) {
      continue;
    }

    const source = fs.readFileSync(fullPath, 'utf8');
    try {
      yaml.load(source);
    } catch (error) {
      failures.push({
        file: fullPath,
        message: error && error.message ? String(error.message) : String(error),
      });
    }
  }
}

walk(root);

if (failures.length) {
  console.error('YAML validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure.file}`);
    console.error(`  ${failure.message}`);
  }
  process.exit(1);
}

console.log('YAML syntax OK');
