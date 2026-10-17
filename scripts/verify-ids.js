import fs from 'fs';

const indexHtml = fs.readFileSync('index.html', 'utf8');
const files = ['script.js', 'src/main.js', 'src/auth/auth-ui.js'];
const idRegex = /getElementById\(['"]([^'"]+)['"]\)/g;
const allowedDynamic = new Set(['nav-user-profile', 'nav-profile-dropdown']);

const missing = [];
const checked = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    checked.push({ id, file });
    if (allowedDynamic.has(id)) continue;
    const pattern = new RegExp(`id=["']${id}["']`);
    if (!pattern.test(indexHtml)) {
      missing.push({ id, file });
    }
  }
}

console.log(`Checked ${checked.length} getElementById calls:`);
checked.forEach(c => console.log(`  ${c.file} -> #${c.id}`));

if (missing.length === 0) {
  console.log('\nSUCCESS: All getElementById targets exist in index.html!');
} else {
  console.error('\nFAILURE: Missing targets in index.html:', missing);
  process.exit(1);
}
