/**
  PlaylistUI - Sistema de UI para playlists
*/

import { playlistSystem } from './playlist-system.js';

/**
  Mostrar modal para agregar track a una playlist
  @param {object} track 
  @param {function} onSuccess 
 */
export function showPlaylistModal(item, onSuccess = null) {
    // `item` puede ser una pista individual o un objeto álbum con `tracks`.
    const isAlbum = item && Array.isArray(item.tracks);
    if (!item || (isAlbum ? item.tracks.length === 0 : (!item.name || !item.audioFile))) {
        console.error('[PlaylistUI] Item inválido:', item);
        alert('Error: datos inválidos');
        return;
    }

    // Remover modal existente
    const existing = document.querySelector('.playlist-modal-container');
    if (existing) existing.remove();

    const playlists = playlistSystem.getAllPlaylists();
    const isCreatingNew = playlists.length === 0;

    const modal = document.createElement('div');
    modal.className = 'playlist-modal-container';
    modal.innerHTML = `
        <div class="playlist-modal-overlay"></div>
        <div class="playlist-modal">
            <div class="playlist-modal-header">
                <h3>Agregar a Playlist</h3>
                <button class="playlist-modal-close" aria-label="Cerrar">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="playlist-modal-body">
                <!-- Item info (track o álbum) -->
                <div class="playlist-modal-track-info">
                    <img src="${(isAlbum ? (item.cover || 'assets/images/default-album.webp') : (item.cover || 'assets/images/default-album.webp'))}" alt="${isAlbum ? escapeHtml(item.name) : escapeHtml(item.name)}">
                    <div>
                        <p class="modal-track-name">${escapeHtml(item.name)}</p>
                        <p class="modal-track-artist">${isAlbum ? `${item.tracks.length} pista(s) • ${escapeHtml(item.artist || '')}` : escapeHtml(item.artist || 'Desconocido')}</p>
                    </div>
                </div>

                <!-- Create new button -->
                <button class="playlist-modal-create-btn">
                    <i class="fa-solid fa-plus"></i> Nueva Playlist
                </button>

                <!-- Existing playlists -->
                <div class="playlist-modal-list">
                    ${playlists.length === 0 ?
                        `<p class="playlist-modal-empty">No tienes playlists. ¡Crea una!</p>` :
                        playlists.map(pl => `
                            <div class="playlist-modal-item" data-playlist-id="${pl.id}">
                                <div class="playlist-modal-item-info">
                                    <i class="fa-solid fa-list"></i>
                                    <div>
                                        <p class="modal-playlist-name">${escapeHtml(pl.name)}</p>
                                        <p class="modal-playlist-count">${pl.tracks.length} canción${pl.tracks.length !== 1 ? 'es' : ''}</p>
                                    </div>
                                </div>
                                <button class="playlist-modal-add-btn" data-playlist-id="${pl.id}">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Events
    const overlay = modal.querySelector('.playlist-modal-overlay');
    const closeBtn = modal.querySelector('.playlist-modal-close');
    const createBtn = modal.querySelector('.playlist-modal-create-btn');
    const addBtns = modal.querySelectorAll('.playlist-modal-add-btn');

    const closeModal = () => {
        modal.remove();
    };

    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    createBtn.addEventListener('click', () => {
        closeModal();
        showCreatePlaylistModal(track, onSuccess);
    });

    console.log('[PlaylistUI] Botones encontrados:', addBtns.length, 'isAlbum:', isAlbum);
    addBtns.forEach((btn, idx) => {
        console.log(`[PlaylistUI] Configurando botón ${idx}:`, btn);
        btn.addEventListener('click', (e) => {
            console.log('[PlaylistUI] Click en botón agregar');
            e.stopPropagation();
            const playlistId = btn.dataset.playlistId;
            console.log('[PlaylistUI] PlaylistId:', playlistId);

            try {
                if (isAlbum) {
                    console.log('[PlaylistUI] Llamando addAlbumToPlaylist con:', { playlistId, album: item });
                    const addedCount = playlistSystem.addAlbumToPlaylist(playlistId, item);
                    console.log('[PlaylistUI] Resultado addAlbumToPlaylist:', addedCount);
                    if (addedCount > 0) {
                        showNotification(`✅ Álbum agregado a la playlist (${addedCount} pistas)`);
                        closeModal();
                        if (onSuccess) {
                            console.log('[PlaylistUI] Llamando onSuccess (album)');
                            onSuccess(playlistId, item);
                        }
                    } else {
                        showNotification('⚠️ Ninguna pista nueva para agregar');
                    }
                } else {
                    console.log('[PlaylistUI] Llamando addTrackToPlaylist con:', { playlistId, track: item });
                    const added = playlistSystem.addTrackToPlaylist(playlistId, item);
                    console.log('[PlaylistUI] Resultado addTrackToPlaylist:', added);
                    if (added) {
                        showNotification('✅ Canción agregada a la playlist');
                        closeModal();
                        if (onSuccess) {
                            console.log('[PlaylistUI] Llamando onSuccess (track)');
                            onSuccess(playlistId, item);
                        }
                    } else {
                        showNotification('⚠️ Esta canción ya está en la playlist');
                    }
                }
            } catch (error) {
                console.error('[PlaylistUI] Error al agregar:', error);
                showNotification('❌ Error al agregar la canción');
            }
        });
    });
}

/**
 * Mostrar modal para crear una nueva playlist
 */
export function showCreatePlaylistModal(trackToAdd = null, onSuccess = null) {
    const existing = document.querySelector('.create-playlist-modal-container');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'create-playlist-modal-container';
    modal.innerHTML = `
        <div class="create-playlist-modal-overlay"></div>
        <div class="create-playlist-modal">
            <div class="create-playlist-modal-header">
                <h3>Crear Nueva Playlist</h3>
                <button class="create-playlist-modal-close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="create-playlist-modal-body">
                <div class="form-group">
                    <label for="playlistNameInput">Nombre *</label>
                    <input type="text" id="playlistNameInput" class="playlist-input" 
                           placeholder="Mi playlist favorita" maxlength="100" autofocus>
                </div>

                <div class="form-group">
                    <label for="playlistDescInput">Descripción</label>
                    <textarea id="playlistDescInput" class="playlist-textarea" 
                              placeholder="Describe tu playlist..." maxlength="200" rows="3"></textarea>
                </div>

                <button class="create-playlist-submit-btn">
                    <i class="fa-solid fa-check"></i> Crear
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const overlay = modal.querySelector('.create-playlist-modal-overlay');
    const closeBtn = modal.querySelector('.create-playlist-modal-close');
    const submitBtn = modal.querySelector('.create-playlist-submit-btn');
    const nameInput = modal.querySelector('#playlistNameInput');

    const closeModal = () => {
        modal.remove();
    };

    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    const handleSubmit = () => {
        console.log('[CreatePlaylistModal] handleSubmit called');
        const name = nameInput.value.trim();
        console.log('[CreatePlaylistModal] Name:', name);
        if (!name) {
            showNotification('⚠️ Ingresa un nombre para la playlist');
            return;
        }

        try {
            const desc = modal.querySelector('#playlistDescInput').value.trim();
            console.log('[CreatePlaylistModal] Creating playlist:', name, desc);
            const newPlaylist = playlistSystem.createPlaylist(name, desc);
            console.log('[CreatePlaylistModal] Playlist created:', newPlaylist);

            if (trackToAdd) {
                console.log('[CreatePlaylistModal] Adding track:', trackToAdd);
                const added = playlistSystem.addTrackToPlaylist(newPlaylist.id, trackToAdd);
                console.log('[CreatePlaylistModal] Track added result:', added);
                showNotification(`✅ Playlist creada${added ? ' y canción agregada' : ''}`);
            } else {
                showNotification('✅ Playlist creada');
            }

            closeModal();
            console.log('[CreatePlaylistModal] onSuccess:', !!onSuccess);
            if (onSuccess) {
                console.log('[CreatePlaylistModal] Calling onSuccess with:', newPlaylist.id, trackToAdd);
                onSuccess(newPlaylist.id, trackToAdd);
            }
        } catch (error) {
            console.error('[PlaylistUI] Error al crear:', error);
            showNotification('❌ Error al crear la playlist');
        }
    };

    submitBtn.addEventListener('click', handleSubmit);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });
}

/**
 * Mostrar página de playlists
 */
export function showPlaylistsPage(onBack = null) {
    const existing = document.querySelector('.playlists-page-container');
    if (existing) existing.remove();

    const playlists = playlistSystem.getAllPlaylists();
    const mainContent = document.querySelector('.main-content');

    if (!mainContent) {
        console.error('[PlaylistUI] No se encontró .main-content');
        return;
    }

    const page = document.createElement('div');
    page.className = 'playlists-page-container album-page';
    page.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(75, 155, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="playlists-icon">
                    <i class="fa-solid fa-list" style="font-size: 120px; color: #4b9bff;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">BIBLIOTECA</span>
                    <h1 class="album-page-title">Mis Playlists</h1>
                    <div class="album-page-meta">
                        <span>${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="album-page-content">
            <div class="album-actions">
                <button class="playlists-create-new-btn">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>

            ${playlists.length === 0 ? `
                <div style="text-align: center; padding: 60px 20px; color: #b3b3b3;">
                    <i class="fa-solid fa-list" style="font-size: 80px; margin-bottom: 20px; display: block; opacity: 0.5;"></i>
                    <p>No tienes playlists aún</p>
                </div>
            ` : `
                <div class="playlists-grid">
                    ${playlists.map(pl => `
                        <div class="playlist-card" data-playlist-id="${pl.id}">
                            <div class="playlist-card-cover">
                                <i class="fa-solid fa-list"></i>
                                <button class="playlist-card-play-btn" aria-label="Reproducir">
                                    <i class="fa-solid fa-play"></i>
                                </button>
                            </div>
                            <div class="playlist-card-info">
                                <h3>${escapeHtml(pl.name)}</h3>
                                <p>${pl.tracks.length} canción${pl.tracks.length !== 1 ? 'es' : ''}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;

    // Ocultar contenido principal
    document.querySelector('.content').style.display = 'none';
    mainContent.appendChild(page);

    // Events
    page.querySelector('.back-button').addEventListener('click', () => {
        page.remove();
        document.querySelector('.content').style.display = 'block';
        if (onBack) onBack();
    });

    page.querySelector('.playlists-create-new-btn').addEventListener('click', () => {
        showCreatePlaylistModal();
    });

    // Playlist cards
    page.querySelectorAll('.playlist-card').forEach(card => {
        const playlistId = card.dataset.playlistId;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.playlist-card-play-btn')) {
                showPlaylistDetailPage(playlistId, () => {
                    page.remove();
                });
            }
        });

        card.querySelector('.playlist-card-play-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const playlist = playlistSystem.getPlaylist(playlistId);
            if (playlist && playlist.tracks.length > 0) {
                // Disparar evento global para reproducir playlist
                window.dispatchEvent(new CustomEvent('playlist:play', {
                    detail: { playlistId, tracks: playlist.tracks }
                }));
                showNotification('▶️ Reproduciendo playlist');
            }
        });
    });
}

/**
 * Mostrar página de detalle de una playlist
 */
export function showPlaylistDetailPage(playlistId, onBack = null) {
    const playlist = playlistSystem.getPlaylist(playlistId);
    if (!playlist) {
        showNotification('❌ Playlist no encontrada');
        return;
    }

    const existing = document.querySelector('.playlist-detail-container');
    if (existing) existing.remove();

    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const page = document.createElement('div');
    page.className = 'playlist-detail-container album-page';
    page.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(75, 155, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="playlist-detail-icon">
                    <i class="fa-solid fa-list" style="font-size: 120px; color: #4b9bff;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">PLAYLIST</span>
                    <h1 class="album-page-title">${escapeHtml(playlist.name)}</h1>
                    ${playlist.description ? `<p style="color: #b3b3b3; margin-top: 8px;">${escapeHtml(playlist.description)}</p>` : ''}
                    <div class="album-page-meta">
                        <span>${playlist.tracks.length} canción${playlist.tracks.length !== 1 ? 'es' : ''}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="album-page-content">
            <div class="album-actions">
                ${playlist.tracks.length > 0 ? `
                    <button class="playlist-play-all-btn">
                        <i class="fa-solid fa-play"></i>
                    </button>
                    <button class="playlist-shuffle-btn">
                        <i class="fa-solid fa-shuffle"></i>
                    </button>
                ` : ''}
                <button class="playlist-edit-btn">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="playlist-delete-btn">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>

            ${playlist.tracks.length === 0 ? `
                <div style="text-align: center; padding: 60px 20px; color: #b3b3b3;">
                    <i class="fa-solid fa-music" style="font-size: 60px; margin-bottom: 20px; display: block;"></i>
                    <p>Esta playlist está vacía</p>
                </div>
            ` : `
                <div class="album-tracks-list">
                    <div class="tracks-header">
                        <span class="track-col-number">#</span>
                        <span class="track-col-title">Título</span>
                        <span class="track-col-album">Álbum</span>
                        <span class="track-col-heart"></span>
                        <span class="track-col-duration"><i class="fa-regular fa-clock"></i></span>
                    </div>
                    ${playlist.tracks.map((track, idx) => `
                        <div class="track-row playlist-track-row" data-track-id="${track.id}">
                            <span class="track-col-number">${idx + 1}</span>
                            <div class="track-col-title">
                                <span class="track-name">${escapeHtml(track.name)}</span>
                                <span class="track-artists">${escapeHtml(track.artist)}</span>
                            </div>
                            <div class="track-col-album">
                                <span>${escapeHtml(track.album)}</span>
                            </div>
                            <button class="playlist-track-remove-btn" data-track-id="${track.id}" aria-label="Quitar">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                            <span class="track-col-duration">${track.duration}</span>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;

    document.querySelector('.content').style.display = 'none';
    mainContent.appendChild(page);

    // Events
    page.querySelector('.back-button').addEventListener('click', () => {
        page.remove();
        document.querySelector('.content').style.display = 'block';
        if (onBack) onBack();
    });

    page.querySelector('.playlist-delete-btn').addEventListener('click', () => {
        if (confirm(`¿Eliminar "${playlist.name}"?`)) {
            playlistSystem.deletePlaylist(playlistId);
            showNotification('🗑️ Playlist eliminada');
            page.remove();
            showPlaylistsPage();
        }
    });

    page.querySelector('.playlist-edit-btn').addEventListener('click', () => {
        showEditPlaylistModal(playlistId);
    });

    if (playlist.tracks.length > 0) {
        page.querySelector('.playlist-play-all-btn')?.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('playlist:play', {
                detail: { playlistId, tracks: playlist.tracks }
            }));
            showNotification('▶️ Reproduciendo playlist');
        });

        page.querySelector('.playlist-shuffle-btn')?.addEventListener('click', () => {
            const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
            window.dispatchEvent(new CustomEvent('playlist:play', {
                detail: { playlistId, tracks: shuffled, shuffle: true }
            }));
            showNotification('🔀 Modo aleatorio activado');
        });

        page.querySelectorAll('.playlist-track-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.trackId;
                playlistSystem.removeTrackFromPlaylist(playlistId, trackId);
                showNotification('🗑️ Canción removida');
                page.remove();
                showPlaylistDetailPage(playlistId, onBack);
            });
        });

        page.querySelectorAll('.playlist-track-row').forEach(row => {
            row.addEventListener('click', function () {
                const trackId = this.dataset.trackId;
                const track = playlistSystem.getTrackFromPlaylist(playlistId, trackId);
                if (track) {
                    window.dispatchEvent(new CustomEvent('playlist:playTrack', {
                        detail: { playlistId, track, trackId }
                    }));
                }
            });
        });
    }
}

/**
 * Mostrar modal de edición de playlist
 */
export function showEditPlaylistModal(playlistId) {
    const playlist = playlistSystem.getPlaylist(playlistId);
    if (!playlist) return;

    const existing = document.querySelector('.edit-playlist-modal-container');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'edit-playlist-modal-container';
    modal.innerHTML = `
        <div class="edit-playlist-modal-overlay"></div>
        <div class="edit-playlist-modal">
            <div class="edit-playlist-modal-header">
                <h3>Editar Playlist</h3>
                <button class="edit-playlist-modal-close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="edit-playlist-modal-body">
                <div class="form-group">
                    <label for="editPlaylistNameInput">Nombre</label>
                    <input type="text" id="editPlaylistNameInput" class="playlist-input" 
                           value="${escapeHtml(playlist.name)}" maxlength="100">
                </div>

                <div class="form-group">
                    <label for="editPlaylistDescInput">Descripción</label>
                    <textarea id="editPlaylistDescInput" class="playlist-textarea" 
                              maxlength="200" rows="3">${escapeHtml(playlist.description)}</textarea>
                </div>

                <button class="edit-playlist-submit-btn">
                    <i class="fa-solid fa-check"></i> Guardar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const overlay = modal.querySelector('.edit-playlist-modal-overlay');
    const closeBtn = modal.querySelector('.edit-playlist-modal-close');
    const submitBtn = modal.querySelector('.edit-playlist-submit-btn');

    const closeModal = () => {
        modal.remove();
    };

    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    submitBtn.addEventListener('click', () => {
        const name = modal.querySelector('#editPlaylistNameInput').value.trim();
        if (!name) {
            showNotification('⚠️ Ingresa un nombre');
            return;
        }

        try {
            const desc = modal.querySelector('#editPlaylistDescInput').value.trim();
            playlistSystem.updatePlaylist(playlistId, { name, description: desc });
            showNotification('✅ Playlist actualizada');
            closeModal();
            document.querySelector('.playlist-detail-container')?.remove();
            showPlaylistDetailPage(playlistId);
        } catch (error) {
            showNotification('❌ Error al actualizar');
        }
    });
}

/**
 * Utilidad: escapar HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Utilidad: mostrar notificación
 */
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
    }, 2500);
}

export default { showPlaylistModal, showCreatePlaylistModal, showPlaylistsPage, showPlaylistDetailPage };
