/**
  PlaylistSystem - Sistema de gestión de playlists robusto
 */

export class PlaylistSystem {
    constructor() {
        this.storageKey = 'player_demo_playlists_v2';
        this.data = this.loadFromStorage();
    }

    /**
     * Cargar datos desde localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    playlists: parsed.playlists || [],
                    nextId: parsed.nextId || 1
                };
            }
        } catch (error) {
            console.error('[PlaylistSystem] Error al cargar storage:', error);
        }
        return { playlists: [], nextId: 1 };
    }

    /**
     * Guardar datos en localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('[PlaylistSystem] Guardado en localStorage:', this.data);
            return true;
        } catch (error) {
            console.error('[PlaylistSystem] Error al guardar storage:', error);
            return false;
        }
    }

    /**
     * Crear una nueva playlist
      @param {string} name 
      @param {string} description 
      @returns {object} 
     */
    createPlaylist(name, description = '') {
        if (!name || typeof name !== 'string') {
            throw new Error('El nombre de la playlist es requerido y debe ser string');
        }

        const playlist = {
            id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            description: description.trim(),
            tracks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.data.playlists.push(playlist);
        this.saveToStorage();

        console.log('[PlaylistSystem] Playlist creada:', playlist);
        return playlist;
    }

    /**
     * Obtener una playlist por ID
     */
    getPlaylist(playlistId) {
        return this.data.playlists.find(p => p.id === playlistId);
    }

    /**
     * Obtener todas las playlists
     */
    getAllPlaylists() {
        return this.data.playlists;
    }

    /**
     * Añadir una canción a una playlist
     * @param {string} playlistId
     * @param {object} track 
     * @returns {boolean} 
     */
    addTrackToPlaylist(playlistId, track) {
        if (!track || !track.name || !track.audioFile) {
            console.error('[PlaylistSystem] Track inválido:', track);
            throw new Error('Track debe tener name y audioFile');
        }

        const playlist = this.getPlaylist(playlistId);
        if (!playlist) {
            throw new Error(`Playlist con id ${playlistId} no encontrada`);
        }

        // Verificar si ya existe
        const exists = playlist.tracks.some(t =>
            t.name === track.name &&
            t.artist === track.artist &&
            t.album === track.album &&
            t.audioFile === track.audioFile
        );

        if (exists) {
            console.warn('[PlaylistSystem] Track ya existe en la playlist:', track.name);
            return false;
        }

        // Normalizar y agregar
        const normalizedTrack = {
            id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: track.name || 'Sin título',
            artist: track.artist || 'Desconocido',
            album: track.album || 'Desconocido',
            audioFile: track.audioFile,
            duration: track.duration || '0:00',
            cover: track.cover || '',
            addedAt: new Date().toISOString()
        };

        playlist.tracks.push(normalizedTrack);
        playlist.updatedAt = new Date().toISOString();
        this.saveToStorage();

        console.log('[PlaylistSystem] Track agregado a playlist:', normalizedTrack);
        return true;
    }

    /**
     * Añadir un álbum completo (varias pistas) a una playlist
     * @param {string} playlistId
     * @param {object} album 
     * @returns {number} 
     */
    addAlbumToPlaylist(playlistId, album) {
        if (!album || !Array.isArray(album.tracks) || album.tracks.length === 0) {
            console.error('[PlaylistSystem] Álbum inválido:', album);
            throw new Error('Álbum inválido o sin pistas');
        }

        const playlist = this.getPlaylist(playlistId);
        if (!playlist) {
            throw new Error(`Playlist con id ${playlistId} no encontrada`);
        }

        let addedCount = 0;

        for (const t of album.tracks) {
            // comprobar existencia por audioFile
            const exists = playlist.tracks.some(pt => pt.audioFile === t.audioFile);
            if (exists) continue;

            const normalizedTrack = {
                id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: t.name || 'Sin título',
                artist: t.artist || album.artist || 'Desconocido',
                album: t.album || album.name || 'Desconocido',
                audioFile: t.audioFile,
                duration: t.duration || '0:00',
                cover: t.cover || album.cover || '',
                addedAt: new Date().toISOString()
            };

            playlist.tracks.push(normalizedTrack);
            addedCount += 1;
        }

        if (addedCount > 0) {
            playlist.updatedAt = new Date().toISOString();
            this.saveToStorage();
            console.log(`[PlaylistSystem] Álbum agregado a playlist (${addedCount} pistas):`, album.name || album);
        } else {
            console.log('[PlaylistSystem] Ninguna pista nueva para agregar desde el álbum');
        }

        return addedCount;
    }

    /**
     * Remover una canción de una playlist
     */
    removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) {
            throw new Error(`Playlist con id ${playlistId} no encontrada`);
        }

        const initialLength = playlist.tracks.length;
        playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);

        if (playlist.tracks.length < initialLength) {
            playlist.updatedAt = new Date().toISOString();
            this.saveToStorage();
            console.log('[PlaylistSystem] Track removido. Tracks restantes:', playlist.tracks.length);
            return true;
        }

        console.warn('[PlaylistSystem] Track no encontrado:', trackId);
        return false;
    }

    /**
     * Eliminar una playlist completa
     */
    deletePlaylist(playlistId) {
        const initialLength = this.data.playlists.length;
        this.data.playlists = this.data.playlists.filter(p => p.id !== playlistId);

        if (this.data.playlists.length < initialLength) {
            this.saveToStorage();
            console.log('[PlaylistSystem] Playlist eliminada');
            return true;
        }

        console.warn('[PlaylistSystem] Playlist no encontrada:', playlistId);
        return false;
    }

    /**
     * Actualizar nombre o descripción de una playlist
     */
    updatePlaylist(playlistId, updates) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) {
            throw new Error(`Playlist con id ${playlistId} no encontrada`);
        }

        if (updates.name) playlist.name = updates.name.trim();
        if (updates.description !== undefined) playlist.description = updates.description.trim();

        playlist.updatedAt = new Date().toISOString();
        this.saveToStorage();

        console.log('[PlaylistSystem] Playlist actualizada:', playlist);
        return playlist;
    }

    /**
     * Obtener un track específico de una playlist
     */
    getTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) return null;
        return playlist.tracks.find(t => t.id === trackId);
    }

    /**
     * Verificar si un track existe en una playlist por coincidencia de datos
     */
    trackExists(playlistId, trackName, trackArtist, trackAlbum) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) return false;

        return playlist.tracks.some(t =>
            t.name === trackName &&
            t.artist === trackArtist &&
            t.album === trackAlbum
        );
    }

    /**
     * Obtener cantidad total de playlists
     */
    getPlaylistCount() {
        return this.data.playlists.length;
    }

    /**
     * Obtener cantidad total de tracks en una playlist
     */
    getTrackCount(playlistId) {
        const playlist = this.getPlaylist(playlistId);
        return playlist ? playlist.tracks.length : 0;
    }

    /**
     * Limpiar todos los datos (útil para testing)
     */
    clearAll() {
        this.data = { playlists: [], nextId: 1 };
        localStorage.removeItem(this.storageKey);
        console.log('[PlaylistSystem] Todos los datos borrados');
    }
}

// Crear instancia global
export const playlistSystem = new PlaylistSystem();
export default playlistSystem;
