import {Resvg} from '@resvg/resvg-js';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');
const sourceLogoFile = process.argv[2] || 'favicon.svg';

const iconSources = [
    {
        output: 'pwa-icon.svg',
        logoWidth: 392,
        backgroundRadius: 112,
        maskable: false
    },
    {
        output: 'pwa-icon-maskable.svg',
        logoWidth: 360,
        backgroundRadius: 0,
        maskable: true
    }
];

const pngIcons = [
    {
        source: 'pwa-icon.svg',
        output: 'pwa-icon-192.png',
        size: 192
    },
    {
        source: 'pwa-icon.svg',
        output: 'pwa-icon-512.png',
        size: 512
    },
    {
        source: 'pwa-icon-maskable.svg',
        output: 'pwa-icon-maskable-192.png',
        size: 192
    },
    {
        source: 'pwa-icon-maskable.svg',
        output: 'pwa-icon-maskable-512.png',
        size: 512
    }
];

function parseSvgNumber(value) {
    const number = Number.parseFloat(value);
    if (!Number.isFinite(number) || number <= 0) {
        return null;
    }

    return number;
}

function getSvgAttribute(svg, name) {
    const match = svg.match(new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'u'));
    return match?.[2] ?? null;
}

function getSourceLogoViewBox(svg) {
    const viewBox = getSvgAttribute(svg, 'viewBox');
    if (viewBox) {
        const [minX, minY, width, height] = viewBox
            .trim()
            .split(/[\s,]+/u)
            .map(Number);

        if (![minX, minY, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
            throw new Error(`${sourceLogoFile} has an invalid viewBox: ${viewBox}`);
        }

        return {minX, minY, width, height};
    }

    const width = parseSvgNumber(getSvgAttribute(svg, 'width'));
    const height = parseSvgNumber(getSvgAttribute(svg, 'height'));
    if (!width || !height) {
        throw new Error(`${sourceLogoFile} must define a valid viewBox or width/height.`);
    }

    return {minX: 0, minY: 0, width, height};
}

function createIconSvg({sourceLogo, sourceViewBox, logoWidth, backgroundRadius, maskable}) {
    const logoHeight = Math.round((logoWidth * sourceViewBox.height) / sourceViewBox.width);
    const logoX = Math.round((512 - logoWidth) / 2);
    const logoY = Math.round((512 - logoHeight) / 2);
    const title = maskable ? 'VRCDH Maskable App Icon' : 'VRCDH App Icon';

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="512" height="512" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title">
    <title id="title">${title}</title>
    <rect width="512" height="512" rx="${backgroundRadius}" fill="#f8f9ff"/>
    <svg x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" viewBox="${sourceViewBox.minX} ${sourceViewBox.minY} ${sourceViewBox.width} ${sourceViewBox.height}">
${sourceLogo}
    </svg>
</svg>
`;
}

async function writeIconSources() {
    const originalLogo = await readFile(join(publicDir, sourceLogoFile), 'utf8');
    const sourceViewBox = getSourceLogoViewBox(originalLogo);
    const sourceLogo = originalLogo
        .replace(/<\?xml[^>]*>\s*/u, '')
        .replace(/<!DOCTYPE[^>]*>\s*/u, '')
        .replace(/<svg\b[^>]*>/u, '<g>')
        .replace(/<\/svg>\s*$/u, '</g>')
        .trim();

    await Promise.all(iconSources.map((icon) => writeFile(
        join(publicDir, icon.output),
        createIconSvg({
            ...icon,
            sourceLogo,
            sourceViewBox
        })
    )));
}

async function renderPng({source, output, size}) {
    const svg = await readFile(join(publicDir, source), 'utf8');
    const renderer = new Resvg(svg, {
        fitTo: {
            mode: 'width',
            value: size
        }
    });
    const png = renderer.render().asPng();
    await writeFile(join(publicDir, output), png);
}

await writeIconSources();
await Promise.all(pngIcons.map(renderPng));
