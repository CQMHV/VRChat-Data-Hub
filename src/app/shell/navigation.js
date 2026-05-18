export function createNavigationController({elements, mobileQuery}) {
    const {
        menuBtn,
        appNav,
        navBackdrop,
        appMain,
        appHeader
    } = elements;

    const updateAriaAndInert = () => {
        const isOpen = mobileQuery.matches
            ? appNav.classList.contains('mobile-open')
            : !appNav.classList.contains('desktop-closed');

        menuBtn.setAttribute('aria-expanded', isOpen);
        menuBtn.setAttribute('aria-label', isOpen ? '关闭导航菜单' : '打开导航菜单');

        if (isOpen) {
            appNav.removeAttribute('inert');
        } else {
            appNav.setAttribute('inert', '');
        }

        if (mobileQuery.matches && isOpen) {
            appMain?.setAttribute('inert', '');
            appHeader?.setAttribute('inert', '');
            navBackdrop.setAttribute('aria-hidden', 'false');
        } else {
            appMain?.removeAttribute('inert');
            appHeader?.removeAttribute('inert');
            navBackdrop.setAttribute('aria-hidden', 'true');
        }
    };

    const closeMobileMenu = (restoreFocus = true) => {
        if (!mobileQuery.matches) {
            return;
        }

        appNav.classList.remove('mobile-open');
        navBackdrop.classList.remove('mobile-open');
        updateAriaAndInert();

        if (restoreFocus) {
            menuBtn.focus();
        }
    };

    const toggleMenu = () => {
        if (mobileQuery.matches) {
            appNav.classList.toggle('mobile-open');
            navBackdrop.classList.toggle('mobile-open');
            if (appNav.classList.contains('mobile-open')) {
                requestAnimationFrame(() => {
                    const firstNavButton = appNav.querySelector('md-list-item');
                    firstNavButton?.focus();
                });
            }
        } else {
            appNav.classList.toggle('desktop-closed');
        }
        updateAriaAndInert();
    };

    const init = () => {
        menuBtn.addEventListener('click', toggleMenu);

        navBackdrop.addEventListener('click', () => {
            if (mobileQuery.matches) {
                closeMobileMenu(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && mobileQuery.matches && appNav.classList.contains('mobile-open')) {
                closeMobileMenu(true);
            }
        });

        mobileQuery.addEventListener('change', () => {
            if (!mobileQuery.matches) {
                appNav.classList.remove('mobile-open');
                navBackdrop.classList.remove('mobile-open');
            }
            updateAriaAndInert();
        });

        updateAriaAndInert();
    };

    return {
        closeMobileMenu,
        init
    };
}
