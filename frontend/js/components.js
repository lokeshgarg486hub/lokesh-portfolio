/* ==========================================================================
   LOKESH GARG - REUSABLE COMPONENTS & NAVIGATION ENGINE (components.js)
   6-Page Portfolio: Home, About, Skills, Works, Education, Contact
   Black & Orange Theme (#eb5d3a)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderFooter();
    initHeaderScroll();
    // Close mobile menu on nav link click
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-link')) {
            const menu = document.getElementById('nav-menu');
            const toggle = document.getElementById('mobile-toggle');
            if (menu) menu.classList.remove('active');
            if (toggle) toggle.innerHTML = '<i class="ri-menu-3-line"></i>';
        }
    });
});

/**
 * Renders the top navigation header across all 6 pages
 */
function renderNavbar() {
    const headerContainer = document.getElementById('main-header');
    if (!headerContainer) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const navLinks = [
        { name: 'Home',      url: 'index.html' },
        { name: 'About',     url: 'about.html' },
        { name: 'Skills',    url: 'skills.html' },
        { name: 'Works',     url: 'works.html' },
        { name: 'Blogs',     url: 'blogs.html' },
        { name: 'Education', url: 'education.html' },
        { name: 'Contact',   url: 'contact.html' }
    ];


    headerContainer.innerHTML = `
        <header id="site-header">
            <div class="container flex-between">

                <!-- Logo: Text-only "Lokesh Garg" -->
                <a href="index.html" class="nav-logo" aria-label="Lokesh Garg Portfolio Home">
                    <span class="nav-logo-text">Lokesh <span class="orange-highlight">Garg</span></span>
                </a>

                <!-- Nav Links -->
                <ul class="nav-menu" id="nav-menu" role="menubar">
                    ${navLinks.map(link => {
                        const isActive = currentPath === link.url || (currentPath === '' && link.url === 'index.html');
                        return `<li role="none"><a href="${link.url}" class="nav-link${isActive ? ' active' : ''}" role="menuitem">${link.name}</a></li>`;
                    }).join('')}
                </ul>

                <!-- CTA + Mobile Toggle -->
                <div class="flex-center gap-12">
                    <a href="contact.html" class="btn-primary btn-cta-nav hide-on-mobile">
                        Let's Connect <i class="ri-send-plane-fill"></i>
                    </a>
                    <button class="mobile-menu-toggle" id="mobile-toggle" aria-label="Toggle navigation menu" aria-expanded="false">

                        <i class="ri-menu-3-line"></i>
                    </button>
                </div>

            </div>
        </header>
    `;

    // Mobile menu drawer toggle
    const toggleBtn = document.getElementById('mobile-toggle');
    const menu = document.getElementById('nav-menu');
    if (toggleBtn && menu) {
        toggleBtn.addEventListener('click', () => {
            const isOpen = menu.classList.toggle('active');
            toggleBtn.setAttribute('aria-expanded', isOpen);
            toggleBtn.innerHTML = isOpen
                ? '<i class="ri-close-line"></i>'
                : '<i class="ri-menu-3-line"></i>';
        });
    }
}

/**
 * Renders the consistent footer across all 6 pages
 */
function renderFooter() {
    const footerContainer = document.getElementById('main-footer');
    if (!footerContainer) return;

    const currentYear = new Date().getFullYear();

    footerContainer.innerHTML = `
        <footer class="site-footer" role="contentinfo">
            <div class="container">
                <div class="footer-grid">

                    <div class="footer-brand">
                        <a href="index.html" class="nav-logo" aria-label="Home">
                            <span class="nav-logo-text">Lokesh <span class="orange-highlight">Garg</span></span>
                        </a>
                        <p class="footer-bio">
                            AI Engineer & Data Scientist specializing in Agentic AI, RAG Architectures, and scalable Machine Learning systems.
                        </p>
                        <div class="footer-socials">
                            <a href="https://github.com/lokeshgarg486hub" target="_blank" rel="noopener" class="btn-icon" aria-label="GitHub"><i class="ri-github-line"></i></a>
                            <a href="https://linkedin.com/in/lokesh-kumar-garg" target="_blank" rel="noopener" class="btn-icon" aria-label="LinkedIn"><i class="ri-linkedin-line"></i></a>
                            <a href="mailto:lokeshgarg486@gmail.com" class="btn-icon" aria-label="Email"><i class="ri-mail-line"></i></a>
                        </div>
                    </div>

                    <div class="footer-nav-col">
                        <h4 class="footer-col-title">Pages</h4>
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li><a href="about.html">About</a></li>
                            <li><a href="skills.html">Skills</a></li>
                            <li><a href="works.html">Works</a></li>
                            <li><a href="blogs.html">Blogs</a></li>
                            <li><a href="education.html">Education</a></li>
                            <li><a href="contact.html">Contact</a></li>
                        </ul>

                    </div>

                    <div class="footer-contact-col">
                        <h4 class="footer-col-title">Connect</h4>
                        <p><i class="ri-map-pin-line orange-highlight"></i> New Delhi, India</p>
                        <p><i class="ri-mail-send-line orange-highlight"></i> lokeshgarg486@gmail.com</p>
                        <p><i class="ri-checkbox-circle-line orange-highlight"></i> Open to Opportunities</p>
                    </div>

                </div>

                <div class="footer-bottom">
                    <p>&copy; ${currentYear} Lokesh Kumar Garg. All rights reserved.</p>
                    <p>Built with <span class="orange-highlight">Black &amp; Orange</span></p>
                </div>
            </div>
        </footer>
    `;
}

/**
 * Shrink navbar on scroll
 */
function initHeaderScroll() {
    const onScroll = () => {
        const header = document.getElementById('site-header');
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
}
