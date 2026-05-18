import {staticPages} from '../pages/index.js';

export function normalizeLang(rawLang) {
    return rawLang === 'en' ? 'en' : 'zh-CN';
}

export function parseRoute(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const first = segments[0];
    const hasLangPrefix = first === 'zh-CN' || first === 'en';
    const lang = normalizeLang(hasLangPrefix ? first : 'zh-CN');
    const coreSegments = hasLangPrefix ? segments.slice(1) : segments;

    if (coreSegments.length === 0) {
        return {lang, type: 'page', page: 'home', replacePath: buildPath({lang, type: 'page', page: 'home'})};
    }

    if (staticPages[coreSegments[0]]) {
        return {lang, type: 'page', page: coreSegments[0]};
    }

    return {lang, type: 'page', page: 'home'};
}

export function buildPath(route) {
    const langPrefix = route.lang === 'zh-CN' ? '' : `/${route.lang}`;

    if (route.type === 'page') {
        return `${langPrefix}/${route.page}`;
    }

    return '/';
}
