/* ==========================================================================
   LOKESH GARG - THEME & AMBIENT EFFECTS ENGINE (theme.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAmbientBlobs();
    initMouseSpotlight();
});

/**
 * Injects ambient floating background blobs dynamically
 */
function initAmbientBlobs() {
    if (document.querySelector('.blob-container')) return;

    const container = document.createElement('div');
    container.className = 'blob-container';
    container.innerHTML = `
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
    `;
    document.body.prepend(container);
}

/**
 * Tracks mouse movement over glassmorphism cards to create an interactive purple spotlight glow
 */
function initMouseSpotlight() {
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // Ensure mouse-spotlight element exists inside card
            if (!card.querySelector('.mouse-spotlight')) {
                const spotlight = document.createElement('div');
                spotlight.className = 'mouse-spotlight';
                card.appendChild(spotlight);
            }
        });
    });
}
