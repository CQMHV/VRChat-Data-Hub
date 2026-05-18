import {createReadStream, existsSync} from 'node:fs';
import {stat} from 'node:fs/promises';
import {extname, join, resolve} from 'node:path';
import {createServer} from 'node:http';

const root = resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 5173);

const contentTypes = new Map([
    ['.html', 'text/html;charset=UTF-8'],
    ['.js', 'text/javascript;charset=UTF-8'],
    ['.css', 'text/css;charset=UTF-8'],
    ['.json', 'application/json;charset=UTF-8'],
    ['.svg', 'image/svg+xml'],
    ['.png', 'image/png'],
    ['.webmanifest', 'application/manifest+json'],
    ['.woff', 'font/woff'],
    ['.woff2', 'font/woff2']
]);

createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);
    const candidate = resolve(root, `.${pathname}`);
    const filePath = candidate.startsWith(root) && existsSync(candidate) ? candidate : join(root, 'index.html');

    try {
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        response.writeHead(200, {
            'Content-Type': contentTypes.get(extname(filePath)) || 'application/octet-stream'
        });
        createReadStream(filePath).pipe(response);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Static preview: http://127.0.0.1:${port}/`);
});
