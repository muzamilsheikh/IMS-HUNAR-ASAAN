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

        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(outputPath, `// Auto-generated logo Base64 data URI\nexport const logoBase64 = "${dataUri}";\n`);
        console.log(`Logo compiled successfully → ${outputPath}`);
    } else if (fs.existsSync(outputPath)) {
        // logoBase64.js already contains the compiled logo — nothing to do.
        console.log('Logo already compiled in logoBase64.js, skipping re-generation.');
    } else {
        // Neither source nor output exists — write an empty fallback so the build does not fail.
        console.warn('Warning: HunarAsaanLogo.jpg not found. Writing empty logoBase64 fallback.');
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outputPath, `// Logo not available at build time\nexport const logoBase64 = "";\n`);
    }
} catch (error) {
    console.error('Failed to pre-load logo:', error);
    process.exit(1);
}
