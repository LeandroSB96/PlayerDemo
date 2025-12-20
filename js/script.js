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

// Normalizar cadenas para comparación (quita mayúsculas, espacios extra y ciertos signos)
function normalizeString(str = '') {
    return String(str)
        .normalize('NFKD')           // normalizar unicode
        .replace(/[\u0300-\u036f]/g, '') // quitar diacríticos
        .replace(/’/g, "'")        // comilla tipográfica -> simple
        .replace(/[^\w\s'-]/g, '') // quitar puntuación excepto guiones/apóstrofes
        .replace(/\s+/g, ' ')       // espacios múltiples -> uno
        .trim()
        .toLowerCase();
}

function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
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

// Asignar a window para que sea accesible globalmente
window.showConfirmationModal = showConfirmationModal;


// MINI-PLAYER FLOTANTE
function initMiniPlayer() {
    const miniPlayerWrapper = document.querySelector('.mini-player-wrapper');
    const miniPlayerToggle = document.querySelector('.mini-player-toggle');
    const miniPlayerExpanded = document.querySelector('.mini-player-expanded');
    const miniPlayerClose = document.querySelector('.mini-player-close');
    const miniPlayerCover = document.getElementById('miniPlayerCover');
    const miniPlayerSongName = document.getElementById('miniPlayerSongName');
    const miniPlayerArtistName = document.getElementById('miniPlayerArtistName');
    const miniFavBtn = document.querySelector('.mini-fav-btn');
    const mainPlayer = document.querySelector('.player');
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

    // Funciones para abrir/cerrar mini-player
    function openMiniPlayer() {
        isMiniPlayerExpanded = true;
        miniPlayerExpanded.classList.add('active');
        // Ocultar reproductor principal cuando se abre el mini-player
        if (mainPlayer) mainPlayer.classList.add('mini-hidden');
    }

    function closeMiniPlayer() {
        isMiniPlayerExpanded = false;
        miniPlayerExpanded.classList.remove('active');
        // Mostrar reproductor principal al cerrar el mini-player
        if (mainPlayer) mainPlayer.classList.remove('mini-hidden');
    }

    function toggleMiniPlayer() {
        if (isMiniPlayerExpanded) {
            closeMiniPlayer();
        } else {
            openMiniPlayer();
        }
    }

    // Cerrar mini-player con botón X
    miniPlayerClose.addEventListener('click', () => {
        closeMiniPlayer();
    });

    // Botón de favorito dentro del mini-player
    if (miniFavBtn) {
        miniFavBtn.addEventListener('click', async (e) => {
            e.stopPropagation();

            // Solo abortar si NO hay audio y NO hay playlist conocido
            if (!window.currentAudio && currentPlaylist.length === 0) {
                showNotification('⚠️ No hay canción reproduciéndose');
                return;
            }

            const track = {
                name: ct.name,
                artist: ct.artist,
                album: ct.album || 'Desconocido',
                cover: ct.cover,
                audioFile: ct.audioFile,
                duration: ct.duration || formatTime(window.currentAudio?.duration || 0),
                explicit: ct.explicit || false
            };

            // Intentar obtener la canción actual desde el playlist; si no existe, construir desde la UI
            let ctFallback = currentPlaylist[currentTrackIndex];
            if (!ctFallback && window.currentAudio) {
                ctFallback = {
                    name: miniPlayerSongName?.textContent?.trim() || 'Sin título',
                    artist: miniPlayerArtistName?.textContent?.trim() || '',
                    album: 'Desconocido',
                    cover: miniPlayerCover?.src || '',
                    audioFile: window.currentAudio?.src || '',
                    duration: formatTime(window.currentAudio?.duration || 0)
                };
            }

            if (!ctFallback) {
                showNotification('⚠️ No hay canción reproduciéndose');
                return;
            }

            const trackToToggle = {
                name: ctFallback.name,
                artist: ctFallback.artist,
                album: ctFallback.album || 'Desconocido',
                cover: ctFallback.cover,
                audioFile: ctFallback.audioFile,
                duration: ctFallback.duration || formatTime(window.currentAudio?.duration || 0),
                explicit: !!ctFallback.explicit
            };

            const icon = miniFavBtn.querySelector('i');
            const currentlyFav = favoritesManager.isFavorite(trackToToggle.name, trackToToggle.artist, trackToToggle.album);
            const opPromise = currentlyFav
                ? favoritesManager.removeFavorite(trackToToggle.name, trackToToggle.artist, trackToToggle.album)
                : favoritesManager.addFavorite(trackToToggle);

            opPromise.then((res) => {
                if (currentlyFav) {
                    if (icon) {
                        icon.classList.remove('fa-solid');
                        icon.classList.add('fa-regular');
                    }
                    showNotification('💔 Removido de favoritos');
                } else {
                    if (icon) {
                        icon.classList.remove('fa-regular');
                        icon.classList.add('fa-solid');
                    }
                    showNotification('❤️ Agregado a favoritos');
                }

                updateFavoritesCounter();
                window.dispatchEvent(new Event('favorites:changed'));
            }).catch(err => {
                console.error('Error al togglear favorito desde mini-player:', err);
                showNotification('⚠️ Ocurrió un error al actualizar favoritos');
            });
        });
    }

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

    // Control de volumen con soporte completo de arrastre
    const updateMiniVolume = (e) => {
        const rect = miniVolumeBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        if (window.currentAudio) {
            window.currentAudio.volume = percent;
            window.savedVolume = percent;
        }
        miniVolumeFill.style.width = `${percent * 100}%`;

        // Sincronizar con volumen principal
        const mainVolumeFill = document.querySelector('.volume-fill');
        if (mainVolumeFill) {
            mainVolumeFill.style.width = `${percent * 100}%`;
        }
    };

    // Click directo
    miniVolumeBar.addEventListener('click', updateMiniVolume);

    // Arrastre
    miniVolumeBar.addEventListener('mousedown', (e) => {
        updateMiniVolume(e);

        const onMouseMove = (moveEvent) => {
            moveEvent.preventDefault();
            updateMiniVolume(moveEvent);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    // Actualizar mini-player cuando se reproduce una canción
    window.addEventListener('mini-player:update', (e) => {
        const { cover, songName, artistName, album, explicit } = e.detail;

        miniPlayerCover.src = cover;
        // Mostrar badge explícito si corresponde
        miniPlayerSongName.innerHTML = `${escapeHtml(songName)}${explicit ? " <span class='explicit-track-badge small'>E</span>" : ''}`;
        miniPlayerArtistName.textContent = artistName;
        // Actualizar estado del corazón según favoritos (usar album si está disponible)
        try {
            if (miniFavBtn) {
                const favAlbum = album || 'Desconocido';
                const isFav = favoritesManager.isFavorite(songName, artistName, favAlbum);
                const icon = miniFavBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-solid', isFav);
                    icon.classList.toggle('fa-regular', !isFav);
                }
            }
        } catch (err) { }
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
    // Actualizar mini-player cuando se reproduce una canción
    window.addEventListener('mini-player:update', (e) => {
        const { cover, songName, artistName, album, explicit } = e.detail;

        miniPlayerCover.src = cover;
        miniPlayerSongName.innerHTML = `${escapeHtml(songName)}${explicit ? " <span class='explicit-track-badge small'>E</span>" : ''}`;
        miniPlayerArtistName.textContent = artistName;
        // Actualizar estado del corazón según favoritos (usar album si está disponible)
        try {
            if (miniFavBtn) {
                const favAlbum = album || 'Desconocido';
                const isFav = favoritesManager.isFavorite(songName, artistName, favAlbum);
                const icon = miniFavBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-solid', isFav);
                    icon.classList.toggle('fa-regular', !isFav);
                }
            }
        } catch (err) { /* ignore */ }
    });

    return {
        updateTrack: (cover, songName, artistName, album, explicit = false) => {
            window.dispatchEvent(new CustomEvent('mini-player:update', {
                detail: { cover, songName, artistName, album, explicit }
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
        openMiniPlayer: openMiniPlayer,
        closeMiniPlayer: closeMiniPlayer,
        toggleMiniPlayer: toggleMiniPlayer
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
        // Mostrar badge explícito en player si corresponde
        if (playerTrackName) playerTrackName.innerHTML = `${escapeHtml(track.name)}${track.explicit ? " <span class='explicit-badge inline'>E</span>" : ''}`;
        if (playerArtistName) playerArtistName.textContent = track.artist;
        if (playerPlayBtn) playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

        // Actualizar mini-player (incluyendo álbum cuando esté disponible)
        miniPlayer.updateTrack(track.cover, track.name, track.artist, track.album, track.explicit);

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

    // Gestor PJAX para mantener el reproductor vivo durante navegación
    const pjaxManager = {
        // Cache de estado para restauración
        currentState: { page: 'home', title: 'Player Demo' },

        // Cargar contenido remoto sin recargar la página
        async loadPageContent(url) {
            try {
                const response = await fetch(url, { credentials: 'same-origin' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extraer y actualizar metas dinámicas
                const remoteTitle = doc.querySelector('title')?.textContent || 'Player Demo';
                const remoteDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

                // Obtener nuevo main-content
                const newMain = doc.querySelector('.main-content');
                if (!newMain) throw new Error('Remote page missing .main-content');

                return { html: newMain.innerHTML, title: remoteTitle, desc: remoteDesc, scripts: this.extractScripts(html) };
            } catch (error) {
                console.error('[PJAX] Error cargando página:', error);
                return null;
            }
        },

        // Extraer scripts inline/src del HTML remoto para ejecutarlos localmente
        extractScripts(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const scripts = [];

            doc.querySelectorAll('script').forEach(script => {
                if (script.src) {
                    // Script externo — puede ignorarse si ya está cargado
                    scripts.push({ type: 'src', src: script.src });
                } else if (script.textContent.trim()) {
                    // Script inline
                    scripts.push({ type: 'inline', code: script.textContent });
                }
            });

            return scripts;
        },

        // Ejecutar scripts de forma segura (solo inline para evitar CORS)
        executeScripts(scripts) {
            scripts.forEach(script => {
                if (script.type === 'inline') {
                    try {
                        // Ejecutar en contexto global (eval con precaución)
                        new Function(script.code).call(window);
                    } catch (error) {
                        console.warn('[PJAX] Error ejecutando script inline:', error);
                    }
                }
                // Scripts src son ignorados; confiar en módulos ES6 importados
            });
        },

        // Actualizar navegación activa en sidebar
        updateActiveNav(href) {
            document.querySelectorAll('.sidebar .menu-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === href) {
                    item.classList.add('active');
                }
            });
        },

        // Navegar a una URL con PJAX (sin recargar, mantiene audio)
        async navigateTo(url, title = 'Player Demo', pushState = true) {
            // Mostrar indicador de carga si quieres (opcional)
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) return false;

            const pageData = await this.loadPageContent(url);
            if (!pageData) {
                console.error('[PJAX] Fallback a navegación completa:', url);
                window.location.href = url;
                return false;
            }

            // Actualizar DOM
            mainContent.innerHTML = pageData.html;
            document.title = pageData.title || title;

            // Actualizar meta descripción
            if (pageData.desc) {
                let metaDesc = document.querySelector('meta[name="description"]');
                if (!metaDesc) {
                    metaDesc = document.createElement('meta');
                    metaDesc.name = 'description';
                    document.head.appendChild(metaDesc);
                }
                metaDesc.setAttribute('content', pageData.desc);
            }

            // Ejecutar scripts del contenido remoto si existen
            if (pageData.scripts && pageData.scripts.length > 0) {
                this.executeScripts(pageData.scripts);
            }

            // Reinicializar bindings del DOM
            initAfterAjaxLoad();

            // Actualizar historial
            if (pushState) {
                history.pushState({ page: url, title }, '', url);
            }

            // Scroll al inicio
            mainContent.scrollTop = 0;

            // Actualizar nav activo
            this.updateActiveNav(url);

            this.currentState = { page: url, title: pageData.title || title };
            return true;
        },

        // Navegar a "home" — limpia vistas dinámicas
        showHome() {
            document.querySelectorAll('.album-page, .favorites-page, .playlists-page, .explore-page, .artists-page')
                .forEach(p => p.remove());
            const content = document.querySelector('.content');
            if (content) content.style.display = 'block';
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
                // No reemplazamos innerHTML; asumimos que está completo en index.html
            }
            document.title = 'Player Demo';
            history.pushState({ page: 'home' }, '', '/index.html');
            this.currentState = { page: 'home', title: 'Player Demo' };
        }
    };

    // Interceptor de clicks en sidebar y enlaces internos
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;

        const href = a.getAttribute('href');
        if (!href) return;

        // Ignorar enlaces externos
        if (href.startsWith('http') || href.startsWith('mailto:')) return;

        // Ignorar placeholders vacíos
        if (href === '#') return;

        // Rutas especiales manejadas dinámicamente (JS)
        if (href.includes('index.html') || href === '/') {
            e.preventDefault();
            pjaxManager.showHome();
            return;
        }

        // Links por ID (favoritos, playlists)
        const linkId = a.id;
        if (linkId === 'favoritesNavBtn') {
            e.preventDefault();
            showFavoritesPage();
            history.pushState({ page: 'favorites' }, '', '#favorites');
            return;
        }
        if (linkId === 'playlistsNavBtn') {
            e.preventDefault();
            showPlaylistsPage(() => updatePlaylistsCounter());
            history.pushState({ page: 'playlists' }, '', '#playlists');
            return;
        }

        // Validar que sea enlace interno
        if (!href.startsWith('/') && !href.startsWith('.')) return;

        // Interceptar navegación interna con PJAX
        e.preventDefault();
        pjaxManager.navigateTo(href);
    }, true); // Usar captura para prioridad

    // Manejar botones de back/forward
    window.addEventListener('popstate', (e) => {
        const state = e.state;
        if (!state) return;

        if (state.page === 'home') {
            pjaxManager.showHome();
        } else if (state.page === 'favorites') {
            showFavoritesPage();
        } else if (state.page === 'playlists') {
            showPlaylistsPage(() => updatePlaylistsCounter());
        } else if (typeof state.page === 'string') {
            // Intentar recargar contenido de URL almacenada
            pjaxManager.navigateTo(state.page, state.title, false);
        }
    });

    // Listener para reproducir playlist completa
    window.addEventListener('playlist:play', (e) => {
        const { playlistId, tracks } = e.detail;
        if (tracks && tracks.length > 0) {
            currentPlaylist = tracks.map((track, idx) => ({
                audioFile: track.audioFile,
                name: track.name,
                artist: track.artist,
                album: track.album,
                cover: track.cover,
                explicit: !!track.explicit
            }));
            currentTrackIndex = 0;
            playTrack(0);
        }
    });

    // Listener para reproducir track específico de playlist
    window.addEventListener('playlist:playTrack', (e) => {
        const { playlistId, track, tracks } = e.detail;
        if (tracks && Array.isArray(tracks) && tracks.length > 0) {
            currentPlaylist = tracks.map((t) => ({
                audioFile: t.audioFile,
                name: t.name,
                artist: t.artist,
                album: t.album,
                cover: t.cover,
                explicit: !!t.explicit
            }));
        }
        // Solo necesitamos encontrar el índice y reproducir
        const idx = currentPlaylist.findIndex(t => t.audioFile === track.audioFile);
        if (idx >= 0) {
            currentTrackIndex = idx;
            playTrack(idx);
        } else if (track && track.audioFile) {
            // Si no está en el playlist actual, añadir temporalmente y reproducir
            currentPlaylist.push({
                audioFile: track.audioFile,
                name: track.name,
                artist: track.artist,
                album: track.album,
                cover: track.cover,
                explicit: !!track.explicit
            });
            currentTrackIndex = currentPlaylist.length - 1;
            playTrack(currentTrackIndex);
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
        const existingFavPages = document.querySelectorAll('.favorites-page');
        existingFavPages.forEach(p => p.remove());

        const existingAlbumPages = document.querySelectorAll('.album-page:not(.favorites-page)');
        existingAlbumPages.forEach(p => p.remove());

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
                            <span class="track-name">${track.name} ${track.explicit ? "<span class='explicit-track-badge'>E</span>" : ''}</span>
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
            explicit: !!track.explicit,
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
            console.log('🎵 showAlbumPage llamado con:', { albumTitle, artistName, localCover });

            // CRÍTICO: Validar que artistName esté definido
            if (!artistName || artistName.trim() === '') {
                console.error('❌ artistName no proporcionado. albumTitle:', albumTitle);

                // Intentar extraer el artista desde localAlbums
                const localMatch = localAlbums.find(album =>
                    normalizeString(album.title) === normalizeString(albumTitle)
                );

                if (localMatch) {
                    artistName = localMatch.artist;
                    console.log('✅ Artista encontrado en localAlbums:', artistName);
                } else {
                    alert('Error: No se pudo determinar el artista del álbum. Por favor, intenta de nuevo.');
                    return;
                }
            }

            const requestedArtistName = artistName.trim();
            console.log('🔍 Buscando álbum:', albumTitle, 'de', requestedArtistName);

            // Ocultar contenido principal ANTES de crear la página
            const mainContent = document.querySelector('.content');
            if (mainContent) {
                mainContent.style.display = 'none';
            }

            //  REMOVER PÁGINAS EXISTENTES 
            const existingPages = document.querySelectorAll('.album-page, .favorites-page, .playlists-page, .explore-page, .artists-page');
            existingPages.forEach(page => page.remove());

            // Intentar primero álbumes locales
            const localMatch = localAlbums.find(a =>
                normalizeString(a.title) === normalizeString(albumTitle) ||
                normalizeString(a.title).includes(normalizeString(albumTitle))
            );

            let albumData, artistData, coverUrl;

            if (localMatch) {
                console.log('✅ Álbum encontrado en localAlbums:', localMatch.title);

                albumData = {
                    id: localMatch.id || `local-${normalizeString(localMatch.title)}`,
                    name: localMatch.title,
                    release_date: localMatch.releaseDate || localMatch.release_date || '1970-01-01',
                    total_tracks: localMatch.tracks?.length || localMatch.totalTracks || 0,
                    explicit: !!localMatch.explicit,
                    tracks: {
                        items: (localMatch.tracks || []).map(t => ({
                            name: t.title,
                            artists: [{ name: localMatch.artist }],
                            duration_ms: durationToMs(t.duration || '0:00'),
                            preview_url: t.preview || null,
                            local_audio: t.audioFile || '',
                            explicit: !!t.explicit
                        }))
                    },
                    artists: [{ id: 'local', name: localMatch.artist }]
                };

                artistData = {
                    id: 'local',
                    name: localMatch.artist,
                    images: [{ url: localMatch.cover || localCover || '' }],
                    followers: { total: 0 }
                };

                coverUrl = localMatch.cover || localCover || '';
            } else {
                // Buscar en Spotify
                console.log('🔍 Buscando en Spotify...');
                const spotifyMatch = await spotifyService.searchAlbum(albumTitle, requestedArtistName);

                if (!spotifyMatch) {
                    alert('No se encontró el álbum en Spotify ni en la colección local.');
                    // Restaurar contenido principal
                    if (mainContent) mainContent.style.display = 'block';
                    return;
                }

                const albumDetails = await spotifyService.getAlbum(spotifyMatch.id);
                artistData = await spotifyService.getArtist(albumDetails.artists[0].id);
                coverUrl = localCover || albumDetails.images?.[0]?.url || '';

                albumData = albumDetails;
            }

            await createAlbumPage(albumData, artistData, coverUrl);

        } catch (error) {
            console.error('Error buscando/mostrando álbum:', error);
            alert('Ocurrió un error al intentar abrir la página del álbum. Revisa la consola para más detalles.');
            // Restaurar contenido principal en caso de error
            const mainContent = document.querySelector('.content');
            if (mainContent) mainContent.style.display = 'block';
        }

        //  FUNCIÓN INTERNA: CREAR PÁGINA DEL ÁLBUM 
        async function createAlbumPage(albumData, artistData, localCover) {
            const albumName = albumData.name || albumData.title || 'Sin título';

            const albumPage = document.createElement('div');
            albumPage.className = 'album-page';
            albumPage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(155, 75, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="album-cover-wrapper">
                    <img src="${localCover}" alt="${albumData.name}" class="album-page-cover">
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">ÁLBUM</span>
                    <h1 class="album-page-title">${albumData.name} ${albumData.explicit ? '<span class="explicit-badge inline">E</span>' : ''}</h1>
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
                const durMs = Number(track.duration_ms) || (track.duration ? durationToMs(track.duration) : 0);
                const minutes = Math.floor(durMs / 60000);
                const seconds = Math.floor((durMs % 60000) / 1000).toFixed(0).padStart(2, '0');
                return `
                        <div class="track-row" 
                            data-preview="${track.preview_url || ''}"
                            data-local-audio="${track.local_audio || ''}"
                            data-track-index="${index}"
                            data-explicit="${track.explicit ? '1' : '0'}">
                            <span class="track-col-number" data-number="${index + 1}"></span>
                            <div class="track-col-title">
                                <span class="track-name">${track.name} ${(track.explicit || albumData.explicit) ? "<span class='explicit-track-badge'>E</span>" : ''}</span>
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
                        <p>${artistData.followers?.total?.toLocaleString() || 0} seguidores</p>
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
                        <li><a href="#">Terminos de Uso</a></li>
                        <li><a href="#">Privacidad</a></li>
                    </ul>
                </div>
            </div>

            <div class="footer-bottom">
                <p>&copy; 2025 Player Demo. Todos los derechos reservados.</p>
            </div>
        </footer>
    `;
            const mainContentArea = document.querySelector('.main-content');
            mainContentArea.appendChild(albumPage);
            mainContentArea.scrollTop = 0;

            // Botón de regresar
            const backBtn = albumPage.querySelector('.back-button');
            backBtn.addEventListener('click', () => {
                albumPage.remove();
                const content = document.querySelector('.content');
                if (content) content.style.display = 'block';
            });

            // CARGAR RECOMENDACIONES CORRECTAMENTE 
            const recommendationsGrid = albumPage.querySelector('#recommendationsGrid');

            try {
                let spotifyArtistId = artistData.id;

                // Si es un álbum local, buscar el artista en Spotify
                if (!spotifyArtistId || spotifyArtistId === 'local') {
                    console.log('🔍 Buscando artista en Spotify:', artistData.name);
                    const spotifyArtist = await spotifyService.searchArtistByName(artistData.name);
                    
                    if (spotifyArtist) {
                        spotifyArtistId = spotifyArtist.id;
                        console.log('✅ Artista encontrado en Spotify:', spotifyArtist.name, 'ID:', spotifyArtistId);

                        // Actualizar artistData y el DOM para mostrar la imagen y seguidores de Spotify
                        artistData = spotifyArtist;

                        const artistImageLarge = albumPage.querySelector('.artist-image-large');
                        const avatarSmall = albumPage.querySelector('.artist-avatar-small');
                        const artistNameBold = albumPage.querySelector('.artist-name-bold');
                        const followersP = albumPage.querySelector('.artist-info-section p');

                        const spotifyImage = spotifyArtist.images?.[0]?.url || '';
                        if (spotifyImage) {
                            if (artistImageLarge) {
                                artistImageLarge.src = spotifyImage;
                                artistImageLarge.alt = spotifyArtist.name;
                            }
                            if (avatarSmall) {
                                avatarSmall.src = spotifyImage;
                                avatarSmall.alt = spotifyArtist.name;
                            }
                        }

                        if (artistNameBold) artistNameBold.textContent = spotifyArtist.name;
                        if (followersP) followersP.textContent = `${spotifyArtist.followers?.total?.toLocaleString() || 0} seguidores`;

                    } else {
                        console.warn('⚠️ No se encontró el artista en Spotify');
                        recommendationsGrid.innerHTML = '<p style="color: #b3b3b3;">No se encontró información del artista en Spotify.</p>';
                        return;
                    }
                }

                console.log('🔍 Cargando álbumes del artista ID:', spotifyArtistId);
                const artistAlbumsData = await spotifyService.getArtistAlbums(spotifyArtistId, 10);
                console.log('📀 Respuesta de Spotify:', artistAlbumsData);

                // La respuesta puede venir como {items: [...]} o directamente como array
                const artistAlbums = artistAlbumsData?.items || artistAlbumsData || [];

                console.log('📀 Álbumes encontrados:', artistAlbums.length);

                // Filtrar el álbum actual y limitar a 6
                const filteredAlbums = artistAlbums
                    .filter(album => album.id !== albumData.id)
                    .slice(0, 6);

                if (filteredAlbums.length > 0) {
                    recommendationsGrid.innerHTML = filteredAlbums.map(album => `
                    <div class="recommendation-card" 
                         data-album-name="${album.name.replace(/"/g, '&quot;')}" 
                         data-artist-name="${(album.artists[0]?.name || '').replace(/"/g, '&quot;')}" 
                         data-cover="${album.images[0]?.url || ''}">
                        <div class="album-cover">
                            <img src="${album.images[0]?.url || ''}" 
                                 alt="${album.name}" 
                                 class="recommendation-cover">
                            <button class="album-play-btn" aria-label="Reproducir álbum"></button>
                        </div>
                        <div class="recommendation-name" title="${album.name}">${album.name}</div>
                        <div class="recommendation-year">${album.release_date?.split('-')[0] || 'N/A'}</div>
                    </div>
                `).join('');

                    // Event listeners para las recomendaciones
                    const recCards = recommendationsGrid.querySelectorAll('.recommendation-card');
                    recCards.forEach(card => {
                        card.addEventListener('click', () => {
                            const albumName = card.dataset.albumName;
                            const artistName = card.dataset.artistName;
                            const cover = card.dataset.cover;
                            showAlbumPage(albumName, artistName, cover);
                        });
                    });
                } else {
                    recommendationsGrid.innerHTML = '<p style="color: #b3b3b3;">No se encontraron más álbumes de este artista.</p>';
                }
            } catch (error) {
                console.error('❌ Error cargando recomendaciones:', error);
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

        // Cargar favoritos en memoria (fallback a localStorage si no hay window.storage)
        try {
            await favoritesManager.loadFavorites();
        } catch (err) {
            console.warn('No se pudieron cargar favoritos inicialmente:', err);
        }

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

        // Añadir badges explícitos a las album-cards iniciales en la página principal
        try {
            document.querySelectorAll('.album-card').forEach(card => {
                const titleEl = card.querySelector('.album-title');
                if (!titleEl) return;
                const title = titleEl.textContent.trim();
                const localMatch = localAlbums.find(a => normalizeString(a.title) === normalizeString(title));
                if (localMatch && localMatch.explicit) {
                    const info = card.querySelector('.album-info');
                    if (info && !info.querySelector('.explicit-badge')) {
                        const titleEl = info.querySelector('.album-title');
                        if (titleEl) {
                            titleEl.insertAdjacentHTML('beforeend', " <span class='explicit-badge inline'>E</span>");
                        } else {
                            const badge = document.createElement('div');
                            badge.className = 'explicit-badge inline';
                            badge.textContent = 'E';
                            info.appendChild(badge);
                        }
                    }
                }
            });
        } catch (err) {
         }

        // Escuchar cambios de favoritos desde otras partes (p. ej. playlists)
        window.addEventListener('favorites:changed', () => {
            try {
                updateFavoritesCounter();
                if (document.querySelector('.favorites-page')) {
                    document.querySelector('.favorites-page').remove();
                    showFavoritesPage();
                }
            } catch (err) {
                console.warn('Error manejando favorites:changed', err);
            }
        });

        updateFavoritesCounter();
        updatePlaylistsCounter();

        // Click en carátula del reproductor para abrir/cerrar mini-player
        const playerAlbumSection = document.getElementById('playerAlbumSection');
        if (playerAlbumSection) {
            playerAlbumSection.addEventListener('click', () => {
                miniPlayer.toggleMiniPlayer();
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

    // Inicializaciones que deben re-ejecutarse después de cargas parciales (PJAX)
    function initAfterAjaxLoad() {
        console.log('[PJAX] Re-inicializando bindings del DOM...');

        if (!window._albumCardDelegateAdded) {
            document.addEventListener('click', async function (e) {
                const card = e.target.closest('.album-card');
                if (!card) return;

                // Ignorar clicks en el botón de play dentro de la tarjeta
                if (e.target.closest('.album-play-btn')) return;

                let albumTitle = card.dataset.albumName;

                if (!albumTitle) {
                    const titleEl = card.querySelector('.album-title');
                    if (titleEl) {
                        // Obtener solo el texto del nodo, excluyendo el badge
                        const titleNode = titleEl.childNodes[0];
                        albumTitle = titleNode ? titleNode.textContent.trim() : titleEl.textContent.trim().replace(/\s*E\s*$/, '');
                    }
                }

                let artistName = card.dataset.artistName || card.querySelector('.album-artist')?.textContent?.trim() || '';
                let albumCover = card.dataset.cover || card.querySelector('.album-cover img')?.src || '';

                console.log('🎵 Album card clicked (delegado):', { albumTitle, artistName, albumCover });

                // Validar que tengamos al menos el título
                if (!albumTitle) {
                    console.error('❌ No se pudo obtener el título del álbum');
                    alert('Error: No se pudo identificar el álbum. Por favor, recarga la página.');
                    return;
                }

                // Si no hay artista, intentar buscarlo en localAlbums
                if (!artistName) {
                    console.warn('⚠️ artistName no encontrado, buscando en localAlbums...');
                    const localMatch = localAlbums.find(album =>
                        normalizeString(album.title) === normalizeString(albumTitle)
                    );

                    if (localMatch) {
                        artistName = localMatch.artist;
                        console.log('✅ Artista encontrado (delegado):', artistName);
                    } else {
                        console.error('❌ No se pudo determinar el artista');
                        alert('Error: No se pudo identificar el artista del álbum.');
                        return;
                    }
                }

                await showAlbumPage(albumTitle, artistName, albumCover);
            });
            window._albumCardDelegateAdded = true;
        }

        //  Botones de Reproducción de Canciones 
        document.querySelectorAll('.song-play-btn').forEach(btn => {
            const freshBtn = btn.cloneNode(true);
            btn.replaceWith(freshBtn);
        });

        document.querySelectorAll('.song-play-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const songItem = this.closest('.song-item');
                if (!songItem) return;

                const songTitleEl = songItem.querySelector('.song-title');
                // Extraer nombre 'limpio' (sin badge) y detectar badge explícito si existe
                const songTitle = songTitleEl ? (songTitleEl.childNodes[0]?.nodeValue || songTitleEl.textContent).trim() : '';
                const artistName = songItem.querySelector('.song-artist')?.textContent?.trim() || '';
                const cover = songItem.querySelector('.song-cover img')?.src || '';
                const audioFile = songItem.dataset.audioFile || '';
                const explicitFlag = songItem.dataset.explicit === '1' || !!songTitleEl?.querySelector('.explicit-track-badge');

                if (audioFile) {
                    currentPlaylist = [{
                        name: songTitle,
                        artist: artistName,
                        cover: cover,
                        audioFile: audioFile,
                        album: 'Desconocido',
                        explicit: explicitFlag
                    }];
                    playTrack(0);
                }
            });
        });

        // Botones de Play de Álbum 
        document.querySelectorAll('.album-play-btn').forEach(btn => {
            const freshBtn = btn.cloneNode(true);
            btn.replaceWith(freshBtn);
        });

        document.querySelectorAll('.album-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.album-card, .recommendation-card');
                if (!card) return;

                const albumTitle = card.dataset.albumName || card.querySelector('.album-title')?.textContent?.trim() || '';
                const artistName = card.dataset.artistName || card.querySelector('.album-artist')?.textContent?.trim() || '';
                const cover = card.dataset.cover || card.querySelector('.album-cover img')?.src || '';

                if (albumTitle && artistName) {
                    showAlbumPage(albumTitle, artistName, cover);
                }
            });
        });

        // Botones de Navegación de Favoritos/Playlists 
        const backButtons = document.querySelectorAll('.back-button');
        backButtons.forEach(btn => {
            const freshBtn = btn.cloneNode(true);
            btn.replaceWith(freshBtn);
        });

        document.querySelectorAll('.back-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.closest('.album-page, .favorites-page, .playlists-page, .explore-page, .artists-page');
                if (page) page.remove();
                const content = document.querySelector('.content');
                if (content) content.style.display = 'block';
            });
        });

        // Botones de Acción en Playlists/Favoritos 
        const playFavBtn = document.querySelector('.play-favorites-btn');
        if (playFavBtn) {
            const freshBtn = playFavBtn.cloneNode(true);
            playFavBtn.replaceWith(freshBtn);
            const newPlayFavBtn = document.querySelector('.play-favorites-btn');
            if (newPlayFavBtn) {
                newPlayFavBtn.addEventListener('click', () => {
                    const favorites = favoritesManager.getFavoritesByDate();
                    if (favorites.length > 0) {
                        currentPlaylist = favorites.map(t => ({
                            name: t.name,
                            artist: t.artist,
                            album: t.album,
                            cover: t.cover,
                            audioFile: t.audioFile,
                            explicit: !!t.explicit
                        }));
                        currentTrackIndex = 0;
                        playTrack(0);
                    }
                });
            }
        }

        // Song Items Clickables 
        document.querySelectorAll('.track-row').forEach(row => {
            const freshRow = row.cloneNode(true);
            row.replaceWith(freshRow);
        });

        document.querySelectorAll('.track-row').forEach((row, idx) => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.track-favorite-btn, .track-add-playlist-btn')) {
                    return;
                }
                // Reproducir canción del álbum activo
                if (currentPlaylist.length > 0) {
                    const trackIndex = parseInt(row.getAttribute('data-track-index')) || idx;
                    if (trackIndex >= 0 && trackIndex < currentPlaylist.length) {
                        playTrack(trackIndex);
                    }
                }
            });
        });

        // Botones de Agregar a Favoritos en Tracks 
        document.querySelectorAll('.track-favorite-btn').forEach(btn => {
            const freshBtn = btn.cloneNode(true);
            btn.replaceWith(freshBtn);
        });

        document.querySelectorAll('.track-favorite-btn').forEach(btn => {
            btn.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const row = this.closest('.track-row');
                if (!row) return;

                const trackName = row.querySelector('.track-name')?.textContent?.trim() || '';
                const artistName = row.querySelector('.track-artists')?.textContent?.trim() || '';
                const albumName = row.getAttribute('data-album') || row.querySelector('.track-col-album span')?.textContent?.trim() || 'Desconocido';

                const isFav = favoritesManager.isFavorite(trackName, artistName, albumName);
                const icon = this.querySelector('i');

                if (isFav) {
                    favoritesManager.removeFavorite(trackName, artistName, albumName);
                    icon.classList.remove('fa-solid');
                    icon.classList.add('fa-regular');
                    this.classList.remove('active');
                } else {
                    favoritesManager.addFavorite({
                        name: trackName,
                        artist: artistName,
                        album: albumName,
                        cover: row.dataset.cover || '',
                        audioFile: row.dataset.localAudio || '',
                        duration: row.querySelector('.track-col-duration')?.textContent?.trim() || '0:00'
                    });
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                    this.classList.add('active');
                }

                updateFavoritesCounter();
            });
        });

        console.log('[PJAX] Re-inicialización completada.');
    }

    // Ejecutar inicialización por primera vez
    initAfterAjaxLoad();

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
        const updateMainVolume = (e) => {
            if (!window.currentAudio) return;
            const rect = volumeBar.getBoundingClientRect();
            let volumePercent = (e.clientX - rect.left) / rect.width;
            if (!isFinite(volumePercent) || isNaN(volumePercent)) volumePercent = 0;
            volumePercent = Math.max(0, Math.min(1, volumePercent));
            const volumeFill = document.querySelector('.volume-fill');

            if (volumeFill) {
                const displayPercent = Math.round(volumePercent * 100);
                volumeFill.style.width = `${Math.min(displayPercent, 100)}%`;
            }
            window.currentAudio.volume = volumePercent;
            window.savedVolume = volumePercent;

            // Sincronizar con mini-player
            const miniVolumeFill = document.querySelector('.mini-volume-fill');
            if (miniVolumeFill) {
                miniVolumeFill.style.width = `${volumePercent * 100}%`;
            }
        };

        // Click directo
        volumeBar.addEventListener('click', updateMainVolume);

        // Soporte para arrastrar
        volumeBar.addEventListener('mousedown', (e) => {
            updateMainVolume(e);

            const onMouseMove = (moveEvent) => {
                moveEvent.preventDefault();
                updateMainVolume(moveEvent);
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

});