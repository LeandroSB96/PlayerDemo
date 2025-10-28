import { spotifyService } from './spotify-service.js';
import { localAlbums } from './music-data.js';

// Funcionalidad para el reproductor de música
// Función auxiliar para convertir duración "mm:ss" a milisegundos
function durationToMs(duration) {
    const [minutes, seconds] = duration.split(':').map(Number);
    return (minutes * 60 + seconds) * 1000;
}

// Función para reproducir audio local
function playLocalAudio(audioFile) {
    // Detener cualquier reproducción actual
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
    }

    // Crear nuevo audio y reproducir
    const audio = new Audio(audioFile);
    window.currentAudio = audio;

    audio.play().catch(error => {
        console.error('Error al reproducir audio local:', error);
        alert('Error al reproducir el archivo de audio. Asegúrate de que el archivo existe en la ruta especificada.');
    });

    // Eventos del audio
    audio.addEventListener('ended', () => {
        window.currentAudio = null;
        document.querySelectorAll('.track-row').forEach(row => row.classList.remove('playing'));
    });
}

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

        searchInput.addEventListener('input', function () {
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
        document.addEventListener('click', function (e) {
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
    console.log('DEBUG: número de album-card detectadas =', albumCards.length);
    albumCards.forEach(card => {
        card.addEventListener('click', async function (e) {
            console.log('DEBUG: click en album-card detectado');
            if (e.target.closest('.album-play-btn')) {
                console.log('DEBUG: click en album-play-btn — solo reproducir álbum');
                return;
            }
            const albumTitle = this.querySelector('.album-title')?.textContent?.trim();
            const artistName = this.querySelector('.album-artist')?.textContent?.trim();
            const albumCover = this.querySelector('.album-cover img')?.src || '';

            console.log('DEBUG: abrir showAlbumPage ->', { albumTitle, artistName, albumCover });

            await showAlbumPage(albumTitle, artistName, albumCover);
        });
    });

    // Delegated listener: fallback para clicks en album-card (asegura que funcione aunque no se adjunten listeners individuales)
    document.body.addEventListener('click', async (e) => {
        const card = e.target.closest('.album-card');
        if (card && !e.target.closest('.album-play-btn')) {
            const albumTitle = card.querySelector('.album-title')?.textContent?.trim();
            const artistName = card.querySelector('.album-artist')?.textContent?.trim();
            const albumCover = card.querySelector('.album-cover img')?.src || '';
            console.log('DEBUG: delegated click ->', { albumTitle, artistName, albumCover });
            if (albumTitle && artistName) {
                await showAlbumPage(albumTitle, artistName, albumCover);
            }
        }
    });

    // Función para mostrar la página del álbum
    async function showAlbumPage(albumTitle, artistName, localCover) {
        try {
            // Primero buscar en los álbumes locales
            const localAlbum = localAlbums.find(album =>
                album.title.toLowerCase() === albumTitle.toLowerCase() &&
                album.artist.toLowerCase() === artistName.toLowerCase()
            );

            let albumData, artistData;

            // Intentar obtener datos de Spotify primero
            const spotifyData = await (async () => {
                try {
                    console.log("Buscando en Spotify:", albumTitle, artistName);
                    const albumSearch = await spotifyService.searchAlbum(albumTitle, artistName);
                    if (albumSearch) {
                        const spotifyAlbumData = await spotifyService.getAlbum(albumSearch.id);
                        const spotifyArtistData = await spotifyService.getArtist(spotifyAlbumData.artists[0].id);
                        return { albumData: spotifyAlbumData, artistData: spotifyArtistData };
                    }
                } catch (error) {
                    console.warn("No se pudo obtener datos de Spotify:", error);
                }
                return null;
            })();

            if (localAlbum) {
                console.log("Encontré álbum local:", localAlbum);
                // Si encontramos el álbum localmente, usamos esos datos pero mantenemos metadatos de Spotify si existen
                albumData = {
                    id: localAlbum.id,
                    name: localAlbum.title,
                    artists: [{
                        id: spotifyData?.albumData?.artists[0]?.id || 'local',
                        name: localAlbum.artist
                    }],
                    release_date: localAlbum.releaseDate,
                    total_tracks: localAlbum.totalTracks,
                    tracks: {
                        items: localAlbum.tracks.map(track => ({
                            id: track.id,
                            name: track.title,
                            duration_ms: durationToMs(track.duration),
                            artists: [{ name: localAlbum.artist }],
                            preview_url: null,
                            local_audio: track.audioFile
                        }))
                    }
                };

                // Usar datos del artista de Spotify si están disponibles
                artistData = spotifyData?.artistData || {
                    name: localAlbum.artist,
                    images: [{ url: localCover }],
                    followers: { total: 0 }
                };
            } else if (spotifyData) {
                // Si no hay datos locales pero sí de Spotify, usar los de Spotify
                albumData = spotifyData.albumData;
                artistData = spotifyData.artistData;
            } else {
                console.log("Buscando en Spotify:", albumTitle, artistName);
                // Si no está en local, buscar en Spotify
                const albumSearch = await spotifyService.searchAlbum(albumTitle, artistName);
                if (!albumSearch) {
                    throw new Error('No se pudo encontrar el álbum en Spotify');
                }

                // Obtener detalles completos del álbum de Spotify
                albumData = await spotifyService.getAlbum(albumSearch.id);
                artistData = await spotifyService.getArtist(albumData.artists[0].id);
            }

            // Ocultar el contenido principal y mostrar la página del álbum
            document.querySelector('.content').style.display = 'none';
            await createAlbumPage(albumData, artistData, localCover);

        } catch (error) {
            console.error('Error al cargar el álbum:', error);
            alert('Hubo un error al cargar el álbum: ' + error.message);
        }
    }

    async function createAlbumPage(albumData, artistData, localCover, localAlbum = null) {
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

            // Buscar audio local por nombre de canción
            let audioFile = '';
            if (localAlbum && localAlbum.tracks) {
                const localTrack = localAlbum.tracks.find(t =>
                    t.title.toLowerCase().includes(track.name.toLowerCase()) ||
                    track.name.toLowerCase().includes(t.title.toLowerCase())
                );
                audioFile = localTrack?.audioFile || '';
            }
            return `
                            <div class="track-row" 
                                data-preview="${track.preview_url || ''}"
                                data-local-audio="${track.local_audio || ''}"
                                data-audio="${audioFile}"
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
                const audioFile = this.getAttribute('data-local-audio') || this.getAttribute('data-audio');
                const previewUrl = this.getAttribute('data-preview');
                const trackName = this.querySelector('.track-name')?.textContent || 'Sin título';

                console.log('🎵 Click en canción');
                console.log('   audioFile:', audioFile);

                // Remover clase 'playing' de todas las filas
                trackRows.forEach(r => r.classList.remove('playing'));

                if (audioFile && audioFile !== '') {
                    // Añadir clase 'playing' a la fila actual
                    this.classList.add('playing');

                    // Detener audio anterior
                    if (window.currentAudio) {
                        window.currentAudio.pause();
                        window.currentAudio = null;
                    }

                    // Crear y reproducir nuevo audio
                    const audio = new Audio(audioFile);
                    window.currentAudio = audio;

                    // Actualizar información del reproductor
                    const playerAlbumCover = document.getElementById('playerAlbumCover');
                    const playerTrackName = document.getElementById('playerTrackName');
                    const playerArtistName = document.getElementById('playerArtistName');
                    const playBtn = document.querySelector('.play-btn');
                    const progressFill = document.querySelector('.progress-fill');

                    if (playerAlbumCover) playerAlbumCover.src = localCover;
                    if (playerTrackName) playerTrackName.textContent = trackName;
                    if (playerArtistName) playerArtistName.textContent = artistData.name;
                    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

                    // Activar contenedor del reproductor y barra de progreso
                    const albumContainer = document.getElementById('playerAlbumContainer');
                    const progressBar = document.querySelector('.progress-bar');
                    if (albumContainer) albumContainer.classList.add('active');
                    if (progressBar) progressBar.classList.add('active');

                    // Actualizar progreso
                    audio.addEventListener('timeupdate', () => {
                        if (audio.duration) {
                            const progress = (audio.currentTime / audio.duration) * 100;
                            const progressBar = document.querySelector('.progress-bar');
                            if (progressFill) {
                                progressFill.style.width = `${progress}%`;
                                progressFill.style.opacity = '1';
                            }
                            if (progressBar) {
                                progressBar.classList.add('active');
                                progressBar.style.opacity = '1';
                            }
                        }
                    });

                    // Cuando termine
                    audio.addEventListener('ended', () => {
                        this.classList.remove('playing');
                        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                        window.currentAudio = null;
                    });

                    // Reproducir
                    audio.play().then(() => {
                        console.log('✅ Reproduciendo:', audioFile);
                    }).catch(error => {
                        console.error('❌ Error al reproducir:', error);
                        alert('No se pudo reproducir el audio.');
                    });

                } else if (previewUrl && previewUrl !== 'null') {
                    console.log('🎵 Preview de Spotify no implementado aún');
                } else {
                    alert('Esta canción no tiene audio disponible');
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
            // Si el artista tiene ID de Spotify, obtener recomendaciones
            if (albumData.artists[0]?.id && albumData.artists[0].id !== 'local') {
                console.log("Cargando recomendaciones de Spotify para:", albumData.artists[0].id);
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
    const prevBtn = document.querySelector('.control-btn:nth-child(2)');
    const nextBtn = document.querySelector('.control-btn:nth-child(4)');
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const volumeBar = document.querySelector('.volume-bar');
    const volumeFill = document.querySelector('.volume-fill');
    const playerAlbumCover = document.getElementById('playerAlbumCover');
    const playerTrackName = document.getElementById('playerTrackName');
    const playerArtistName = document.getElementById('playerArtistName');

    // Event listeners para controles del reproductor
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (window.currentAudio) {
                if (window.currentAudio.paused) {
                    window.currentAudio.play();
                    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                } else {
                    window.currentAudio.pause();
                    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            }
        });
    }

    // Barra de progreso interactiva
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (window.currentAudio && window.currentAudio.duration) {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                window.currentAudio.currentTime = percent * window.currentAudio.duration;
            }
        });
    }

    // Barra de volumen interactiva
    if (volumeBar) {
        volumeBar.addEventListener('click', (e) => {
            if (window.currentAudio) {
                const rect = volumeBar.getBoundingClientRect();
                const volumePercent = (e.clientX - rect.left) / rect.width;
                volumeFill.style.width = `${volumePercent * 100}%`;
                window.currentAudio.volume = volumePercent;
            }
        });
    }

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

    // Reproductor de audio local
    let currentAudio = null;

    function playLocalAudio(audioFile) {
        if (currentAudio) {
            currentAudio.pause();
        }

        currentAudio = new Audio(audioFile);
        currentAudio.play();

        console.log('Reproduciendo:', audioFile);

        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            playBtn.innerHTML = '⏸';
        }

        const albumContainer = document.getElementById('playerAlbumContainer');
        const progressBar = document.querySelector('.progress-bar');
        if (albumContainer) {
            albumContainer.classList.add('active');
            if (progressBar) progressBar.classList.add('active');
        }

        currentAudio.addEventListener('ended', () => {
            if (playBtn) playBtn.innerHTML = '▶';
        });
    }
});