const fs = require('fs');
const path = require('path');
const srcDir = 'c:/Users/Rahul/.gemini/antigravity/scratch/student-test-platform/client/src';

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles(srcDir);
let brokenImports = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const importRegex = /import\s+(?:[^'"]*)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const dir = path.dirname(file);
      const resolved = path.resolve(dir, importPath);
      
      const exts = ['.jsx', '.js', '.css', '/index.jsx', '/index.js', ''];
      let found = false;
      for (const ext of exts) {
        if (fs.existsSync(resolved + ext)) {
          found = true;
          break;
        }
      }
      if (!found) {
        brokenImports.push({ file, importPath });
      }
    }
  }
});

console.log('Broken Imports:', brokenImports);
