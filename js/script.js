// Importar módulos 
import { spotifyService } from './spotify-service.js';
import { localAlbums } from './music-data.js';
import { favoritesManager } from './favorites-manager.js';
import { playlistSystem } from './playlist-system.js';
import { showPlaylistModal, showPlaylistsPage } from './playlist-ui.js';
import { showExplorePage } from './explore-page.js';
import { showArtistsPage } from './artists-page.js';

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

// Función para mostrar modal de confirmación 
function showConfirmationModal(options = {}) {
    return new Promise((resolve) => {
        const {
            title = '¿Estás seguro?',
            message = '¿Confirmar acción?',
            confirmText = 'Eliminar',
            cancelText = 'Cancelar',
            icon = '⚠️'
        } = options;

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-modal-overlay';

        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.innerHTML = `
            <div class="confirmation-modal-header">
                <span class="confirmation-modal-icon">${icon}</span>
                <h2 class="confirmation-modal-title">${title}</h2>
                <p class="confirmation-modal-message">${message}</p>
            </div>
            <div class="confirmation-modal-actions">
                <button class="confirmation-modal-btn confirmation-modal-btn-cancel">${cancelText}</button>
                <button class="confirmation-modal-btn confirmation-modal-btn-confirm">${confirmText}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Handlers
        const cancelBtn = modal.querySelector('.confirmation-modal-btn-cancel');
        const confirmBtn = modal.querySelector('.confirmation-modal-btn-confirm');

        const closeModal = () => {
            overlay.remove();
        };

        cancelBtn.addEventListener('click', () => {
            closeModal();
            resolve(false);
        });

        confirmBtn.addEventListener('click', () => {
            closeModal();
            resolve(true);
        });

        // Cerrar al hacer click en el overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
                resolve(false);
            }
        });

        // Cerrar con ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEsc);
                closeModal();
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// ========================================
// MINI-PLAYER FLOTANTE
// ========================================

function initMiniPlayer() {
    const miniPlayerWrapper = document.querySelector('.mini-player-wrapper');
    const miniPlayerToggle = document.querySelector('.mini-player-toggle');
    const miniPlayerExpanded = document.querySelector('.mini-player-expanded');
    const miniPlayerClose = document.querySelector('.mini-player-close');
    const miniPlayerCover = document.getElementById('miniPlayerCover');
    const miniPlayerToggleCover = document.getElementById('miniPlayerToggleCover');
    const miniPlayerSongName = document.getElementById('miniPlayerSongName');
    const miniPlayerArtistName = document.getElementById('miniPlayerArtistName');
    const miniPlayBtn = document.querySelector('.mini-play-btn');
    const miniPrevBtn = document.querySelector('.mini-prev-btn');
    const miniNextBtn = document.querySelector('.mini-next-btn');
    const miniCurrentTime = document.getElementById('miniCurrentTime');
    const miniTotalTime = document.getElementById('miniTotalTime');
    const miniProgressFill = document.querySelector('.mini-progress-fill');
    const miniProgressBar = document.querySelector('.mini-progress-bar');
    const miniVolumeFill = document.querySelector('.mini-volume-fill');
    const miniVolumeBar = document.querySelector('.mini-volume-bar');

    let isMiniPlayerExpanded = false;

    // Mostrar mini-player toggle solo cuando hay reproducción
    function showMiniPlayerToggle() {
        miniPlayerToggle.classList.add('visible');
    }

    function hideMiniPlayerToggle() {
        miniPlayerToggle.classList.remove('visible');
        miniPlayerToggle.classList.remove('hidden');
        isMiniPlayerExpanded = false;
        miniPlayerExpanded.classList.remove('active');
    }

    // Toggle mini-player (expand/collapse)
    miniPlayerToggle.addEventListener('click', () => {
        isMiniPlayerExpanded = !isMiniPlayerExpanded;
        
        if (isMiniPlayerExpanded) {
            miniPlayerToggle.classList.add('hidden');
            miniPlayerExpanded.classList.add('active');
        } else {
            miniPlayerToggle.classList.remove('hidden');
            miniPlayerExpanded.classList.remove('active');
        }
    });

    // Cerrar mini-player
    miniPlayerClose.addEventListener('click', () => {
        isMiniPlayerExpanded = false;
        miniPlayerToggle.classList.remove('hidden');
        miniPlayerExpanded.classList.remove('active');
    });

    // Controles de reproducción
    miniPlayBtn.addEventListener('click', () => {
        const globalPlayBtn = document.querySelector('.play-btn');
        if (window.currentAudio) {
            if (window.currentAudio.paused) {
                window.currentAudio.play();
                miniPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            } else {
                window.currentAudio.pause();
                miniPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        }
    });

    miniPrevBtn.addEventListener('click', () => {
        window.dispatchEvent(new Event('mini-player:prev'));
    });

    miniNextBtn.addEventListener('click', () => {
        window.dispatchEvent(new Event('mini-player:next'));
    });

    // Control de progreso
    miniProgressBar.addEventListener('click', (e) => {
        if (!window.currentAudio) return;
        const rect = miniProgressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        window.currentAudio.currentTime = percent * window.currentAudio.duration;
    });

    // Control de volumen
    miniVolumeBar.addEventListener('click', (e) => {
        const rect = miniVolumeBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const volume = Math.max(0, Math.min(1, percent));
        
        if (window.currentAudio) {
            window.currentAudio.volume = volume;
            window.savedVolume = volume;
        }
        miniVolumeFill.style.width = `${volume * 100}%`;
    });

    // Actualizar mini-player cuando se reproduce una canción
    window.addEventListener('mini-player:update', (e) => {
        const { cover, songName, artistName } = e.detail;
        
        miniPlayerCover.src = cover;
        miniPlayerToggleCover.src = cover;
        miniPlayerSongName.textContent = songName;
        miniPlayerArtistName.textContent = artistName;
        
        showMiniPlayerToggle();
    });

    // Actualizar barra de progreso
    window.addEventListener('mini-player:progress', (e) => {
        const { current, total } = e.detail;
        miniCurrentTime.textContent = formatTime(current);
        miniTotalTime.textContent = formatTime(total);
        
        if (total > 0) {
            miniProgressFill.style.width = `${(current / total) * 100}%`;
        }
    });

    // Actualizar estado del botón play/pausa
    window.addEventListener('mini-player:play-state', (e) => {
        const { isPlaying } = e.detail;
        miniPlayBtn.innerHTML = isPlaying 
            ? '<i class="fa-solid fa-pause"></i>'
            : '<i class="fa-solid fa-play"></i>';
    });

    return {
        updateTrack: (cover, songName, artistName) => {
            window.dispatchEvent(new CustomEvent('mini-player:update', {
                detail: { cover, songName, artistName }
            }));
        },
        updateProgress: (current, total) => {
            window.dispatchEvent(new CustomEvent('mini-player:progress', {
                detail: { current, total }
            }));
        },
        updatePlayState: (isPlaying) => {
            window.dispatchEvent(new CustomEvent('mini-player:play-state', {
                detail: { isPlaying }
            }));
        },
        showToggle: showMiniPlayerToggle,
        hideToggle: hideMiniPlayerToggle
    };
}

document.addEventListener('DOMContentLoaded', async function () {

    // VARIABLES GLOBALES
    let currentPlaylist = [];
    let currentTrackIndex = 0;
    let isShuffleActive = false;
    let repeatMode = 0;

    // FUNCIONES AUXILIARES
    function showNotification(message) {
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    function updateFavoritesCounter() {
        const counter = document.querySelector('.favorites-counter');
        if (counter) {
            counter.textContent = favoritesManager.getFavoritesCount();
        }
    }

    function updatePlaylistsCounter() {
        const counter = document.querySelector('.playlists-counter');
        if (counter) {
            counter.textContent = playlistSystem.getPlaylistCount();
        }
    }

    // FUNCIONES DE REPRODUCCIÓN
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

    function playTrack(index) {
        if (index < 0 || index >= currentPlaylist.length) return;

        const track = currentPlaylist[index];
        currentTrackIndex = index;

        document.querySelectorAll('.track-row').forEach(r => r.classList.remove('playing'));
        if (track.row) track.row.classList.add('playing');

        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        const audio = new Audio(track.audioFile);
        window.currentAudio = audio;

        const currentVolume = window.savedVolume || 0.6;
        audio.volume = currentVolume;

        const volumeFill = document.querySelector('.volume-fill');
        if (volumeFill && !window.volumeInitialized) {
            volumeFill.style.width = '60%';
            window.volumeInitialized = true;
        }

        const playerAlbumCover = document.getElementById('playerAlbumCover');
        const playerTrackName = document.getElementById('playerTrackName');
        const playerArtistName = document.getElementById('playerArtistName');
        const playerPlayBtn = document.querySelector('.play-btn');

        if (playerAlbumCover) playerAlbumCover.src = track.cover;
        if (playerTrackName) playerTrackName.textContent = track.name;
        if (playerArtistName) playerArtistName.textContent = track.artist;
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

        // Actualizar mini-player
        miniPlayer.updateTrack(track.cover, track.name, track.artist);

        const albumContainer = document.getElementById('playerAlbumContainer');
        const progressContainer = document.querySelector('.progress-container');
        if (albumContainer) albumContainer.classList.add('active');
        if (progressContainer) progressContainer.classList.add('active');

        audio.addEventListener('loadedmetadata', () => {
            const totalTimeEl = document.getElementById('totalTime');
            const progressFill = document.querySelector('.progress-fill');
            if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
            if (progressFill) progressFill.style.width = '0%';
        });

        audio.addEventListener('timeupdate', () => {
            if (!isNaN(audio.duration) && isFinite(audio.duration)) {
                const progress = (audio.currentTime / audio.duration) * 100;
                const currentTimeEl = document.getElementById('currentTime');
                const totalTimeEl = document.getElementById('totalTime');
                const progressFill = document.querySelector('.progress-fill');

                if (progressFill) progressFill.style.width = `${progress}%`;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
                if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);

                // Actualizar mini-player
                miniPlayer.updateProgress(audio.currentTime, audio.duration);
            }
        });

        audio.addEventListener('ended', () => {
            if (repeatMode === 2) {
                audio.currentTime = 0;
                audio.play();
            } else {
                playNext();
            }
        });

        audio.play().then(() => {
            miniPlayer.updatePlayState(true);
            
            const playerFavBtn = document.querySelector('.player-favorite-btn');
            if (playerFavBtn) {
                const isFav = favoritesManager.isFavorite(track.name, track.artist, track.album || 'Desconocido');
                const icon = playerFavBtn.querySelector('i');

                if (isFav) {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                    playerFavBtn.classList.add('active');
                } else {
                    icon.classList.remove('fa-solid');
                    icon.classList.add('fa-regular');
                    playerFavBtn.classList.remove('active');
                }
            }
        }).catch(error => {
            console.error('❌ Error al reproducir:', error);
        });
    }

    // FUNCIONES DELEGADAS PARA PLAYLISTS 
    document.body.addEventListener('click', function (e) {
        const playlistBtn = e.target.closest('.player-add-playlist-btn, .track-add-playlist-btn, .album-add-playlist-btn');
        if (playlistBtn) {
            e.stopPropagation();

            let track = null;
            let album = null;

            // Si es desde el reproductor
            if (playlistBtn.classList.contains('player-add-playlist-btn')) {
                if (!window.currentAudio || currentPlaylist.length === 0) {
                    showNotification('⚠️ No hay canción reproduciéndose');
                    return;
                }
                const ct = currentPlaylist[currentTrackIndex];
                if (!ct) return;

                track = {
                    name: ct.name,
                    artist: ct.artist,
                    album: ct.album || 'Desconocido',
                    cover: ct.cover,
                    audioFile: ct.audioFile,
                    duration: ct.duration || formatTime(window.currentAudio?.duration || 0)
                };
            }
            // Si es para agregar un álbum completo
            if (playlistBtn.classList.contains('album-add-playlist-btn')) {
                const albumPage = playlistBtn.closest('.album-page');
                if (!albumPage) return;
                const albumTitle = albumPage.querySelector('.album-page-title')?.textContent || '';
                const albumCover = albumPage.querySelector('.album-page-cover')?.src || '';
                // Construir álbum a partir de currentPlaylist
                const tracks = (currentPlaylist || []).map(t => ({
                    name: t.name,
                    artist: t.artist,
                    album: t.album || albumTitle,
                    cover: t.cover,
                    audioFile: t.audioFile,
                    duration: t.duration
                }));
                album = {
                    name: albumTitle,
                    artist: tracks[0]?.artist || '',
                    cover: albumCover,
                    tracks
                };
            }

            // Si es desde una fila de track
            else if (playlistBtn.classList.contains('track-add-playlist-btn')) {
                const row = playlistBtn.closest('.track-row');
                if (!row) return;

                // Intentar obtener datos canónicos de currentPlaylist
                const idxAttr = row.getAttribute('data-track-index');
                if (idxAttr && currentPlaylist[parseInt(idxAttr)]) {
                    const base = currentPlaylist[parseInt(idxAttr)];
                    track = {
                        name: base.name,
                        artist: base.artist,
                        album: base.album,
                        cover: base.cover,
                        audioFile: base.audioFile,
                        duration: base.duration
                    };
                } else {
                    // Fallback: reconstruir desde DOM
                    track = {
                        name: row.querySelector('.track-name')?.textContent?.trim() || 'Sin título',
                        artist: row.querySelector('.track-artists')?.textContent?.trim() || '',
                        album: row.getAttribute('data-album') || row.querySelector('.track-col-album span')?.textContent?.trim() || 'Desconocido',
                        cover: row.getAttribute('data-cover') || '',
                        audioFile: row.getAttribute('data-local-audio') || '',
                        duration: row.querySelector('.track-col-duration')?.textContent?.trim() || '0:00'
                    };
                }
            }

            if (album) {
                console.log('[Playlists] Mostrando modal para album:', album);
                showPlaylistModal(album, () => {
                    updatePlaylistsCounter();
                });
            } else if (track) {
                console.log('[Playlists] Mostrando modal para track:', track);
                showPlaylistModal(track, () => {
                    updatePlaylistsCounter();
                });
            }
        }
    });

    // Botón de playlists en la sidebar (si existe)
    const playlistsBtnNav = document.querySelector('.playlists-btn-nav');
    if (playlistsBtnNav) {
        playlistsBtnNav.addEventListener('click', () => {
            showPlaylistsPage(() => {
                updatePlaylistsCounter();
            });
            updatePlaylistsCounter();
        });
    }

    // Listener para reproducir playlist completa
    window.addEventListener('playlist:play', (e) => {
        const { playlistId, tracks } = e.detail;
        if (tracks && tracks.length > 0) {
            currentPlaylist = tracks.map((track, idx) => ({
                audioFile: track.audioFile,
                name: track.name,
                artist: track.artist,
                album: track.album,
                cover: track.cover
            }));
            currentTrackIndex = 0;
            playTrack(0);
        }
    });

    // Listener para reproducir track específico de playlist
    window.addEventListener('playlist:playTrack', (e) => {
        const { playlistId, track } = e.detail;
        // Solo necesitamos encontrar el índice y reproducir
        const idx = currentPlaylist.findIndex(t => t.audioFile === track.audioFile);
        if (idx >= 0) {
            currentTrackIndex = idx;
            playTrack(idx);
        }
    });

    // FUNCIONES DE FAVORITOS
    function showEmptyFavoritesPage() {
        const existingPages = document.querySelectorAll('.album-page, .favorites-page, .playlists-page, .explore-page, .artists-page');
        existingPages.forEach(page => page.remove());

        // Ocultar contenido principal
        document.querySelector('.content').style.display = 'none';

        // Crear página de favoritos vacía
        const emptyFavoritesPage = document.createElement('div');
        emptyFavoritesPage.className = 'favorites-page album-page';
        emptyFavoritesPage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(255, 75, 155, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="favorites-icon" style="width: 232px; height: 232px; display: flex; align-items: center; justify-content: center; background: rgba(255, 75, 155, 0.1); border-radius: 8px;">
                    <i class="fa-solid fa-heart" style="font-size: 120px; color: #ff4b9b;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">TU COLECCIÓN</span>
                    <h1 class="album-page-title">Favoritos</h1>
                    <div class="album-page-meta">
                        <span>0 canciones</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="album-page-content">
            <div class="empty-favorites-state" style="text-align: center; padding: 80px 20px; max-width: 600px; margin: 0 auto;">
                <div style="font-size: 80px; margin-bottom: 24px; opacity: 0.5;">
                    <i class="fa-regular fa-heart"></i>
                </div>
                <h2 style="color: #fff; font-size: 32px; font-weight: 700; margin-bottom: 16px;">
                    No tienes favoritos aún
                </h2>
                <p style="color: #b3b3b3; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                    Empieza a construir tu colección de canciones favoritas. 
                    Dale clic al corazón ❤️ en cualquier canción que te guste y aparecerá aquí.
                </p>
                <button class="explore-music-btn" style="padding: 14px 32px; background: linear-gradient(131deg, rgba(115, 59, 161, 1) 31%, rgba(207, 9, 253, 1) 71%); border: none; border-radius: 25px; color: white; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-music"></i>
                    Explorar Música
                </button>
            </div>
        </div>

        <footer class="site-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-logo">
                        <div class="logo-icon">
                            <img src="assets/images/logo-img/logo-disc.webp" alt="Logo Player Demo" />
                        </div>
                        <span class="logo-text">Player <span class="highlight">Demo</span></span>
                    </div>
                    <p style="color: #b3b3b3; margin-bottom: 20px;">Tu música favorita, siempre con vos.</p>
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
                    </ul>
                </div>

                <div class="footer-section">
                    <h3 class="footer-title">Comunidad</h3>
                    <ul class="footer-links">
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Eventos</a></li>
                    </ul>
                </div>

                <div class="footer-section">
                    <h3 class="footer-title">Ayuda</h3>
                    <ul class="footer-links">
                        <li><a href="#">Soporte</a></li>
                        <li><a href="#">Contacto</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Player Demo. Todos los derechos reservados.</p>
            </div>
        </footer>
    `;

        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(emptyFavoritesPage);
        mainContent.scrollTop = 0;

        // Botón de regresar
        emptyFavoritesPage.querySelector('.back-button').addEventListener('click', () => {
            emptyFavoritesPage.remove();
            document.querySelector('.content').style.display = 'block';
        });

        // Botón de explorar música
        emptyFavoritesPage.querySelector('.explore-music-btn').addEventListener('click', () => {
            emptyFavoritesPage.remove();
            document.querySelector('.content').style.display = 'block';
        });
    }

    // FUNCIONES DE FAVORITOS
    function showFavoritesPage() {
        const existingFavPage = document.querySelector('.favorites-page');
        if (existingFavPage) existingFavPage.remove();

        const existingAlbumPage = document.querySelector('.album-page:not(.favorites-page)');
        if (existingAlbumPage) existingAlbumPage.remove();

        const favorites = favoritesManager.getFavoritesByDate();

        if (favorites.length === 0) {
            showEmptyFavoritesPage();
            return;
        }

        document.querySelector('.content').style.display = 'none';

        const favoritesPage = document.createElement('div');
        favoritesPage.className = 'favorites-page album-page';
        favoritesPage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(255, 75, 155, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="favorites-icon">
                    <i class="fa-solid fa-heart" style="font-size: 120px; color: #ff4b9b;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">PLAYLIST</span>
                    <h1 class="album-page-title">Tus Favoritos</h1>
                    <div class="album-page-meta">
                        <span>${favorites.length} canciones</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="album-page-content">
            <div class="album-actions">
                <button class="play-favorites-btn">
                    <i class="fa-solid fa-play"></i>
                </button>
                <button class="shuffle-favorites-btn" aria-label="Aleatorio">
                    <i class="fa-solid fa-shuffle"></i>
                </button>
                <button class="clear-favorites-btn" aria-label="Limpiar favoritos">
                    <i class="fa-solid fa-trash"></i>
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
                ${favorites.map((track, index) => `
                    <div class="track-row" 
                        data-local-audio="${track.audioFile || ''}"
                        data-track-index="${index}">
                        <span class="track-col-number" data-number="${index + 1}"></span>
                        <div class="track-col-title">
                            <span class="track-name">${track.name}</span>
                            <span class="track-artists">${track.artist}</span>
                        </div>
                        <div class="track-col-album">
                            <span>${track.album}</span>
                        </div>
                        <div class="track-col-heart">
                            <button class="track-favorite-btn active" aria-label="Quitar de favoritos">
                                <i class="fa-solid fa-heart"></i>
                            </button>
                        </div>
                        <span class="track-col-duration">${track.duration}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(favoritesPage);
        mainContent.scrollTop = 0;

        // Botón de regresar
        favoritesPage.querySelector('.back-button').addEventListener('click', () => {
            favoritesPage.remove();
            document.querySelector('.content').style.display = 'block';
        });

        // Crear playlist de tracks
        const trackRows = favoritesPage.querySelectorAll('.track-row');
        currentPlaylist = favorites.map((track, idx) => ({
            audioFile: track.audioFile,
            name: track.name,
            artist: track.artist,
            album: track.album,
            cover: track.cover,
            row: trackRows[idx]
        }));

        // Clicks en tracks
        trackRows.forEach((row, index) => {
            row.addEventListener('click', function () {
                const audioFile = this.getAttribute('data-local-audio');
                if (audioFile) {
                    currentTrackIndex = index;
                    playTrack(index);
                }
            });
        });

        // Botones de favoritos individuales
        const favBtns = favoritesPage.querySelectorAll('.track-favorite-btn');
        favBtns.forEach((btn, index) => {
            btn.addEventListener('click', async function (e) {
                e.stopPropagation();
                const track = favorites[index];

                const confirmed = await showConfirmationModal({
                    title: 'Quitar de Favoritos',
                    message: `¿Deseas eliminar "${track.name}" de tus favoritos?`,
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    icon: '💔'
                });

                if (confirmed) {
                    favoritesManager.removeFavorite(track.name, track.artist, track.album);
                    showNotification('💔 Removido de favoritos');
                    updateFavoritesCounter();
                    favoritesPage.remove();
                    showFavoritesPage();
                }
            });
        });

        // Botón de limpiar todos los favoritos
        favoritesPage.querySelector('.clear-favorites-btn').addEventListener('click', async () => {
            const confirmed = await showConfirmationModal({
                title: 'Eliminar Todos los Favoritos',
                message: '¿Eliminar todos los favoritos? Esta acción no se puede deshacer.',
                confirmText: 'Eliminar Todo',
                cancelText: 'Cancelar',
                icon: '🗑️'
            });

            if (confirmed) {
                favoritesManager.clearAllFavorites();
                favoritesPage.remove();
                document.querySelector('.content').style.display = 'block';
                showNotification('🗑️ Favoritos eliminados');
                updateFavoritesCounter();
            }
        });

        // Botón de reproducir
        const playFavoritesBtn = favoritesPage.querySelector('.play-favorites-btn');
        if (playFavoritesBtn) {
            playFavoritesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentPlaylist.length === 0) return;

                const globalPlayBtn = document.querySelector('.play-btn');

                if (window.currentAudio) {
                    if (window.currentAudio.paused) {
                        window.currentAudio.play();
                        if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        playFavoritesBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    } else {
                        window.currentAudio.pause();
                        if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                        playFavoritesBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    }
                } else {
                    currentTrackIndex = 0;
                    playTrack(0);
                }
            });
        }

        // Botón de shuffle
        const shuffleFavoritesBtn = favoritesPage.querySelector('.shuffle-favorites-btn');
        if (shuffleFavoritesBtn) {
            shuffleFavoritesBtn.addEventListener('click', () => {
                isShuffleActive = !isShuffleActive;
                shuffleFavoritesBtn.classList.toggle('active', isShuffleActive);

                if (isShuffleActive) {
                    shuffleFavoritesBtn.style.borderColor = '#ab1db9';
                    shuffleFavoritesBtn.style.color = '#b633bd';
                } else {
                    shuffleFavoritesBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    shuffleFavoritesBtn.style.color = '#b3b3b3';
                }
            });
        }
    }

    // Función showAlbumPage 
    async function showAlbumPage(albumTitle, artistName, localCover) {
        try {
            const localAlbum = localAlbums.find(album =>
                album.title.toLowerCase() === albumTitle.toLowerCase() &&
                album.artist.toLowerCase() === artistName.toLowerCase()
            );

            let albumData, artistData;

            // Obtener datos de Spotify para información adicional
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

            // PRIORIZAR SIEMPRE EL ÁLBUM LOCAL SI EXISTE
            if (localAlbum) {
                console.log('✅ Usando álbum local:', localAlbum.title);
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
                console.log('⚠️ Álbum no encontrado localmente, usando Spotify');
                albumData = spotifyData.albumData;
                artistData = spotifyData.artistData;

                // INTENTAR ENCONTRAR ARCHIVOS LOCALES POR NOMBRE DE CANCIÓN
                albumData.tracks.items = albumData.tracks.items.map(track => {
                    const matchingLocalAlbum = localAlbums.find(la =>
                        la.artist.toLowerCase() === artistName.toLowerCase()
                    );

                    if (matchingLocalAlbum) {
                        const matchingTrack = matchingLocalAlbum.tracks.find(lt =>
                            lt.title.toLowerCase().includes(track.name.toLowerCase()) ||
                            track.name.toLowerCase().includes(lt.title.toLowerCase())
                        );

                        if (matchingTrack) {
                            console.log(`✅ Audio local encontrado para: ${track.name}`);
                            track.local_audio = matchingTrack.audioFile;
                        }
                    }

                    return track;
                });
            } else {
                throw new Error('No se pudo encontrar el álbum en Spotify ni localmente');
            }

            document.querySelector('.content').style.display = 'none';
            await createAlbumPage(albumData, artistData, localCover);

        } catch (error) {
            console.error('❌ Error al cargar el álbum:', error);
            alert('Hubo un error al cargar el álbum: ' + error.message);
        }
    }

    // Crear la página del álbum
    async function createAlbumPage(albumData, artistData, localCover) {
        let existingPage = document.querySelector('.album-page');
        if (existingPage) existingPage.remove();

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
                            <div class="track-col-heart">
                                <button class="track-favorite-btn" aria-label="Me gusta">
                                    <i class="fa-regular fa-heart"></i>
                                </button>
                            </div>
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

        const backBtn = albumPage.querySelector('.back-button');
        backBtn.addEventListener('click', () => {
            albumPage.remove();
            document.querySelector('.content').style.display = 'block';
        });

        const trackRows = albumPage.querySelectorAll('.track-row');

        currentPlaylist = Array.from(trackRows).map((row, idx) => ({
            audioFile: row.getAttribute('data-local-audio'),
            name: row.querySelector('.track-name')?.textContent || 'Sin título',
            artist: artistData.name,
            album: albumData.name,
            cover: localCover,
            row: row
        })).filter(track => track.audioFile);

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

            const trackFavBtn = row.querySelector('.track-favorite-btn');
            if (trackFavBtn) {
                const trackName = row.querySelector('.track-name')?.textContent;
                const artistName = artistData.name;
                const albumName = albumData.name;

                const isFav = favoritesManager.isFavorite(trackName, artistName, albumName);
                const icon = trackFavBtn.querySelector('i');

                if (isFav) {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                    trackFavBtn.classList.add('active');
                }

                trackFavBtn.addEventListener('click', function (e) {
                    e.stopPropagation();

                    const durationEl = row.querySelector('.track-col-duration');
                    const duration = durationEl ? durationEl.textContent : '0:00';

                    const track = {
                        name: trackName,
                        artist: artistName,
                        album: albumName,
                        cover: localCover,
                        audioFile: row.getAttribute('data-local-audio'),
                        duration: duration
                    };

                    favoritesManager.toggleFavorite(track);
                    const icon = this.querySelector('i');

                    if (icon.classList.contains('fa-regular')) {
                        icon.classList.remove('fa-regular');
                        icon.classList.add('fa-solid');
                        this.classList.add('active');
                        showNotification('❤️ Agregado a favoritos');
                    } else {
                        icon.classList.remove('fa-solid');
                        icon.classList.add('fa-regular');
                        this.classList.remove('active');
                        showNotification('💔 Removido de favoritos');
                    }

                    updateFavoritesCounter();
                });
            }

            const heartContainer = row.querySelector('.track-col-heart');
            if (heartContainer) {
                const addToPlaylistBtn = document.createElement('button');
                addToPlaylistBtn.className = 'track-add-playlist-btn';
                addToPlaylistBtn.setAttribute('aria-label', 'Agregar a playlist');
                addToPlaylistBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
                addToPlaylistBtn.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    color: #b3b3b3;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    margin-left: 8px;
                `;

                heartContainer.appendChild(addToPlaylistBtn);

                row.addEventListener('mouseenter', () => {
                    addToPlaylistBtn.style.opacity = '1';
                });
                row.addEventListener('mouseleave', () => {
                    addToPlaylistBtn.style.opacity = '0';
                });
            }
        });

        const playAlbumBtn = albumPage.querySelector('.play-album-btn');
        if (playAlbumBtn) {
            playAlbumBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentPlaylist.length === 0) return;

                const globalPlayBtn = document.querySelector('.play-btn');

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
                    currentTrackIndex = 0;
                    playTrack(0);
                }
            });
        }

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

    // Inicialización de la aplicación
    const progressFill = document.querySelector('.progress-fill');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');

    if (progressFill) progressFill.style.width = '0%';
    if (currentTimeEl) currentTimeEl.textContent = '0:00';
    if (totalTimeEl) totalTimeEl.textContent = '0:00';

    // Inicializar mini-player
    const miniPlayer = initMiniPlayer();

    // Event listeners para controles del mini-player
    window.addEventListener('mini-player:prev', () => {
        playPrevious();
    });

    window.addEventListener('mini-player:next', () => {
        playNext();
    });

    try {
        await spotifyService.initialize();
        console.log('Spotify inicializado correctamente');

        const favoritesNavBtn = document.getElementById('favoritesNavBtn');
        if (favoritesNavBtn) {
            favoritesNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showFavoritesPage();
            });
        }

        const playlistsNavBtn = document.getElementById('playlistsNavBtn');
        if (playlistsNavBtn) {
            playlistsNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showPlaylistsPage(() => {
                    updatePlaylistsCounter();
                });
            });
        }

        updateFavoritesCounter();
        updatePlaylistsCounter();

        // Click en carátula del reproductor para abrir mini-player
        const playerAlbumSection = document.getElementById('playerAlbumSection');
        if (playerAlbumSection) {
            playerAlbumSection.addEventListener('click', () => {
                const miniPlayerToggle = document.querySelector('.mini-player-toggle');
                const miniPlayerExpanded = document.querySelector('.mini-player-expanded');
                
                // Si el toggle está visible, abrir el mini-player
                if (miniPlayerToggle.classList.contains('visible') && !miniPlayerToggle.classList.contains('hidden')) {
                    miniPlayerToggle.classList.add('hidden');
                    miniPlayerExpanded.classList.add('active');
                }
            });
        }

        // Botón de Explorar en el sidebar
        const exploreNavBtn = document.querySelectorAll('.menu-item')[1];
        if (exploreNavBtn) {
            exploreNavBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await showExplorePage(showAlbumPage);
            });
        }

        // Botón de Artistas en el sidebar
        const artistsNavBtn = document.querySelectorAll('.menu-item')[4];
        if (artistsNavBtn) {
            artistsNavBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await showArtistsPage();
            });
        }

        // Búsqueda global
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

    const playerFavoriteBtn = document.querySelector('.player-favorite-btn');
    if (playerFavoriteBtn) {
        playerFavoriteBtn.addEventListener('click', function () {
            if (!window.currentAudio || currentPlaylist.length === 0) {
                showNotification('⚠️ No hay canción reproduciéndose');
                return;
            }

            const currentTrack = currentPlaylist[currentTrackIndex];

            if (!currentTrack) {
                showNotification('⚠️ Error al obtener información de la canción');
                return;
            }

            const duration = window.currentAudio.duration
                ? formatTime(window.currentAudio.duration)
                : currentTrack.duration || '0:00';

            const track = {
                name: currentTrack.name,
                artist: currentTrack.artist,
                album: currentTrack.album || 'Desconocido',
                cover: currentTrack.cover,
                audioFile: currentTrack.audioFile,
                duration: duration
            };

            const isFavorite = favoritesManager.isFavorite(track.name, track.artist, track.album);
            const icon = this.querySelector('i');

            if (isFavorite) {
                favoritesManager.removeFavorite(track.name, track.artist, track.album);
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                this.classList.remove('active');
                showNotification('💔 Removido de favoritos');
            } else {
                favoritesManager.addFavorite(track);
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                this.classList.add('active');
                showNotification('❤️ Agregado a favoritos');
            }

            updateFavoritesCounter();

            const trackRow = currentTrack.row;
            if (trackRow) {
                const trackFavBtn = trackRow.querySelector('.track-favorite-btn');
                if (trackFavBtn) {
                    const trackIcon = trackFavBtn.querySelector('i');
                    if (isFavorite) {
                        trackIcon.classList.remove('fa-solid');
                        trackIcon.classList.add('fa-regular');
                        trackFavBtn.classList.remove('active');
                    } else {
                        trackIcon.classList.remove('fa-regular');
                        trackIcon.classList.add('fa-solid');
                        trackFavBtn.classList.add('active');
                    }
                }
            }
        });
    }

    // Botón de agregar a playlist en el reproductor
    const playerAddToPlaylistBtn = document.querySelector('.player-add-playlist-btn');
    if (playerAddToPlaylistBtn) {
        playerAddToPlaylistBtn.addEventListener('click', function () {
            if (!window.currentAudio || currentPlaylist.length === 0) {
                showNotification('⚠️ No hay canción reproduciéndose');
                return;
            }

            const currentTrack = currentPlaylist[currentTrackIndex];
            if (!currentTrack) {
                showNotification('⚠️ Error al obtener información de la canción');
                return;
            }

            const duration = window.currentAudio.duration
                ? formatTime(window.currentAudio.duration)
                : currentTrack.duration || '0:00';

            const track = {
                name: currentTrack.name,
                artist: currentTrack.artist,
                album: currentTrack.album || 'Desconocido',
                cover: currentTrack.cover,
                audioFile: currentTrack.audioFile,
                duration: duration
            };

            showPlaylistModal(track, () => {
                updatePlaylistsCounter();
            });
        });
    }

    // Navegación al hacer clic en una tarjeta de álbum
    const albumCards = document.querySelectorAll('.album-card');
    albumCards.forEach(card => {
        card.addEventListener('click', async function (e) {
            if (e.target.closest('.album-play-btn')) {
                return;
            }
            // Intentar obtener desde atributos `data-` (explore-page) o desde el HTML (index)
            const albumTitle = this.dataset.albumName || this.querySelector('.album-title')?.textContent?.trim() || '';
            const artistName = this.dataset.artistName || this.querySelector('.album-artist')?.textContent?.trim() || '';
            const albumCover = this.dataset.cover || this.querySelector('.album-cover img')?.src || '';

            console.log('Album card clicked:', { albumTitle, artistName, albumCover });

            if (!albumTitle || !artistName) {
                console.warn('Faltan datos del álbum en la tarjeta; no se puede abrir la página del álbum.', this);
                return;
            }

            await showAlbumPage(albumTitle, artistName, albumCover);
        });
    });

    document.body.addEventListener('click', async (e) => {
        const card = e.target.closest('.album-card');
        if (card && !e.target.closest('.album-play-btn')) {
            const albumTitle = card.dataset.albumName || card.querySelector('.album-title')?.textContent?.trim() || '';
            const artistName = card.dataset.artistName || card.querySelector('.album-artist')?.textContent?.trim() || '';
            const albumCover = card.dataset.cover || card.querySelector('.album-cover img')?.src || '';

            if (!albumTitle || !artistName) {
                console.warn('Delegated click: faltan datos en tarjeta de álbum, se ignora.', card);
                return;
            }

            console.log('Delegated album click:', { albumTitle, artistName, albumCover });
            await showAlbumPage(albumTitle, artistName, albumCover);
        }
    });

    // CONTROLES DEL REPRODUCTOR
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (window.currentAudio) {
                if (window.currentAudio.paused) {
                    window.currentAudio.play();
                    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    miniPlayer.updatePlayState(true);
                } else {
                    window.currentAudio.pause();
                    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    miniPlayer.updatePlayState(false);
                }
            }
        });
    }

    const prevBtn = document.querySelector('.player-controls .control-btn:nth-child(2)');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => playPrevious());
    }

    const nextBtn = document.querySelector('.player-controls .control-btn:nth-child(4)');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => playNext());
    }

    const shuffleBtn = document.querySelector('.shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            isShuffleActive = !isShuffleActive;
            shuffleBtn.classList.toggle('active', isShuffleActive);
        });
    }

    const repeatBtn = document.querySelector('.repeat-btn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            repeatMode = (repeatMode + 1) % 3;
            const icon = repeatBtn.querySelector('i');
            repeatBtn.classList.remove('active', 'repeat-one');

            if (repeatMode === 1) {
                repeatBtn.classList.add('active');
                icon.className = 'fa-solid fa-repeat';
            } else if (repeatMode === 2) {
                repeatBtn.classList.add('active', 'repeat-one');
                icon.className = 'fa-solid fa-repeat-1';
            } else {
                icon.className = 'fa-solid fa-repeat';
            }
        });
    }

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