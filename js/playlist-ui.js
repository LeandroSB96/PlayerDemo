/**
  PlaylistUI - Sistema de UI para playlists
*/

import { playlistSystem } from './playlist-system.js';
import { favoritesManager } from './favorites-manager.js';

// Verificar y limpiar playlists corruptas al cargar
function cleanupCorruptedPlaylists() {
    try {
        const allPlaylists = playlistSystem.getAllPlaylists();
        let needsCleanup = false;
        
        allPlaylists.forEach(pl => {
            // Verificar si la playlist tiene datos válidos
            if (!pl.name || typeof pl.name !== 'string') {
                console.warn('[PlaylistUI] Playlist corrupta detectada, eliminando:', pl);
                playlistSystem.deletePlaylist(pl.id);
                needsCleanup = true;
            }
        });
        
        if (needsCleanup) {
            showNotification('🧹 Limpieza de datos completada');
        }
    } catch (error) {
        console.error('[PlaylistUI] Error en limpieza inicial:', error);
    }
}

// Ejecutar limpieza al cargar el módulo
cleanupCorruptedPlaylists();

/**
 * Helper: confirmAction con modal mejorado
 */
async function confirmAction(options = {}) {
    const defaultOpts = {
        title: '¿Estás seguro?',
        message: 'Confirmar acción',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        icon: '⚠️'
    };
    const opts = { ...defaultOpts, ...options };

    // Intentar usar el modal global si existe
    if (window.showConfirmationModal && typeof window.showConfirmationModal === 'function') {
        try {
            return await window.showConfirmationModal(opts);
        } catch (e) {
            console.error('[PlaylistUI] Error con showConfirmationModal:', e);
        }
    }

    // Fallback: crear modal local
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.style.cssText = `
            background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        `;

        modal.innerHTML = `
            <div style="margin-bottom: 24px;">
                <span style="font-size: 48px; margin-bottom: 16px; display: block;">${opts.icon}</span>
                <h2 style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px;">${escapeHtml(opts.title)}</h2>
                <p style="font-size: 14px; color: #b3b3b3; line-height: 1.5;">${escapeHtml(opts.message)}</p>
            </div>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="confirm-cancel-btn" style="padding: 12px 24px; background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; min-width: 120px;">
                    ${escapeHtml(opts.cancelText)}
                </button>
                <button class="confirm-ok-btn" style="padding: 12px 24px; background: linear-gradient(135deg, #ff4b4b 0%, #d32f2f 100%); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; min-width: 120px;">
                    ${escapeHtml(opts.confirmText)}
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const cancelBtn = modal.querySelector('.confirm-cancel-btn');
        const okBtn = modal.querySelector('.confirm-ok-btn');

        const close = (result) => {
            overlay.remove();
            resolve(result);
        };

        cancelBtn.addEventListener('click', () => close(false));
        okBtn.addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });
    });
}

/**
 * Generar collage de portadas
 */
function generatePlaylistCollageDataUrl(tracks, size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(50, 50, 80, 0.5)';
    ctx.fillRect(0, 0, size, size);

    if (!tracks || tracks.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', size / 2, size / 2);
        return canvas.toDataURL();
    }

    const covers = tracks.slice(0, 4).map(t => t.cover).filter(Boolean);
    
    if (covers.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', size / 2, size / 2);
        return canvas.toDataURL();
    }

    const gridSize = covers.length === 1 ? 1 : 2;
    const tileSize = size / gridSize;

    covers.forEach((coverUrl, idx) => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                const row = Math.floor(idx / gridSize);
                const col = idx % gridSize;
                const x = col * tileSize;
                const y = row * tileSize;
                ctx.drawImage(img, x, y, tileSize, tileSize);
            };
            
            img.onerror = function() {
                ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
                const row = Math.floor(idx / gridSize);
                const col = idx % gridSize;
                const x = col * tileSize;
                const y = row * tileSize;
                ctx.fillRect(x, y, tileSize, tileSize);
            };
            
            img.src = coverUrl;
        } catch (e) {
            console.warn('Error loading cover:', coverUrl, e);
        }
    });

    return canvas.toDataURL();
}

/**
 * Mostrar modal para agregar track/álbum a playlist
 */
export function showPlaylistModal(item, onSuccess = null) {
    const isAlbum = item && Array.isArray(item.tracks);
    if (!item || (isAlbum ? item.tracks.length === 0 : (!item.name || !item.audioFile))) {
        console.error('[PlaylistUI] Item inválido:', item);
        showNotification('❌ Error: datos inválidos');
        return;
    }

    const existing = document.querySelector('.playlist-modal-container');
    if (existing) existing.remove();

    const playlists = playlistSystem.getAllPlaylists();

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
                <div class="playlist-modal-track-info">
                    <img src="${(isAlbum ? (item.cover || 'assets/images/default-album.webp') : (item.cover || 'assets/images/default-album.webp'))}" alt="${escapeHtml(item.name)}">
                    <div>
                        <p class="modal-track-name">${escapeHtml(item.name)}</p>
                        <p class="modal-track-artist">${isAlbum ? `${item.tracks.length} pista(s) • ${escapeHtml(item.artist || '')}` : escapeHtml(item.artist || 'Desconocido')}</p>
                    </div>
                </div>

                <button class="playlist-modal-create-btn">
                    <i class="fa-solid fa-plus"></i> Nueva Playlist
                </button>

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

    const overlay = modal.querySelector('.playlist-modal-overlay');
    const closeBtn = modal.querySelector('.playlist-modal-close');
    const createBtn = modal.querySelector('.playlist-modal-create-btn');
    const addBtns = modal.querySelectorAll('.playlist-modal-add-btn');

    const closeModal = () => modal.remove();

    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    createBtn.addEventListener('click', () => {
        closeModal();
        showCreatePlaylistModal(item, onSuccess);
    });

    addBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const playlistId = btn.dataset.playlistId;

            try {
                if (isAlbum) {
                    const addedCount = playlistSystem.addAlbumToPlaylist(playlistId, item);
                    if (addedCount > 0) {
                        showNotification(`✅ Álbum agregado (${addedCount} pistas)`);
                        closeModal();
                        if (onSuccess) setTimeout(() => onSuccess(playlistId, item), 100);
                    } else {
                        showNotification('⚠️ Ninguna pista nueva');
                    }
                } else {
                    const added = playlistSystem.addTrackToPlaylist(playlistId, item);
                    if (added) {
                        showNotification('✅ Canción agregada');
                        closeModal();
                        if (onSuccess) setTimeout(() => onSuccess(playlistId, item), 100);
                    } else {
                        showNotification('⚠️ Ya está en la playlist');
                    }
                }
            } catch (error) {
                console.error('[PlaylistUI] Error:', error);
                showNotification('❌ Error al agregar');
            }
        });
    });
}

/**
 * Modal para crear playlist
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

    const closeModal = () => modal.remove();

    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    const handleSubmit = () => {
        const name = nameInput.value.trim();
        if (!name) {
            showNotification('⚠️ Ingresa un nombre');
            return;
        }

        try {
            const desc = modal.querySelector('#playlistDescInput').value.trim();
            const newPlaylist = playlistSystem.createPlaylist(name, desc);

            if (trackToAdd) {
                const added = playlistSystem.addTrackToPlaylist(newPlaylist.id, trackToAdd);
                showNotification(`✅ Playlist creada${added ? ' y canción agregada' : ''}`);
            } else {
                showNotification('✅ Playlist creada');
            }

            closeModal();
            if (onSuccess) onSuccess(newPlaylist.id, trackToAdd);
        } catch (error) {
            console.error('[PlaylistUI] Error:', error);
            showNotification('❌ Error al crear');
        }
    };

    submitBtn.addEventListener('click', handleSubmit);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });
}

/**
 * Página de playlists (SIN botón de eliminar en las cards)
 */
export function showPlaylistsPage(onBack = null) {
    const existingPages = document.querySelectorAll('.album-page, .favorites-page, .playlists-page-container, .playlist-detail-container, .explore-page, .artists-page');
    existingPages.forEach(page => page.remove());

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
                <div class="playlists-icon" style="width: 232px; height: 232px; display: flex; align-items: center; justify-content: center; background: rgba(75, 155, 255, 0.1); border-radius: 8px;">
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
                <button class="playlists-create-new-btn" title="Crear nueva playlist" style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(131deg, rgba(115, 59, 161, 1) 31%, rgba(207, 9, 253, 1) 71%); border: none; color: #f5f3f3; font-size: 20px; cursor: pointer;">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <button class="playlists-reset-btn" title="Limpiar todas" style="width: 48px; height: 48px; border-radius: 50%; background: transparent; border: 2px solid rgba(255, 69, 69, 0.3); color: #ff4545; font-size: 18px; cursor: pointer;">
                    <i class="fa-solid fa-broom"></i>
                </button>
            </div>

            ${playlists.length === 0 ? `
                <div style="text-align: center; padding: 60px 20px; color: #b3b3b3;">
                    <i class="fa-solid fa-list" style="font-size: 80px; margin-bottom: 20px; display: block; opacity: 0.5;"></i>
                    <p>No tienes playlists aún</p>
                </div>
            ` : `
                <div class="albums-grid playlists-grid">
                    ${playlists.map(pl => `
                        <div class="album-card playlist-card" data-playlist-id="${pl.id}">
                            <div class="album-cover">
                                <img src="${generatePlaylistCollageDataUrl(pl.tracks)}" alt="${escapeHtml(pl.name)}" />
                                <button class="album-play-btn" aria-label="Reproducir"></button>
                            </div>
                            <div class="album-info">
                                <h3 class="album-title">${escapeHtml(pl.name)}</h3>
                                <p class="album-artist">${pl.tracks.length} canción${pl.tracks.length !== 1 ? 'es' : ''}</p>
                            </div>
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

    page.querySelector('.playlists-create-new-btn').addEventListener('click', () => {
        showCreatePlaylistModal(null, () => {
            page.remove();
            showPlaylistsPage(onBack);
        });
    });

    page.querySelector('.playlists-reset-btn').addEventListener('click', async () => {
        const confirmed = await confirmAction({
            title: 'Eliminar todas las playlists',
            message: '¿Eliminar TODAS las playlists? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar Todo',
            cancelText: 'Cancelar',
            icon: '🗑️'
        });
        
        if (confirmed) {
            playlistSystem.clearAll();
            showNotification('🗑️ Todas las playlists eliminadas');
            page.remove();
            showPlaylistsPage(onBack);
        }
    });

    // Cards de playlist (solo abrir detalle o reproducir)
    page.querySelectorAll('.playlist-card').forEach(card => {
        const playlistId = card.dataset.playlistId;

        // Click en la card (abrir detalle)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.album-play-btn')) {
                showPlaylistDetailPage(playlistId, onBack);
            }
        });

        // Botón play
        const playBtn = card.querySelector('.album-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlist = playlistSystem.getPlaylist(playlistId);
                if (playlist && playlist.tracks.length > 0) {
                    window.dispatchEvent(new CustomEvent('playlist:play', {
                        detail: { playlistId, tracks: playlist.tracks }
                    }));
                    showNotification('▶️ Reproduciendo playlist');
                } else {
                    showNotification('⚠️ Playlist vacía');
                }
            });
        }
    });
}

/**
 * Página de detalle de playlist
 */
export function showPlaylistDetailPage(playlistId, onBack = null) {
    const playlist = playlistSystem.getPlaylist(playlistId);
    if (!playlist) {
        showNotification('❌ Playlist no encontrada');
        return;
    }

    const allPages = document.querySelectorAll('.playlists-page-container, .playlist-detail-container, .album-page, .favorites-page, .explore-page, .artists-page');
    allPages.forEach(page => page.remove());

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
                <div style="width: 232px; height: 232px; display: flex; align-items: center; justify-content: center; background: rgba(75, 155, 255, 0.1); border-radius: 8px;">
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
                    <button class="playlist-play-all-btn" style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(131deg, rgba(115, 59, 161, 1) 31%, rgba(207, 9, 253, 1) 71%); border: none; color: #f5f3f3; font-size: 20px; cursor: pointer;">
                        <i class="fa-solid fa-play"></i>
                    </button>
                    <button class="playlist-shuffle-btn" style="width: 48px; height: 48px; border-radius: 50%; background: transparent; border: 2px solid rgba(255, 255, 255, 0.2); color: #b3b3b3; font-size: 18px; cursor: pointer;">
                        <i class="fa-solid fa-shuffle"></i>
                    </button>
                    <button class="playlist-clear-btn" title="Vaciar playlist" style="width: 48px; height: 48px; border-radius: 50%; background: transparent; border: 2px solid rgba(255, 149, 0, 0.3); color: #ff9500; font-size: 18px; cursor: pointer;">
                        <i class="fa-solid fa-broom"></i>
                    </button>
                ` : ''}
                <button class="playlist-edit-btn" style="width: 48px; height: 48px; border-radius: 50%; background: transparent; border: 2px solid rgba(75, 155, 255, 0.3); color: #4b9bff; font-size: 18px; cursor: pointer;">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="playlist-delete-btn" style="width: 48px; height: 48px; border-radius: 50%; background: transparent; border: 2px solid rgba(255, 69, 69, 0.3); color: #ff4545; font-size: 18px; cursor: pointer;">
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
                            <span class="track-col-number" data-number="${idx + 1}"></span>
                            <div class="track-col-title">
                                <span class="track-name">${escapeHtml(track.name)} ${track.explicit ? "<span class='explicit-track-badge'>E</span>" : ''}</span>
                                <span class="track-artists">${escapeHtml(track.artist)}</span>
                            </div>
                            <div class="track-col-album">
                                <span>${escapeHtml(track.album)}</span>
                            </div>
                            <div class="track-col-heart">
                                <button class="track-favorite-btn ${favoritesManager.isFavorite(track.name, track.artist, track.album) ? 'active' : ''}">
                                    <i class="${favoritesManager.isFavorite(track.name, track.artist, track.album) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                                </button>
                            </div>
                            <span class="track-col-duration">${track.duration}</span>
                            <button class="track-remove-btn" data-track-id="${track.id}">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
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
        showPlaylistsPage(onBack);
    });

    page.querySelector('.playlist-delete-btn').addEventListener('click', async () => {
        const confirmed = await confirmAction({
            title: 'Eliminar Playlist',
            message: `¿Eliminar "${playlist.name}"?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            icon: '🗑️'
        });
        
        if (confirmed) {
            playlistSystem.deletePlaylist(playlistId);
            showNotification('🗑️ Playlist eliminada');
            page.remove();
            showPlaylistsPage(onBack);
        }
    });

    page.querySelector('.playlist-edit-btn').addEventListener('click', () => {
        showEditPlaylistModal(playlistId, () => {
            page.remove();
            showPlaylistDetailPage(playlistId, onBack);
        });
    });

    if (playlist.tracks.length > 0) {
        page.querySelector('.playlist-play-all-btn').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('playlist:play', {
                detail: { playlistId, tracks: playlist.tracks }
            }));
            showNotification('▶️ Reproduciendo');
        });

        page.querySelector('.playlist-shuffle-btn').addEventListener('click', () => {
            const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
            window.dispatchEvent(new CustomEvent('playlist:play', {
                detail: { playlistId, tracks: shuffled }
            }));
            showNotification('🔀 Modo aleatorio');
        });

        page.querySelector('.playlist-clear-btn').addEventListener('click', async () => {
            const confirmed = await confirmAction({
                title: 'Vaciar Playlist',
                message: `¿Eliminar todas las ${playlist.tracks.length} canciones?`,
                confirmText: 'Vaciar',
                cancelText: 'Cancelar',
                icon: '🧹'
            });
            
            if (confirmed) {
                playlist.tracks.forEach(t => playlistSystem.removeTrackFromPlaylist(playlistId, t.id));
                showNotification('🧹 Playlist vaciada');
                page.remove();
                showPlaylistDetailPage(playlistId, onBack);
            }
        });

        page.querySelectorAll('.track-remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.trackId;
                const track = playlist.tracks.find(t => t.id === trackId);

                const confirmed = await confirmAction({
                    title: 'Quitar Canción',
                    message: `¿Quitar "${track?.name || 'esta canción'}"?`,
                    confirmText: 'Quitar',
                    cancelText: 'Cancelar',
                    icon: '🗑️'
                });

                if (confirmed) {
                    playlistSystem.removeTrackFromPlaylist(playlistId, trackId);
                    showNotification('🗑️ Canción removida');
                    page.remove();
                    showPlaylistDetailPage(playlistId, onBack);
                }
            });
        });

        page.querySelectorAll('.playlist-track-row').forEach(row => {
            row.addEventListener('click', function(e) {
                if (e.target.closest('.track-favorite-btn, .track-remove-btn')) return;
                
                const trackId = this.dataset.trackId;
                const track = playlist.tracks.find(t => t.id === trackId);
                if (track) {
                    window.dispatchEvent(new CustomEvent('playlist:playTrack', {
                        detail: { playlistId, track, tracks: playlist.tracks }
                    }));
                }
            });
        });

        page.querySelectorAll('.track-favorite-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const row = this.closest('.track-row');
                const trackId = row.dataset.trackId;
                const track = playlist.tracks.find(t => t.id === trackId);
                if (!track) return;

                try {
                    await favoritesManager.toggleFavorite(track);
                    const isFav = favoritesManager.isFavorite(track.name, track.artist, track.album);
                    const icon = this.querySelector('i');
                    
                    icon.className = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                    this.classList.toggle('active', isFav);
                    
                    window.dispatchEvent(new Event('favorites:changed'));
                    showNotification(isFav ? '❤️ Agregado' : '💔 Removido');
                } catch (err) {
                    console.error('[PlaylistUI] Error:', err);
                }
            });
        });
    }
}

/**
 * Modal de edición
 */
function showEditPlaylistModal(playlistId, onSuccess = null) {
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
                    <label for="editNameInput">Nombre</label>
                    <input type="text" id="editNameInput" class="playlist-input" 
                           value="${escapeHtml(playlist.name)}" maxlength="100">
                </div>

                <div class="form-group">
                    <label for="editDescInput">Descripción</label>
                    <textarea id="editDescInput" class="playlist-textarea" 
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

    const closeModal = () => modal.remove();

    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    submitBtn.addEventListener('click', () => {
        const name = modal.querySelector('#editNameInput').value.trim();
        if (!name) {
            showNotification('⚠️ Ingresa un nombre');
            return;
        }

        try {
            const desc = modal.querySelector('#editDescInput').value.trim();
            playlistSystem.updatePlaylist(playlistId, { name, description: desc });
            showNotification('✅ Actualizada');
            closeModal();
            if (onSuccess) onSuccess();
        } catch (error) {
            showNotification('❌ Error');
        }
    });
}

/**
 * Utilidades
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function showNotification(message) {
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 2500);
}

export default { 
    showPlaylistModal, 
    showCreatePlaylistModal, 
    showPlaylistsPage, 
    showPlaylistDetailPage 
};
