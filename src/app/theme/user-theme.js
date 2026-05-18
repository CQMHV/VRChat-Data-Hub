import {argbFromHex, Hct, hexFromArgb} from '@material/material-color-utilities';
import {clamp, normalizeHexColor} from './color-utils.js';
import {deleteCookie, getCookie, setCookie} from '../utils/cookies.js';
import {buildFullMaterialThemeCss} from './material-theme-generator.js';
import {
    COOKIE_MAX_AGE_SECONDS,
    DEFAULT_THEME_MODE,
    DEFAULT_THEME_SCHEME,
    DEFAULT_THEME_SOURCE_HEX,
    THEME_SCHEME_LABELS,
    THEME_SCHEME_NAMES,
    USER_THEME_COOKIE_KEY,
    USER_THEME_MODE_COOKIE_KEY,
    USER_THEME_SCHEME_COOKIE_KEY
} from './theme-config.js';

function normalizeThemeScheme(value) {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return THEME_SCHEME_NAMES.includes(normalized) ? normalized : DEFAULT_THEME_SCHEME;
}

export function createUserThemeController({rootElement, elements, state, systemThemeQuery}) {
    const {
        themePanelToggleBtn,
        themeControlsPanel,
        themeColorInput,
        themeColorTextInput,
        themeHueInput,
        themeChromaInput,
        themeToneInput,
        themeResetBtn,
        themeModeButtons,
        themeSchemeRadios,
        themeSchemeToggleBtn,
        themeSchemesList,
        themeSchemeToggleLabel
    } = elements;

    const isDarkThemeActive = () => {
        return state.userThemeMode === 'auto'
            ? systemThemeQuery.matches
            : state.userThemeMode === 'dark';
    };

    const applyRootThemeClass = () => {
        const darkEnabled = isDarkThemeActive();
        rootElement.classList.toggle('dark', darkEnabled);
        rootElement.classList.toggle('light', !darkEnabled);
    };

    const updateThemePanelTracks = (hue) => {
        rootElement.style.setProperty('--theme-hue', `${Math.round(hue)}`);
    };

    const syncThemeInputsFromHex = (sourceHex) => {
        if (!themeHueInput || !themeChromaInput || !themeToneInput) {
            return;
        }
        const hct = Hct.fromInt(argbFromHex(sourceHex));
        themeHueInput.value = Math.round(hct.hue);
        themeChromaInput.value = Math.round(clamp(hct.chroma, 0, 150));
        themeToneInput.value = Math.round(clamp(hct.tone, 0, 100));
        updateThemePanelTracks(hct.hue);
    };

    const buildHexFromHctInputs = () => {
        const hue = Number(themeHueInput?.value ?? 0);
        const chroma = Number(themeChromaInput?.value ?? 0);
        const tone = Number(themeToneInput?.value ?? 50);
        const sourceArgb = Hct.from(
            clamp(hue, 0, 360),
            clamp(chroma, 0, 150),
            clamp(tone, 0, 100)
        ).toInt();
        return hexFromArgb(sourceArgb);
    };

    const syncThemeModeButtons = () => {
        themeModeButtons.forEach((button) => {
            const isActive = button.dataset.themeMode === state.userThemeMode;
            button.selected = isActive;
        });
    };

    const syncThemeSchemeRadios = () => {
        themeSchemeRadios.forEach((radio) => {
            radio.checked = radio.value === state.userThemeScheme;
        });
        if (themeSchemeToggleLabel) {
            const label = THEME_SCHEME_LABELS[state.userThemeScheme] || THEME_SCHEME_LABELS[DEFAULT_THEME_SCHEME];
            themeSchemeToggleLabel.textContent = `配色方案：${label}`;
        }
    };

    const applyUserTheme = (sourceHex, {persist = true, syncControls = true} = {}) => {
        const normalizedHex = normalizeHexColor(sourceHex);
        if (!normalizedHex) {
            return false;
        }

        const cssText = buildFullMaterialThemeCss(normalizedHex, isDarkThemeActive(), state.userThemeScheme);
        let styleEl = document.getElementById('user-theme-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'user-theme-style';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = cssText;

        state.userThemeSourceHex = normalizedHex;
        if (themeColorInput) {
            themeColorInput.value = normalizedHex;
        }
        if (themeColorTextInput) {
            themeColorTextInput.value = normalizedHex;
        }
        if (syncControls) {
            syncThemeInputsFromHex(normalizedHex);
        }

        if (persist) {
            setCookie(USER_THEME_COOKIE_KEY, normalizedHex, COOKIE_MAX_AGE_SECONDS);
        }

        return true;
    };

    const setThemeMode = (mode, {persist = true} = {}) => {
        const normalized = mode === 'dark' || mode === 'light' ? mode : 'auto';
        state.userThemeMode = normalized;
        applyRootThemeClass();
        syncThemeModeButtons();

        if (persist) {
            setCookie(USER_THEME_MODE_COOKIE_KEY, normalized, COOKIE_MAX_AGE_SECONDS);
        }

        if (state.userThemeSourceHex) {
            applyUserTheme(state.userThemeSourceHex, {persist: false});
        }
    };

    const setThemeScheme = (schemeName, {persist = true} = {}) => {
        state.userThemeScheme = normalizeThemeScheme(schemeName);
        syncThemeSchemeRadios();
        if (persist) {
            setCookie(USER_THEME_SCHEME_COOKIE_KEY, state.userThemeScheme, COOKIE_MAX_AGE_SECONDS);
        }
        const sourceHex = state.userThemeSourceHex || DEFAULT_THEME_SOURCE_HEX;
        applyUserTheme(sourceHex, {persist: false});
    };

    const resetUserTheme = () => {
        state.userThemeSourceHex = null;
        deleteCookie(USER_THEME_COOKIE_KEY);
        document.getElementById('user-theme-style')?.remove();
        if (themeColorInput) {
            themeColorInput.value = DEFAULT_THEME_SOURCE_HEX;
        }
        if (themeColorTextInput) {
            themeColorTextInput.value = DEFAULT_THEME_SOURCE_HEX;
        }
        syncThemeInputsFromHex(DEFAULT_THEME_SOURCE_HEX);
        setThemeScheme(DEFAULT_THEME_SCHEME);
        setThemeMode(DEFAULT_THEME_MODE);
    };

    const openThemeSchemesList = () => {
        if (!themeSchemesList) {
            return;
        }
        themeSchemesList.removeAttribute('hidden');
        themeSchemesList.style.maxHeight = '0px';
        void themeSchemesList.offsetHeight;
        requestAnimationFrame(() => {
            themeSchemesList.classList.add('is-open');
            themeSchemesList.style.maxHeight = `${themeSchemesList.scrollHeight}px`;
            themeSchemeToggleBtn?.setAttribute('aria-expanded', 'true');
        });
    };

    const closeThemeSchemesList = ({immediate = false} = {}) => {
        if (!themeSchemesList) {
            return;
        }

        themeSchemesList.classList.remove('is-open');
        themeSchemeToggleBtn?.setAttribute('aria-expanded', 'false');

        if (immediate) {
            themeSchemesList.style.maxHeight = '0px';
            themeSchemesList.setAttribute('hidden', '');
            return;
        }

        themeSchemesList.style.maxHeight = `${themeSchemesList.scrollHeight}px`;
        void themeSchemesList.offsetHeight;
        themeSchemesList.style.maxHeight = '0px';

        const handleTransitionEnd = (event) => {
            if (event.propertyName !== 'max-height') {
                return;
            }
            if (!themeSchemesList.classList.contains('is-open')) {
                themeSchemesList.style.maxHeight = '0px';
                themeSchemesList.setAttribute('hidden', '');
            }
            themeSchemesList.removeEventListener('transitionend', handleTransitionEnd);
        };
        themeSchemesList.addEventListener('transitionend', handleTransitionEnd);
    };

    const updateThemePanelAnchor = () => {
        if (!themePanelToggleBtn || !themeControlsPanel) {
            return;
        }

        const spacing = 8;
        const viewportWidth = window.innerWidth;
        const toggleRect = themePanelToggleBtn.getBoundingClientRect();

        const right = clamp(viewportWidth - toggleRect.right, 8, 24);
        const top = toggleRect.bottom + spacing;

        themeControlsPanel.style.setProperty('--theme-panel-anchor-right', `${Math.round(right)}px`);
        themeControlsPanel.style.setProperty('--theme-panel-anchor-top', `${Math.round(top)}px`);
    };

    const openThemePanel = () => {
        if (!themeControlsPanel) {
            return;
        }
        updateThemePanelAnchor();
        themeControlsPanel.removeAttribute('hidden');
        requestAnimationFrame(() => {
            themeControlsPanel.classList.add('is-open');
            themePanelToggleBtn?.setAttribute('aria-expanded', 'true');
        });
    };

    const closeThemePanel = () => {
        if (!themeControlsPanel) {
            return;
        }
        themeControlsPanel.classList.remove('is-open');
        themePanelToggleBtn?.setAttribute('aria-expanded', 'false');
        const handleTransitionEnd = (event) => {
            if (event.propertyName !== 'transform') {
                return;
            }
            if (!themeControlsPanel.classList.contains('is-open')) {
                themeControlsPanel.setAttribute('hidden', '');
            }
            themeControlsPanel.removeEventListener('transitionend', handleTransitionEnd);
        };
        themeControlsPanel.addEventListener('transitionend', handleTransitionEnd);
    };

    const init = () => {
        const savedMode = getCookie(USER_THEME_MODE_COOKIE_KEY);
        setThemeMode(savedMode, {persist: false});
        const savedScheme = getCookie(USER_THEME_SCHEME_COOKIE_KEY);
        setThemeScheme(savedScheme, {persist: false});

        const savedThemeSource = normalizeHexColor(getCookie(USER_THEME_COOKIE_KEY));
        if (savedThemeSource) {
            applyUserTheme(savedThemeSource, {persist: false});
        } else if (themeColorInput && themeColorTextInput) {
            themeColorInput.value = DEFAULT_THEME_SOURCE_HEX;
            themeColorTextInput.value = DEFAULT_THEME_SOURCE_HEX;
            syncThemeInputsFromHex(DEFAULT_THEME_SOURCE_HEX);
        }

        themeColorInput?.addEventListener('input', () => {
            applyUserTheme(themeColorInput.value);
        });

        themeColorTextInput?.addEventListener('change', () => {
            const normalized = normalizeHexColor(themeColorTextInput.value);
            if (!normalized) {
                themeColorTextInput.value = state.userThemeSourceHex || DEFAULT_THEME_SOURCE_HEX;
                return;
            }
            applyUserTheme(normalized, {syncControls: false});
        });

        const handleHctSliderInput = () => {
            const nextHex = buildHexFromHctInputs();
            applyUserTheme(nextHex, {syncControls: false});
        };
        themeHueInput?.addEventListener('input', handleHctSliderInput);
        themeChromaInput?.addEventListener('input', handleHctSliderInput);
        themeToneInput?.addEventListener('input', handleHctSliderInput);

        themeModeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setThemeMode(button.dataset.themeMode);
            });
        });

        themeSchemeRadios.forEach((radio) => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    setThemeScheme(radio.value);
                    closeThemeSchemesList();
                }
            });
        });

        themeSchemeToggleBtn?.addEventListener('click', () => {
            if (!themeSchemesList) {
                return;
            }
            const isHidden = themeSchemesList.hasAttribute('hidden');
            if (isHidden) {
                openThemeSchemesList();
            } else {
                closeThemeSchemesList();
            }
        });

        themeResetBtn?.addEventListener('click', () => {
            resetUserTheme();
        });

        systemThemeQuery.addEventListener('change', () => {
            if (state.userThemeMode === 'auto' && state.userThemeSourceHex) {
                applyUserTheme(state.userThemeSourceHex, {persist: false});
            }
        });

        themePanelToggleBtn?.addEventListener('click', () => {
            if (!themeControlsPanel) {
                return;
            }
            const isHidden = themeControlsPanel.hasAttribute('hidden');
            if (isHidden) {
                openThemePanel();
            } else {
                closeThemePanel();
            }
        });

        window.addEventListener('resize', () => {
            if (themeControlsPanel && !themeControlsPanel.hasAttribute('hidden')) {
                updateThemePanelAnchor();
            }
        });
    };

    return {init};
}
