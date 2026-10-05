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
const cssContent = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf-8');

const allClasses = new Set();
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const classRegex = /className=[\"']([^\"']+)[\"']/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    match[1].split(' ').forEach(cls => allClasses.add(cls.trim()));
  }
});

const missingClasses = [];
const maybeCustom = Array.from(allClasses).filter(c => c && !c.includes(':') && !c.includes('[') && !c.match(/^(p|m|w|h|bg|text|flex|grid|border|rounded|shadow|z|top|left|right|bottom|gap|col|row|inset|items|justify|font|opacity)-/));

maybeCustom.forEach(cls => {
  if (cls && !cssContent.includes('.' + cls.replace(/\\/g, '\\\\'))) {
    missingClasses.push(cls);
  }
});

console.log('Potentially missing custom CSS classes:');
console.log(missingClasses.join('\n'));
