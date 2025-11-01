import { spotifyService } from './spotify-service.js';
import { localAlbums } from './music-data.js';

// Función para formatear tiempo en mm:ss
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Funcionalidad para el reproductor de música
function durationToMs(duration) {
    const [minutes, seconds] = duration.split(':').map(Number);
    return (minutes * 60 + seconds) * 1000;
}

document.addEventListener('DOMContentLoaded', async function () {

    // Variables globales del reproductor
    let currentPlaylist = [];
    let currentTrackIndex = 0;
    let isShuffleActive = false;
    let repeatMode = 0;

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
    albumCards.forEach(card => {
        card.addEventListener('click', async function (e) {
            if (e.target.closest('.album-play-btn')) {
                return;
            }
            const albumTitle = this.querySelector('.album-title')?.textContent?.trim();
            const artistName = this.querySelector('.album-artist')?.textContent?.trim();
            const albumCover = this.querySelector('.album-cover img')?.src || '';

            await showAlbumPage(albumTitle, artistName, albumCover);
        });
    });

    document.body.addEventListener('click', async (e) => {
        const card = e.target.closest('.album-card');
        if (card && !e.target.closest('.album-play-btn')) {
            const albumTitle = card.querySelector('.album-title')?.textContent?.trim();
            const artistName = card.querySelector('.album-artist')?.textContent?.trim();
            const albumCover = card.querySelector('.album-cover img')?.src || '';
            if (albumTitle && artistName) {
                await showAlbumPage(albumTitle, artistName, albumCover);
            }
        }
    });

    // Función para mostrar la página del álbum
    async function showAlbumPage(albumTitle, artistName, localCover) {
        try {
            const localAlbum = localAlbums.find(album =>
                album.title.toLowerCase() === albumTitle.toLowerCase() &&
                album.artist.toLowerCase() === artistName.toLowerCase()
            );

            let albumData, artistData;

            const spotifyData = await (async () => {
                try {
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

                artistData = spotifyData?.artistData || {
                    name: localAlbum.artist,
                    images: [{ url: localCover }],
                    followers: { total: 0 }
                };
            } else if (spotifyData) {
                albumData = spotifyData.albumData;
                artistData = spotifyData.artistData;
            } else {
                const albumSearch = await spotifyService.searchAlbum(albumTitle, artistName);
                if (!albumSearch) {
                    throw new Error('No se pudo encontrar el álbum en Spotify');
                }

                albumData = await spotifyService.getAlbum(albumSearch.id);
                artistData = await spotifyService.getArtist(albumData.artists[0].id);
            }

            document.querySelector('.content').style.display = 'none';
            await createAlbumPage(albumData, artistData, localCover);

        } catch (error) {
            console.error('Error al cargar el álbum:', error);
            alert('Hubo un error al cargar el álbum: ' + error.message);
        }
    }

    // Función para reproducir una canción
    function playTrack(index) {
        if (index < 0 || index >= currentPlaylist.length) return;

        const track = currentPlaylist[index];
        currentTrackIndex = index;

        console.log('🎵 Reproduciendo:', track.name);

        // Remover clase 'playing' de todas las filas
        document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));

        // Añadir clase 'playing' a la fila actual
        if (track.row) track.row.classList.add('playing');

        // Detener audio anterior
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        // Crear y reproducir nuevo audio
        const audio = new Audio(track.audioFile);
        window.currentAudio = audio;

        // Guardar volumen actual antes de inicializar
        const currentVolume = window.savedVolume || 0.6;
        audio.volume = currentVolume;

        const volumeFill = document.querySelector('.volume-fill');
        if (volumeFill && !window.volumeInitialized) {
            volumeFill.style.width = '60%';
            window.volumeInitialized = true;
        }

        // Actualizar información del reproductor
        const playerAlbumCover = document.getElementById('playerAlbumCover');
        const playerTrackName = document.getElementById('playerTrackName');
        const playerArtistName = document.getElementById('playerArtistName');
        const playBtn = document.querySelector('.play-btn');
        const progressFill = document.querySelector('.progress-fill');

        if (playerAlbumCover) playerAlbumCover.src = track.cover;
        if (playerTrackName) playerTrackName.textContent = track.name;
        if (playerArtistName) playerArtistName.textContent = track.artist;
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

        // Activar contenedor del reproductor y barra de progreso
        const albumContainer = document.getElementById('playerAlbumContainer');
        const progressContainer = document.querySelector('.progress-container');
        if (albumContainer) albumContainer.classList.add('active');
        if (progressContainer) progressContainer.classList.add('active');

        // Actualizar progreso y tiempos
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                const currentTimeEl = document.getElementById('currentTime');
                const totalTimeEl = document.getElementById('totalTime');

                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }

                if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
                if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
            }
        });

        // Cuando carga la metadata
        audio.addEventListener('loadedmetadata', () => {
            const totalTimeEl = document.getElementById('totalTime');
            if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
        });

        // Cuando termine la canción
        audio.addEventListener('ended', () => {
            console.log('🎵 Canción terminada');

            if (repeatMode === 2) {
                // Repetir la canción actual
                audio.currentTime = 0;
                audio.play();
            } else {
                // Pasar a la siguiente
                playNext();
            }
        });

        // Reproducir
        audio.play().then(() => {
            console.log('✅ Reproduciendo:', track.audioFile);
        }).catch(error => {
            console.error('❌ Error al reproducir:', error);
        });
    }

    // Función para reproducir la siguiente canción
    function playNext() {
        if (currentPlaylist.length === 0) return;

        let nextIndex;

        if (isShuffleActive) {
            do {
                nextIndex = Math.floor(Math.random() * currentPlaylist.length);
            } while (nextIndex === currentTrackIndex && currentPlaylist.length > 1);
        } else {
            nextIndex = currentTrackIndex + 1;

            if (nextIndex >= currentPlaylist.length) {
                if (repeatMode === 1) {
                    nextIndex = 0;
                } else {
                    const playBtn = document.querySelector('.play-btn');
                    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));
                    return;
                }
            }
        }

        playTrack(nextIndex);
    }

    // Función para reproducir la canción anterior
    function playPrevious() {
        if (currentPlaylist.length === 0) return;

        if (window.currentAudio && window.currentAudio.currentTime > 3) {
            window.currentAudio.currentTime = 0;
            return;
        }

        let prevIndex;

        if (isShuffleActive) {
            do {
                prevIndex = Math.floor(Math.random() * currentPlaylist.length);
            } while (prevIndex === currentTrackIndex && currentPlaylist.length > 1);
        } else {
            prevIndex = currentTrackIndex - 1;

            if (prevIndex < 0) {
                prevIndex = currentPlaylist.length - 1;
            }
        }

        playTrack(prevIndex);
    }

    async function createAlbumPage(albumData, artistData, localCover) {
        let existingPage = document.querySelector('.album-page');
        if (existingPage) {
            existingPage.remove();
        }

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
                    <p style="color: #b3b3b3;">Cargando recomendaciones...</p>
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

        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(albumPage);
        mainContent.scrollTop = 0;

        // Botón de volver
        const backBtn = albumPage.querySelector('.back-button');
        backBtn.addEventListener('click', () => {
            albumPage.remove();
            document.querySelector('.content').style.display = 'block';
        });

        // Event listeners para las canciones 
        const trackRows = albumPage.querySelectorAll('.track-row');

        // Crear la playlist con todas las canciones
        currentPlaylist = Array.from(trackRows).map((row, idx) => ({
            audioFile: row.getAttribute('data-local-audio'),
            name: row.querySelector('.track-name')?.textContent || 'Sin título',
            artist: artistData.name,
            cover: localCover,
            row: row
        })).filter(track => track.audioFile);

        // Event listeners para las filas de canciones
        trackRows.forEach((row, index) => {
            row.addEventListener('click', function () {
                const audioFile = this.getAttribute('data-local-audio');

                if (!audioFile) {
                    alert('Esta canción no tiene audio disponible');
                    return;
                }

                currentTrackIndex = index;
                playTrack(index);
            });
        });

        // Handler para el botón de reproducir álbum
        const playAlbumBtn = albumPage.querySelector('.play-album-btn');
        if (playAlbumBtn) {
            playAlbumBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentPlaylist.length === 0) return;
                
                const globalPlayBtn = document.querySelector('.play-btn');
                
                // Si hay audio reproduciéndose
                if (window.currentAudio) {
                    if (window.currentAudio.paused) {
                        window.currentAudio.play();
                        if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        playAlbumBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    } else {
                        window.currentAudio.pause();
                        if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                        playAlbumBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    }
                } else {
                    // Iniciar reproducción desde la primera pista
                    currentTrackIndex = 0;
                    playTrack(0);
                }
            });
        }

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
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                this.classList.remove('active');
            }
        });

        // Botones de favorito de las canciones
        const trackFavoriteBtns = albumPage.querySelectorAll('.track-favorite-btn');
        trackFavoriteBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const icon = this.querySelector('i');

                if (icon.classList.contains('fa-regular')) {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                    this.classList.add('active');
                } else {
                    icon.classList.remove('fa-solid');
                    icon.classList.add('fa-regular');
                    this.classList.remove('active');
                }
            });
        });

        // Cargar recomendaciones
        try {
            if (albumData.artists[0]?.id && albumData.artists[0].id !== 'local') {
                const artistAlbumsResponse = await spotifyService.getArtistAlbums(albumData.artists[0].id);
                const artistAlbums = artistAlbumsResponse.items || artistAlbumsResponse;
                const filteredAlbums = artistAlbums.filter(album => album.id !== albumData.id).slice(0, 6);
                const recommendationsGrid = albumPage.querySelector('#recommendationsGrid');

                if (filteredAlbums.length > 0 && recommendationsGrid) {
                    recommendationsGrid.innerHTML = filteredAlbums.map(album => `
                        <div class="recommendation-card" data-album-name="${album.name.replace(/"/g, '&quot;')}" data-artist-name="${(album.artists[0]?.name || '').replace(/"/g, '&quot;')}" data-cover="${album.images[0]?.url || ''}">
                            <div class="album-cover">
                                <img src="${album.images[0]?.url || ''}" alt="${album.name}" class="recommendation-cover">
                                <button class="album-play-btn" aria-label="Reproducir álbum"></button>
                            </div>
                            <div class="recommendation-name" title="${album.name}">${album.name}</div>
                            <div class="recommendation-year">${album.release_date.split('-')[0]}</div>
                        </div>
                    `).join('');

                    // Agregar listeners a las tarjetas generadas
                    const recCards = recommendationsGrid.querySelectorAll('.recommendation-card');
                    recCards.forEach(card => {
                        const btn = card.querySelector('.album-play-btn');
                        const albumName = card.dataset.albumName;
                        const artistName = card.dataset.artistName;
                        const cover = card.dataset.cover;

                        if (btn) {
                            btn.addEventListener('click', (ev) => {
                                ev.stopPropagation();
                                showAlbumPage(albumName, artistName, cover);
                            });
                        }

                        card.addEventListener('click', () => {
                            showAlbumPage(albumName, artistName, cover);
                        });
                    });
                } else {
                    recommendationsGrid.innerHTML = '<p style="color: #b3b3b3;">No se encontraron más álbumes de este artista.</p>';
                }
            } else {
                const recommendationsGrid = albumPage.querySelector('#recommendationsGrid');
                if (recommendationsGrid) {
                    recommendationsGrid.innerHTML = '<p style="color: #b3b3b3;">No hay recomendaciones disponibles para álbumes locales.</p>';
                }
            }
        } catch (error) {
            console.error('Error al cargar álbumes recomendados:', error);
            const recommendationsGrid = albumPage.querySelector('#recommendationsGrid');
            if (recommendationsGrid) {
                recommendationsGrid.innerHTML = '<p style="color: #b3b3b3;">Error al cargar recomendaciones.</p>';
            }
        }
    }

    // ========== CONTROLES DEL REPRODUCTOR GLOBAL ==========
    
    // Botón Play/Pause
    const playBtn = document.querySelector('.player-controls .play-btn') || document.querySelector('.play-btn');
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

    // Botón Anterior
    const prevBtn = document.querySelector('.player-controls .control-btn:nth-child(2)');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => playPrevious());
    }

    // Botón Siguiente
    const nextBtn = document.querySelector('.player-controls .control-btn:nth-child(4)');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => playNext());
    }

    // Botón Aleatorio
    const shuffleBtn = document.querySelector('.shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            isShuffleActive = !isShuffleActive;
            shuffleBtn.classList.toggle('active', isShuffleActive);
            console.log('🔀 Aleatorio:', isShuffleActive);
        });
    }

    // Botón Repetir
    const repeatBtn = document.querySelector('.repeat-btn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            repeatMode = (repeatMode + 1) % 3;

            const icon = repeatBtn.querySelector('i');
            repeatBtn.classList.remove('active', 'repeat-one');

            if (repeatMode === 1) {
                repeatBtn.classList.add('active');
                icon.className = 'fa-solid fa-repeat';
                console.log('🔁 Repetir: playlist');
            } else if (repeatMode === 2) {
                repeatBtn.classList.add('active', 'repeat-one');
                icon.className = 'fa-solid fa-repeat-1';
                console.log('🔂 Repetir: canción');
            } else {
                icon.className = 'fa-solid fa-repeat';
                console.log('⏹️ Repetir: off');
            }
        });
    }

    // Barra de progreso
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (window.currentAudio && window.currentAudio.duration) {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                window.currentAudio.currentTime = percent * window.currentAudio.duration;
            }
        });
    }

    // Barra de volumen
    const volumeBar = document.querySelector('.volume-bar');
    if (volumeBar) {
        volumeBar.addEventListener('click', (e) => {
            if (window.currentAudio) {
                const rect = volumeBar.getBoundingClientRect();
                const volumePercent = (e.clientX - rect.left) / rect.width;
                const volumeFill = document.querySelector('.volume-fill');
                if (volumeFill) {
                    volumeFill.style.width = `${volumePercent * 100}%`;
                }
                window.currentAudio.volume = volumePercent;
                window.savedVolume = volumePercent;
            }
        });
    }
});