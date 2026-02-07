const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/assets/sample-image.png');

try {
    const stats = fs.statSync(filePath);
    console.log(`File exists. Size: ${stats.size} bytes`);

    // Basic header check for PNG
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    console.log(`Dimensions: ${width}x${height}`);
    console.log(`Aspect Ratio: ${(width / height).toFixed(2)}`);

} catch (e) {
    console.error("Error checking file:", e.message);
}
