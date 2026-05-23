import {defineConfig} from 'vite';

const rewritePwaLoadingPath = (middlewares) => {
    middlewares.use((request, response, next) => {
        const url = new URL(request.url, 'http://localhost');
        if (url.pathname !== '/pwa-loading') {
            next();
            return;
        }

        request.url = `/pwa-loading.html${url.search}`;
        next();
    });
};

export default defineConfig({
    plugins: [
        {
            name: 'pwa-loading-html-rewrite',
            configureServer(server) {
                rewritePwaLoadingPath(server.middlewares);
            },
            configurePreviewServer(server) {
                rewritePwaLoadingPath(server.middlewares);
            }
        }
    ]
});
