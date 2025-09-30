// Manejo de videos en modal
(() => {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="modal-panel">
            <div class="modal-content">
                <button class="modal-close" aria-label="Cerrar video">✕</button>
                <video id="videoPlayer" controls>
                    Tu navegador no soporta el elemento video.
                </video>
            </div>
            <div class="modal-meta">
                <strong class="modal-title">Título del video</strong>
                <div class="modal-artist">Artista</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const videoPlayer = modal.querySelector('#videoPlayer');
    const modalClose = modal.querySelector('.modal-close');
    const modalTitle = modal.querySelector('.modal-title');
    const modalArtist = modal.querySelector('.modal-artist');
    let lastFocused = null;

    function openModal(videoSrc, title = '', artist = '') {
        videoPlayer.src = videoSrc;
        modalTitle.textContent = title || 'Reproduciendo video';
        modalArtist.textContent = artist || '';

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        lastFocused = document.activeElement;
        modalClose.focus();
        document.body.style.overflow = 'hidden';
        
        // Reproducir automáticamente
        videoPlayer.play().catch(e => console.log('Reproducción automática bloqueada por el navegador'));
    }

    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        videoPlayer.pause();
        videoPlayer.src = ''; // Limpiar fuente
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    }

    // Eventos de cierre
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (ev) => {
        if (ev.target === modal) closeModal();
    });
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });

    // Adjuntar manejadores de reproducción
    document.querySelectorAll('.video-card').forEach(card => {
        const btn = card.querySelector('.video-play-btn');
        btn.addEventListener('click', function(ev) {
            ev.preventDefault();
            const videoSrc = card.getAttribute('data-video-src');
            const title = card.querySelector('.video-title')?.textContent || '';
            const artist = card.querySelector('.video-artist')?.textContent || '';
            openModal(videoSrc, title, artist);
        });
    });
})();