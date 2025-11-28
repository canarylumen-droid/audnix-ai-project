#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distServerDir = path.join(__dirname, '..', 'dist', 'server');

function getAllJsFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist yet.`);
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllJsFiles(fullPath));
    } else if (item.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  const importRegex = /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g;
  
  content = content.replace(importRegex, (match, prefix, importPath, suffix) => {
    if (importPath.endsWith('.js') || importPath.endsWith('.json') || importPath.endsWith('.css')) {
      return match;
    }
    
    const resolvedPath = path.resolve(path.dirname(filePath), importPath);
    
    if (fs.existsSync(resolvedPath + '.js')) {
      modified = true;
      return `${prefix}${importPath}.js${suffix}`;
    }
    
    if (fs.existsSync(path.join(resolvedPath, 'index.js'))) {
      modified = true;
      return `${prefix}${importPath}/index.js${suffix}`;
    }
    
    modified = true;
    return `${prefix}${importPath}.js${suffix}`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in: ${path.relative(distServerDir, filePath)}`);
  }
}

console.log('Fixing ESM imports in compiled server files...');
const jsFiles = getAllJsFiles(distServerDir);
console.log(`Found ${jsFiles.length} JavaScript files to process.`);

for (const file of jsFiles) {
  fixImportsInFile(file);
}

console.log('Import fixing complete!');
