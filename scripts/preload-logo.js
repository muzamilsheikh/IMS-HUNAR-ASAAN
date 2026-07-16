import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '../HunarAsaanLogo.jpg');
const outputPath = path.join(__dirname, '../src/utils/logoBase64.js');

try {
    if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const base64String = logoBuffer.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64String}`;
        
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, `// Auto-generated logo Base64 data URI\nexport const logoBase64 = "${dataUri}";\n`);
        console.log(`Successfully compiled and wrote logo Base64 URI to ${outputPath}`);
    } else {
        console.error(`Error: Logo file not found at ${logoPath}`);
    }
} catch (error) {
    console.error('Failed to pre-load logo:', error);
}
