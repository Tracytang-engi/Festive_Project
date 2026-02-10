/**
 * Batch remove background from sticker images using remove.bg API.
 * Usage: set REMOVE_BG_API_KEY then run from Festive_Project: node scripts/remove-bg-batch.mjs
 * Optional: REMOVE_BG_INPUT=sticker (default: stickers), REMOVE_BG_OUTPUT=sticker_processed
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const inputDirName = process.env.REMOVE_BG_INPUT || 'stickers';
const outputDirName = process.env.REMOVE_BG_OUTPUT || 'sticker_processed';
const inputBase = path.join(projectRoot, 'client', 'public', inputDirName);
const outputBase = path.join(projectRoot, 'client', 'public', outputDirName);

const API_KEY = process.env.REMOVE_BG_API_KEY;
const EXT = ['.png', '.jpg', '.jpeg', '.webp'];

function getAllImagePaths(dir, base = dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            files.push(...getAllImagePaths(full, base));
        } else if (EXT.some(ext => e.name.toLowerCase().endsWith(ext))) {
            files.push(path.relative(base, full));
        }
    }
    return files;
}

async function removeBg(imagePath) {
    const blob = await fs.promises.readFile(imagePath);
    const form = new FormData();
    form.append('size', 'auto');
    form.append('image_file', new Blob([blob]), path.basename(imagePath));

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': API_KEY },
        body: form,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`remove.bg ${res.status}: ${text}`);
    }
    return Buffer.from(await res.arrayBuffer());
}

async function main() {
    if (!API_KEY) {
        console.error('Set REMOVE_BG_API_KEY environment variable.');
        process.exit(1);
    }
    if (!fs.existsSync(inputBase)) {
        console.error('Input folder not found:', inputBase);
        process.exit(1);
    }

    const relPaths = getAllImagePaths(inputBase);
    console.log(`Found ${relPaths.length} images in ${inputBase}`);

    for (const rel of relPaths) {
        const inPath = path.join(inputBase, rel);
        const outPath = path.join(outputBase, rel);
        const outDir = path.dirname(outPath);
        const basename = path.basename(rel, path.extname(rel)) + '.png';
        const outFile = path.join(outDir, basename);

        fs.mkdirSync(outDir, { recursive: true });

        if (fs.existsSync(outFile)) {
            console.log('SKIP (已有)', rel);
            continue;
        }

        try {
            const png = await removeBg(inPath);
            fs.writeFileSync(outFile, png);
            console.log('OK', rel);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
            console.error('FAIL', rel, e.message);
        }
    }

    console.log('Done. Output:', outputBase);
}

main();
