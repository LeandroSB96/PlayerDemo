// Funcionalidad para el reproductor de música
document.addEventListener('DOMContentLoaded', function() {
    
    // Navegación activa en tabs principales
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            navTabs.forEach(t => t.classList.remove('active'));
            navTabs.forEach(t => t.removeAttribute('aria-current'));
            
            // Agregar clase active al tab clickeado
            this.classList.add('active');
            this.setAttribute('aria-current', 'page');
            });
        });
    });

    // Navegación activa en menú lateral
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            menuItems.forEach(i => i.classList.remove('active'));
            menuItems.forEach(i => i.removeAttribute('aria-current'));
            
            // Agregar clase active al item clickeado
            this.classList.add('active');
            this.setAttribute('aria-current', 'page');
        });
    });

    // Control del reproductor
    const playBtn = document.querySelector('.play-btn');
    let isPlaying = false;
    
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            isPlaying = !isPlaying;
            this.innerHTML = isPlaying ? '⏸' : '▶';
            this.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
            
            // Animación visual del botón
            this.style.transform = isPlaying ? 'scale(1.1)' : 'scale(1)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }

    // Función para actualizar barras de progreso
    function updateProgress(bar, event) {
        const rect = bar.getBoundingClientRect();
        const percent = ((event.clientX - rect.left) / rect.width) * 100;
        const clampedPercent = Math.max(0, Math.min(100, percent));
        
        const fill = bar.querySelector('.progress-fill, .volume-fill');
        if (fill) {
            fill.style.width = clampedPercent + '%';
        }
    }
    
    // Barra de progreso interactiva
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            updateProgress(progressBar, e);
        });
        
        // Efecto hover en la barra de progreso
        progressBar.addEventListener('mouseenter', function() {
            this.style.height = '6px';
        });
        
        progressBar.addEventListener('mouseleave', function() {
            this.style.height = '4px';
        });
    }
    
    // Barra de volumen interactiva
    const volumeBar = document.querySelector('.volume-bar');
    if (volumeBar) {
        volumeBar.addEventListener('click', (e) => {
            updateProgress(volumeBar, e);
        });
        
        // Efecto hover en la barra de volumen
        volumeBar.addEventListener('mouseenter', function() {
            this.style.height = '6px';
        });
        
        volumeBar.addEventListener('mouseleave', function() {
            this.style.height = '4px';
        });
    }

    // Navegación por teclado para cards
    const cards = document.querySelectorAll('.album-card, .artist-card');
    cards.forEach(card => {
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Simular click en el card
                this.style.transform = 'translateY(-8px)';
                setTimeout(() => {
                    this.style.transform = 'translateY(-5px)';
                }, 100);
                console.log('Reproduciendo:', this.querySelector('.album-title, .artist-name')?.textContent);
            }
        });
    });
