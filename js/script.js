import { spotifyService } from '/js/spotify-service.js';

// Funcionalidad para el reproductor de música
document.addEventListener('DOMContentLoaded', async function () {
    try {
        await spotifyService.initialize();
        console.log('Spotify inicializado correctamente');
        
        // Configuración del buscador
        const searchInput = document.querySelector('.search-bar input[type="search"]');
        const searchResults = document.createElement('div');
        searchResults.className = 'search-results';
        searchInput.parentElement.appendChild(searchResults);
        
        let searchTimeout;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length < 2) {
                searchResults.classList.remove('active');
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const results = await spotifyService.search(query);
                    displaySearchResults(results);
                } catch (error) {
                    console.error('Error en la búsqueda:', error);
                }
            }, 300);
        });

        // Ocultar resultados al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });

        function displaySearchResults(results) {
            searchResults.innerHTML = '';
            const allResults = [
                ...results.artists.map(item => ({ ...item, type: 'Artista' })),
                ...results.albums.map(item => ({ ...item, type: 'Álbum' })),
                ...results.tracks.map(item => ({ ...item, type: 'Canción' }))
            ];

            if (allResults.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item"><p class="search-result-title">No se encontraron resultados</p></div>';
                searchResults.classList.add('active');
                return;
            }

            allResults.forEach(item => {
                const resultElement = document.createElement('div');
                resultElement.className = 'search-result-item';
                
                const imageUrl = item.type === 'Artista' ? 
                               (item.images?.[0]?.url || 'assets/images/default-artist.webp') :
                               (item.type === 'Álbum' ? item.images?.[0]?.url : item.album?.images?.[0]?.url);
                
                const subtitle = item.type === 'Canción' ? 
                               `${item.artists?.[0]?.name} • ${item.album?.name}` :
                               (item.type === 'Álbum' ? item.artists?.[0]?.name : 
                               `${item.followers?.total?.toLocaleString() || 0} seguidores`);

                resultElement.innerHTML = `
                    <img class="search-result-image" src="${imageUrl}" alt="${item.name}">
                    <div class="search-result-info">
                        <div class="search-result-title">${item.name}</div>
                        <div class="search-result-subtitle">${subtitle}</div>
                    </div>
                    <span class="search-result-type">${item.type}</span>
                `;

                resultElement.addEventListener('click', () => {
                    handleSearchResultClick(item);
                });

                searchResults.appendChild(resultElement);
            });

            searchResults.classList.add('active');
        }

        function handleSearchResultClick(item) {
            switch (item.type) {
                case 'Artista':
                    console.log('Navegar a artista:', item.name);
                    break;
                case 'Álbum':
                    showAlbumPage(item.name, item.artists[0].name, item.images[0].url);
                    break;
                case 'Canción':
                    console.log('Reproducir:', item.name);
                    break;
            }
            searchResults.classList.remove('active');
            searchInput.value = '';
        }

    } catch (error) {
        console.error('Error al inicializar Spotify:', error);
    }

    // Botón de favorito en el reproductor
    const playerFavoriteBtn = document.querySelector('.player-favorite-btn');
    let isFavorite = false;

    playerFavoriteBtn.addEventListener('click', function () {
        isFavorite = !isFavorite;
        const icon = this.querySelector('i');
        if (isFavorite) {
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid');
            this.classList.add('active');
        } else {
            icon.classList.remove('fa-solid');
            icon.classList.add('fa-regular');
            this.classList.remove('active');
        }
    });

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
            await createAlbumPage(albumData, artistData, localCover);
        } catch (error) {
            console.error('Error al cargar el álbum:', error);
            const msg = (error && error.message) ? error.message : 'Hubo un error al cargar el álbum. Por favor intenta de nuevo.';
            alert(`Hubo un error al cargar el álbum: ${msg}`);
        }
    }

    async function createAlbumPage(albumData, artistData, localCover) {
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
                            <div class="track-row" 
                                data-preview="${track.preview_url || ''}"
                                data-local-audio="${track.local_audio || ''}"
                                data-track-index="${index}">
                                <span class="track-col-number" data-number="${index + 1}"></span>
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

                <div class="album-recommendations">
                    <h3 class="recommendations-title">Otros álbumes de ${artistData.name}</h3>
                    <div class="recommendations-grid" id="recommendationsGrid">
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <footer class="site-footer">
                <div class="footer-content">
                    <div class="footer-section">
                        <div class="footer-logo">
                            <div class="logo-icon">
                                <img src="assets/images/logo-img/logo-disc.webp" alt="Logo Player Demo" />
                            </div>
                            <span class="logo-text">Player <span class="highlight">Demo</span></span>
                        </div>
                        <p style="color: #b3b3b3; margin-bottom: 20px;">Tu música favorita, siempre con vos. Descubre nuevos artistas y disfruta de la mejor experiencia musical.</p>
                        <div class="social-icons">
                            <a href="#" class="social-icon" aria-label="Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" class="social-icon" aria-label="Twitter">
                                <i class="fa-brands fa-x-twitter"></i>
                            </a>
                            <a href="#" class="social-icon" aria-label="Instagram">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#" class="social-icon" aria-label="YouTube">
                                <i class="fab fa-youtube"></i>
                            </a>
                        </div>
                    </div>

                    <div class="footer-section">
                        <h3 class="footer-title">Recursos</h3>
                        <ul class="footer-links">
                            <li><a href="#">Acerca de Nosotros</a></li>
                            <li><a href="#">Planes Premium</a></li>
                            <li><a href="#">Para Artistas</a></li>
                            <li><a href="#">Desarrolladores</a></li>
                            <li><a href="#">Inversores</a></li>
                        </ul>
                    </div>

                    <div class="footer-section">
                        <h3 class="footer-title">Comunidad</h3>
                        <ul class="footer-links">
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Foro</a></li>
                            <li><a href="#">Eventos</a></li>
                            <li><a href="#">Merchandising</a></li>
                            <li><a href="#">Novedades</a></li>
                        </ul>
                    </div>

                    <div class="footer-section">
                        <h3 class="footer-title">Ayuda</h3>
                        <ul class="footer-links">
                            <li><a href="#">Soporte</a></li>
                            <li><a href="#">Centro de Ayuda</a></li>
                            <li><a href="#">Contacto</a></li>
                            <li><a href="#">Términos de Uso</a></li>
                            <li><a href="#">Privacidad</a></li>
                        </ul>
                    </div>
                </div>

                <div class="footer-bottom">
                    <p>&copy; 2025 Player Demo. Todos los derechos reservados.</p>
                </div>
            </footer>
        `;

        // Insertar en el DOM
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

        // Event listeners para las canciones 
        const trackRows = albumPage.querySelectorAll('.track-row');
        trackRows.forEach(row => {
            row.addEventListener('click', function () {
                const previewUrl = this.getAttribute('data-preview');
                if (previewUrl && previewUrl !== 'null') {
                    const audio = new Audio(previewUrl);
                    audio.play().catch(error => {
                        console.error('Error al reproducir:', error);
                    });
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
                e.stopPropagation();
                const icon = this.querySelector('i');

                if (icon.classList.contains('fa-regular')) {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                    this.classList.add('active');
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

        // Cargar álbumes recomendados del artista
        try {
            const artistAlbumsResponse = await spotifyService.getArtistAlbums(albumData.artists[0].id);
            const artistAlbums = artistAlbumsResponse.items || artistAlbumsResponse;

            // Filtrar para no mostrar el álbum actual
            const filteredAlbums = artistAlbums.filter(album => album.id !== albumData.id).slice(0, 6);

            // Buscar el grid de recomendaciones
            const recommendationsGrid = albumPage.querySelector('#recommendationsGrid');

            if (filteredAlbums.length > 0 && recommendationsGrid) {
                recommendationsGrid.innerHTML = filteredAlbums.map(album => `
    <div class="recommendation-card">
        <div class="album-cover">
            <img src="${album.images[0]?.url || ''}" alt="${album.name}" class="recommendation-cover">
            <button class="album-play-btn" aria-label="Reproducir álbum"></button>
        </div>
        <div class="recommendation-name" title="${album.name}">${album.name}</div>
        <div class="recommendation-year">${album.release_date.split('-')[0]}</div>
    </div>
`).join('');
            }
        } catch (error) {
            console.error('Error al cargar álbumes recomendados:', error);
        }
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
const progressBar = document.querySelector('.progress-bar');
const progressFill = document.querySelector('.progress-fill');
let isPlaying = false;

// Configurar eventos del reproductor
playerService.onTrackChange = (track) => {
    if (track) {
        playerTrackTitle.textContent = track.title;
        playerArtist.textContent = currentLocalAlbum?.artist || '';
        playerAlbumCover.src = currentLocalAlbum?.cover || '';
        totalTime.textContent = track.duration;
    }
};

playerService.onPlayStateChange = (isPlaying) => {
    if (playBtn) {
        playBtn.innerHTML = isPlaying ? '⏸' : '▶';
        const albumContainer = document.getElementById('playerAlbumContainer');
        if (albumContainer) {
            albumContainer.classList.toggle('active', isPlaying);
            if (progressBar) progressBar.classList.toggle('active', isPlaying);
        }
    }
};

playerService.onProgressChange = (progress) => {
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    if (currentTime && playerService.getCurrentTime()) {
        currentTime.textContent = formatDuration(playerService.getCurrentTime() * 1000);
    }
};

// Event listeners para controles del reproductor
if (playBtn) {
    playBtn.addEventListener('click', () => {
        playerService.togglePlay();
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        playerService.playPrevious();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        playerService.playNext();
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
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            updateProgress(progressBar, e);
        });
    }

    // Barra de volumen interactiva
    if (volumeBar) {
        volumeBar.addEventListener('click', (e) => {
            const rect = volumeBar.getBoundingClientRect();
            const volumePercent = ((e.clientX - rect.left) / rect.width);
            volumeFill.style.width = `${volumePercent * 100}%`;
            playerService.setVolume(volumePercent);
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