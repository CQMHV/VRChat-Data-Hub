import {staticPages} from '../pages/index.js';
import {buildPath, parseRoute} from './routes.js';
import {escapeHtml} from '../utils/html.js';

const CONTENT_LINK_SELECTORS = [
    'a[href]',
    'md-filled-button[href]',
    'md-filled-tonal-button[href]',
    'md-outlined-button[href]',
    'md-text-button[href]',
    'md-elevated-button[href]'
].join(', ');

function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function findContentLinkTarget(event) {
    const start = event.target;
    if (!(start instanceof Element)) {
        return null;
    }
    return start.closest(CONTENT_LINK_SELECTORS);
}

function resolveInternalUrl(target) {
    const href = target.getAttribute('href');
    if (!href) {
        return null;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
        return null;
    }

    return url;
}

function setActiveNavItem(elements, route) {
    const navItems = elements.navList.querySelectorAll('md-list-item[data-page]');
    const activePage = route.type === 'page' ? route.page : 'home';

    navItems.forEach((item) => {
        const isActive = item.dataset.page === activePage;
        if (isActive) {
            item.setAttribute('aria-current', 'page');
            item.setAttribute('data-aria-current', 'page');
        } else {
            item.removeAttribute('aria-current');
            item.removeAttribute('data-aria-current');
        }
    });
}

function scrollAppMainToHash(elements, hash) {
    const targetId = decodeURIComponent(hash.slice(1));
    const target = targetId ? document.getElementById(targetId) : null;

    if (!target) {
        return false;
    }

    const mainRect = elements.appMain.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextScrollTop = elements.appMain.scrollTop + targetRect.top - mainRect.top;
    elements.appMain.scrollTo({
        top: nextScrollTop,
        behavior: 'smooth'
    });
    return true;
}

export function createRouter({elements, state, mobileQuery, closeMobileMenu}) {
    const renderRoute = async (route) => {
        setActiveNavItem(elements, route);
        elements.navList.hidden = false;

        const pageConfig = staticPages[route.page] || staticPages.home;
        const pageBody = typeof pageConfig.body === 'function' ? pageConfig.body({route}) : pageConfig.body;
        elements.pageContent.innerHTML = `
            <h1 class="page-title">${escapeHtml(pageConfig.title)}</h1>
            ${pageBody}
        `;
        pageConfig.init?.({elements, state, route});
    };

    const navigateTo = async (route, {replace = false, search = window.location.search} = {}) => {
        const normalizedRoute = parseRoute(buildPath(route));
        const nextPath = normalizedRoute.replacePath || buildPath(normalizedRoute);
        const nextSearch = normalizedRoute.type === 'page' && normalizedRoute.page === 'leaving' ? search : '';
        const nextUrl = `${nextPath}${nextSearch}`;

        if (replace) {
            history.replaceState(normalizedRoute, '', nextUrl);
        } else {
            history.pushState(normalizedRoute, '', nextUrl);
        }

        state.currentRoute = normalizedRoute;
        await renderRoute(normalizedRoute);
    };

    const init = () => {
        elements.navList.addEventListener('click', async (event) => {
            const navItem = event.target.closest('md-list-item[data-page]');
            if (!navItem) {
                return;
            }

            event.preventDefault();
            const currentLang = state.currentRoute?.lang || 'zh-CN';
            await navigateTo({lang: currentLang, type: 'page', page: navItem.dataset.page});

            if (mobileQuery.matches) {
                closeMobileMenu(false);
            }
        });

        elements.pageContent.addEventListener('click', async (event) => {
            if (event.defaultPrevented || isModifiedClick(event)) {
                return;
            }

            const target = findContentLinkTarget(event);
            if (!target || target.hasAttribute('download') || target.getAttribute('target') === '_blank') {
                return;
            }

            const url = resolveInternalUrl(target);
            if (!url) {
                return;
            }

            if (url.hash && url.pathname === window.location.pathname && scrollAppMainToHash(elements, url.hash)) {
                event.preventDefault();
                history.pushState(state.currentRoute, '', `${url.pathname}${url.search}${url.hash}`);
                return;
            }

            event.preventDefault();
            const route = parseRoute(url.pathname);
            await navigateTo(route, {search: url.search});

            if (mobileQuery.matches) {
                closeMobileMenu(false);
            }
        });

        window.addEventListener('popstate', async () => {
            const route = parseRoute(window.location.pathname);
            if (route.replacePath) {
                await navigateTo(route, {replace: true});
                return;
            }
            state.currentRoute = route;
            await renderRoute(route);
        });
    };

    return {
        init,
        navigateTo
    };
}
