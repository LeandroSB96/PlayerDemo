import { spotifyService } from './spotify-service.js';

// Funcionalidad para el reproductor de música
document.addEventListener('DOMContentLoaded', async function () {
    try {
        await spotifyService.initialize();
        console.log('Spotify inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar Spotify:', error);
    }

    // Event listeners para las cards de álbumes
    const albumCards = document.querySelectorAll('.album-card');
    albumCards.forEach(card => {
        card.addEventListener('click', async function (e) {
            if (e.target.closest('.album-play-btn')) return;
            const albumTitle = this.querySelector('.album-title').textContent;
            const artistName = this.querySelector('.album-artist').textContent;
            const albumCover = this.querySelector('.album-cover img').src;

            await showAlbumPage(albumTitle, artistName, albumCover);
        });
    });

    // Función para mostrar la página del álbum
    async function showAlbumPage(albumTitle, artistName, localCover) {
        try {
            // Buscar el álbum en Spotify
            const albumSearch = await spotifyService.searchAlbum(albumTitle, artistName);
            if (!albumSearch) {
                alert('No se pudo encontrar el álbum en Spotify');
                return;
            }

            // Obtener detalles completos del álbum
            const albumData = await spotifyService.getAlbum(albumSearch.id);
            const artistData = await spotifyService.getArtist(albumData.artists[0].id);

            // Ocultar el contenido principal y mostrar la página del álbum
            document.querySelector('.content').style.display = 'none';

            // Crear la página del álbum
            createAlbumPage(albumData, artistData, localCover);
        } catch (error) {
            console.error('Error al cargar el álbum:', error);
            alert('Hubo un error al cargar el álbum. Por favor intenta de nuevo.');
        }
    }

    function createAlbumPage(albumData, artistData, localCover) {
        // Verificar si ya existe y eliminarla
        let existingPage = document.querySelector('.album-page');
        if (existingPage) {
            existingPage.remove();
        }

        // Crear la página del álbum
        const albumPage = document.createElement('div');
        albumPage.className = 'album-page';
        albumPage.innerHTML = `
            <div class="album-page-header" style="background: linear-gradient(180deg, rgba(155, 75, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
                <button class="back-button">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="album-page-hero">
                    <img src="${localCover}" alt="${albumData.name}" class="album-page-cover">
                    <div class="album-page-info">
                        <span class="album-page-type">ÁLBUM</span>
                        <h1 class="album-page-title">${albumData.name}</h1>
                        <div class="album-page-meta">
                            <img src="${artistData.images[0]?.url || ''}" alt="${artistData.name}" class="artist-avatar-small">
                            <span class="artist-name-bold">${artistData.name}</span>
                            <span>•</span>
                            <span>${albumData.release_date.split('-')[0]}</span>
                            <span>•</span>
                            <span>${albumData.total_tracks} canciones</span>
                        </div>
                    </div>
                </div>
            </div>
            
     <div class="album-page-content">
    <div class="album-actions">
        <button class="play-album-btn">
            <i class="fa-solid fa-play"></i>
        </button>
        <button class="favorite-album-btn" aria-label="Me gusta">
            <i class="fa-regular fa-heart"></i>
        </button>
        <button class="shuffle-album-btn" aria-label="Aleatorio">
            <i class="fa-solid fa-shuffle"></i>
        </button>
    </div>
    
    <div class="album-tracks-list">
        <div class="tracks-header">
            <span class="track-col-number">#</span>
            <span class="track-col-title">Título</span>
            <span class="track-col-album">Álbum</span>
            <span class="track-col-heart"></span>
            <span class="track-col-duration"><i class="fa-regular fa-clock"></i></span>
        </div>
        ${albumData.tracks.items.map((track, index) => {
            const minutes = Math.floor(track.duration_ms / 60000);
            const seconds = ((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0');
            return `
                <div class="track-row" data-preview="${track.preview_url || ''}">
                    <span class="track-col-number">${index + 1}</span>
                    <div class="track-col-title">
                        <span class="track-name">${track.name}</span>
                        <span class="track-artists">${track.artists.map(a => a.name).join(', ')}</span>
                    </div>
                    <div class="track-col-album">
                        <span>${albumData.name}</span>
                    </div>
                    <button class="track-favorite-btn" aria-label="Me gusta">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                    <span class="track-col-duration">${minutes}:${seconds}</span>
                </div>
            `;
        }).join('')}
    </div>
                
                <div class="album-info-extra">
                    <p class="info-date">${new Date(albumData.release_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div class="artist-info-section">
                        <img src="${artistData.images[0]?.url || ''}" alt="${artistData.name}" class="artist-image-large">
                        <div>
                            <h3>${artistData.name}</h3>
                            <p>${artistData.followers?.total?.toLocaleString()} seguidores</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar después del header, dentro de main-content
        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(albumPage);

        // Scroll al inicio
        mainContent.scrollTop = 0;

        // Botón de volver
        const backBtn = albumPage.querySelector('.back-button');
        backBtn.addEventListener('click', () => {
            albumPage.remove();
            document.querySelector('.content').style.display = 'block';
        });

        // Event listeners para las canciones (opcional - para reproducir previews)
        const trackRows = albumPage.querySelectorAll('.track-row');
        trackRows.forEach(row => {
            row.addEventListener('click', function () {
                const previewUrl = this.getAttribute('data-preview');
                if (previewUrl && previewUrl !== 'null') {
                    console.log('Reproducir preview:', previewUrl);
                } else {
                    console.log('No hay preview disponible para esta canción');
                }
            });
        });

        // Botón de favorito del álbum
        const favoriteAlbumBtn = albumPage.querySelector('.favorite-album-btn');
        let isAlbumFavorite = false;

        favoriteAlbumBtn.addEventListener('click', function () {
            isAlbumFavorite = !isAlbumFavorite;
            const icon = this.querySelector('i');

            if (isAlbumFavorite) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                this.classList.add('active');
                // Animación
                this.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 300);
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                this.classList.remove('active');
            }
        });

        // Botón de aleatorio del álbum
        const shuffleBtn = albumPage.querySelector('.shuffle-album-btn');
        shuffleBtn.addEventListener('click', function () {
            console.log('Reproducir álbum en modo aleatorio');
            this.classList.toggle('active');
        });

        // Botones de favorito en cada canción
        const trackFavoriteBtns = albumPage.querySelectorAll('.track-favorite-btn');
        trackFavoriteBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation(); // Evitar que se active el click de la fila
                const icon = this.querySelector('i');

                if (icon.classList.contains('fa-regular')) {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                    this.classList.add('active');
                    // Animación
                    this.style.transform = 'scale(1.3)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 300);
                } else {
                    icon.classList.remove('fa-solid');
                    icon.classList.add('fa-regular');
                    this.classList.remove('active');
                }
            });
        });
    }

    // Navegación activa en tabs principales
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            navTabs.forEach(t => t.classList.remove('active'));
            navTabs.forEach(t => t.removeAttribute('aria-current'));

            this.classList.add('active');
            this.setAttribute('aria-current', 'page');
        });
    });

    // Navegación activa en menú lateral
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            menuItems.forEach(i => i.classList.remove('active'));
            menuItems.forEach(i => i.removeAttribute('aria-current'));

            this.classList.add('active');
            this.setAttribute('aria-current', 'page');
        });
    });

    // Control del reproductor
    const playBtn = document.querySelector('.play-btn');
    let isPlaying = false;

    if (playBtn) {
        playBtn.addEventListener('click', function () {
            isPlaying = !isPlaying;
            this.innerHTML = isPlaying ? '⏸' : '▶';
            this.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');

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

        progressBar.addEventListener('mouseenter', function () {
            this.style.height = '6px';
        });

        progressBar.addEventListener('mouseleave', function () {
            this.style.height = '4px';
        });
    }

    // Barra de volumen interactiva
    const volumeBar = document.querySelector('.volume-bar');
    if (volumeBar) {
        volumeBar.addEventListener('click', (e) => {
            updateProgress(volumeBar, e);
        });

        volumeBar.addEventListener('mouseenter', function () {
            this.style.height = '6px';
        });

        volumeBar.addEventListener('mouseleave', function () {
            this.style.height = '4px';
        });
    }

    // Navegación por teclado para cards
    const cards = document.querySelectorAll('.album-card, .artist-card');
    cards.forEach(card => {
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.style.transform = 'translateY(-8px)';
                setTimeout(() => {
                    this.style.transform = 'translateY(-5px)';
                }, 100);
                console.log('Reproduciendo:', this.querySelector('.album-title, .artist-name')?.textContent);
            }
        });
    });
});