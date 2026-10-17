import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const scriptJs = fs.readFileSync('script.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Extract image paths from certificates array in script.js
const certImageRegex = /image:\s*["']([^"']+)["']/g;
const certImages = [];
let m;
while ((m = certImageRegex.exec(scriptJs)) !== null) {
  certImages.push(m[1]);
}

// 2. Extract data-cert-src from index.html
const dataCertRegex = /data-cert-src=["']([^"']+)["']/g;
const dataCertSrcs = [];
while ((m = dataCertRegex.exec(indexHtml)) !== null) {
  dataCertSrcs.push(m[1]);
}

console.log(`Checking ${certImages.length} certificates images in dist/...`);
const missingCertImages = [];
for (const relPath of certImages) {
  const fullPath = path.join(distDir, relPath);
  if (!fs.existsSync(fullPath)) {
    missingCertImages.push(relPath);
  }
}

console.log(`Checking ${dataCertSrcs.length} data-cert-src targets in dist/...`);
const missingDataCerts = [];
for (const relPath of dataCertSrcs) {
  const fullPath = path.join(distDir, relPath);
  if (!fs.existsSync(fullPath)) {
    missingDataCerts.push(relPath);
  }
}

// 3. Check about-photo / Ankesh_profile_pic.webp in dist/
const profilePicExists = fs.existsSync(path.join(distDir, 'Ankesh_profile_pic.webp'));
console.log('Ankesh_profile_pic.webp in dist/:', profilePicExists);

if (missingCertImages.length === 0 && missingDataCerts.length === 0 && profilePicExists) {
  console.log('\nSUCCESS: Every certificate image and data-cert-src resolves in dist/!');
} else {
  console.error('\nFAILURE: Missing assets in dist/:', {
    missingCertImages,
    missingDataCerts,
    profilePicExists
  });
  process.exit(1);
}
