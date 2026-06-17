const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../public/images.jpg');
const destDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function main() {
  try {
    await sharp(src)
      .resize(192, 192)
      .png()
      .toFile(path.join(destDir, 'icon-192.png'));
    console.log('Created public/icons/icon-192.png');

    await sharp(src)
      .resize(512, 512)
      .png()
      .toFile(path.join(destDir, 'icon-512.png'));
    console.log('Created public/icons/icon-512.png');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
}

main();
