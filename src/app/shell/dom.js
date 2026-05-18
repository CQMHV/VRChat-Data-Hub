export const rootElement = document.documentElement;

export const elements = {
    menuBtn: document.getElementById('menu-btn'),
    appNav: document.getElementById('app-nav'),
    navBackdrop: document.getElementById('nav-backdrop'),
    appMain: document.querySelector('.app-main'),
    appHeader: document.querySelector('.app-header'),
    appHeaderTitle: document.getElementById('app-header-title'),
    navList: document.getElementById('nav-list'),
    pageContent: document.getElementById('page-content'),
    themePanelToggleBtn: document.getElementById('theme-panel-toggle-btn'),
    themeControlsPanel: document.getElementById('theme-controls-panel'),
    themeColorInput: document.getElementById('theme-color-input'),
    themeColorTextInput: document.getElementById('theme-color-text'),
    themeHueInput: document.getElementById('theme-hue-input'),
    themeChromaInput: document.getElementById('theme-chroma-input'),
    themeToneInput: document.getElementById('theme-tone-input'),
    themeResetBtn: document.getElementById('theme-reset-btn'),
    themeModeButtons: Array.from(document.querySelectorAll('[data-theme-mode]')),
    themeSchemeRadios: Array.from(document.querySelectorAll('md-radio[name="theme-scheme"]')),
    themeSchemeToggleBtn: document.getElementById('theme-scheme-toggle-btn'),
    themeSchemesList: document.getElementById('theme-schemes-list'),
    themeSchemeToggleLabel: document.getElementById('theme-scheme-toggle-label')
};

export const mobileQuery = window.matchMedia('(max-width: 1500px)');
export const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function hasRequiredElements() {
    return Boolean(
        elements.menuBtn
        && elements.appNav
        && elements.navBackdrop
        && elements.navList
        && elements.pageContent
        && elements.appHeaderTitle
    );
}
