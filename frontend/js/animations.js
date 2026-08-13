/* ==========================================================================
   LOKESH GARG - ANIMATIONS & SCROLL ENGINE (animations.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initScrollProgress();
    initScrollToTop();
    initAnimatedCounters();
});

/**
 * Scroll Reveal using IntersectionObserver
 */
function initScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));
}

/**
 * Top Scroll Progress Indicator
 */
function initScrollProgress() {
    let progressBar = document.getElementById('scroll-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress';
        document.body.appendChild(progressBar);
    }

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
    });
}

/**
 * Scroll To Top Floating Button
 */
function initScrollToTop() {
    let btn = document.getElementById('scroll-top-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'scroll-top-btn';
        btn.setAttribute('aria-label', 'Scroll to top');
        btn.innerHTML = '<i class="ri-arrow-up-line"></i>';
        document.body.appendChild(btn);
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Animated Numerical Counters for Quick Stats
 */
function initAnimatedCounters() {
    const counterElements = document.querySelectorAll('.counter-value');
    if (!counterElements.length) return;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = parseFloat(target.getAttribute('data-target') || '0');
                const duration = 2000;
                const startTime = performance.now();
                const isFloat = endValue % 1 !== 0;

                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const currentValue = progress * endValue;

                    target.textContent = isFloat ? currentValue.toFixed(2) : Math.floor(currentValue);

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        target.textContent = isFloat ? endValue.toFixed(2) : endValue;
                    }
                }

                requestAnimationFrame(update);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    counterElements.forEach((el) => observer.observe(el));
}
