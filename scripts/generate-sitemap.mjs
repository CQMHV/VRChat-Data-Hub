import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');
const robotsPath = path.join(projectRoot, 'public', 'robots.txt');
const staticEntries = [
    {pathname: '/', sourcePath: 'src/app/pages/home.js'},
    {pathname: '/home', sourcePath: 'src/app/pages/home.js'},
    {pathname: '/upload', sourcePath: 'src/app/pages/upload.js'},
    {pathname: '/files', sourcePath: 'src/app/pages/files.js'},
    {pathname: '/jobs', sourcePath: 'src/app/pages/jobs.js'},
    {pathname: '/settings', sourcePath: 'src/app/pages/settings.js'},
    {pathname: '/about', sourcePath: 'src/app/pages/about.js'}
];

function normalizeSiteUrl(rawSiteUrl) {
    const value = String(rawSiteUrl || '').trim();
    if (!value) {
        return null;
    }

    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('SITE_URL 必须使用 http:// 或 https:// 开头。');
    }

    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function normalizeDate(rawDate) {
    if (!rawDate) {
        return null;
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString().slice(0, 10);
}

function getFileLastmod(sourcePath) {
    const absolutePath = path.join(projectRoot, sourcePath);
    if (!fs.existsSync(absolutePath)) {
        return null;
    }

    return normalizeDate(fs.statSync(absolutePath).mtime);
}

function getGitLastmod(sourcePath) {
    try {
        const updatedAt = execFileSync('git', ['-C', projectRoot, 'log', '-1', '--format=%cI', '--', sourcePath], {
            encoding: 'utf8'
        }).trim();

        return normalizeDate(updatedAt);
    } catch {
        return null;
    }
}

function getSourceLastmod(sourcePath) {
    return getGitLastmod(sourcePath) || getFileLastmod(sourcePath);
}

function collectSitemapEntries(siteUrl) {
    return staticEntries.map(({pathname, sourcePath}) => ({
        loc: `${siteUrl}${pathname}`,
        lastmod: getSourceLastmod(sourcePath)
    }));
}

function buildSitemapXml(entries) {
    const urls = entries.map((entry) => {
        const lastmod = entry.lastmod ? `\n        <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
        return `    <url>\n        <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n    </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildRobotsTxt(siteUrl) {
    return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

function writeBaseRobotsTxt() {
    fs.writeFileSync(robotsPath, 'User-agent: *\nAllow: /\n', 'utf8');
}

function main() {
    const siteUrl = normalizeSiteUrl(process.env.SITE_URL);
    if (!siteUrl) {
        fs.rmSync(sitemapPath, {force: true});
        writeBaseRobotsTxt();
        console.warn('[generate-sitemap] SITE_URL 未配置，跳过 sitemap.xml 生成。');
        return;
    }

    const sitemapXml = buildSitemapXml(collectSitemapEntries(siteUrl));
    fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
    fs.writeFileSync(robotsPath, buildRobotsTxt(siteUrl), 'utf8');
    console.log(`[generate-sitemap] 已生成 ${path.relative(projectRoot, sitemapPath)}。`);
}

main();
