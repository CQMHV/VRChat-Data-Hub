import './app/platform/material-components.js';
import {DEFAULT_THEME_MODE, DEFAULT_THEME_SCHEME} from './app/theme/theme-config.js';
import {elements, hasRequiredElements, mobileQuery, rootElement, systemThemeQuery} from './app/shell/dom.js';
import {gateFonts} from './app/platform/fonts.js';
import {createNavigationController} from './app/shell/navigation.js';
import {registerServiceWorker} from './app/platform/pwa.js';
import {createRouter} from './app/shell/router.js';
import {createUserThemeController} from './app/theme/user-theme.js';
import {parseRoute} from './app/shell/routes.js';

const appState = {
    currentRoute: null,
    userThemeSourceHex: null,
    userThemeMode: DEFAULT_THEME_MODE,
    userThemeScheme: DEFAULT_THEME_SCHEME
};

async function initApp() {
    gateFonts(rootElement);

    const themeController = createUserThemeController({
        rootElement,
        elements,
        state: appState,
        systemThemeQuery
    });
    themeController.init();

    if (!hasRequiredElements()) {
        return;
    }

    const navigationController = createNavigationController({elements, mobileQuery});
    navigationController.init();

    const router = createRouter({
        elements,
        state: appState,
        mobileQuery,
        closeMobileMenu: navigationController.closeMobileMenu
    });
    router.init();

    const initialRoute = parseRoute(window.location.pathname);
    appState.currentRoute = initialRoute;
    await router.navigateTo(initialRoute, {replace: true});
}

initApp().catch((error) => {
    console.error('应用初始化失败', error);
});
registerServiceWorker();
