// Gestor de Favoritos con Storage Persistente
class FavoritesManager {
    constructor() {
        this.storageKey = 'musicPlayerFavorites';
        this.favorites = [];
        this.initialized = false;
    }

    // Cargar favoritos desde storage persistente
    async loadFavorites() {
        try {
            // Compatibilidad: si existe `window.storage` (Electron/hosted env), usarlo;
            // de lo contrario, usar localStorage del navegador.
            let saved = null;
            if (window.storage && typeof window.storage.get === 'function') {
                saved = await window.storage.get(this.storageKey);
                if (saved && saved.value) {
                    this.favorites = JSON.parse(saved.value);
                } else {
                    this.favorites = [];
                }
            } else {
                const raw = localStorage.getItem(this.storageKey);
                if (raw) {
                    this.favorites = JSON.parse(raw);
                } else {
                    this.favorites = [];
                }
            }
            this.initialized = true;
            console.log('✅ Favoritos cargados:', this.favorites.length);
            return this.favorites;
        } catch (error) {
            console.error('Error cargando favoritos:', error);
            this.favorites = [];
            this.initialized = true;
            return [];
        }
    }

    // Guardar favoritos en storage persistente
    async saveFavorites() {
        try {
            if (window.storage && typeof window.storage.set === 'function') {
                await window.storage.set(this.storageKey, JSON.stringify(this.favorites));
            } else {
                localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
            }
            console.log('✅ Favoritos guardados:', this.favorites.length);
        } catch (error) {
            console.error('Error guardando favoritos:', error);
        }
    }

    // Crear un ID único para cada canción
    createTrackId(trackName, artistName, albumName) {
        const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, '-');
        return `${normalize(artistName)}_${normalize(albumName)}_${normalize(trackName)}`;
    }

    // Agregar una canción a favoritos
    async addFavorite(track) {
        const trackId = this.createTrackId(track.name, track.artist, track.album);

        // Verificar si existe
        const exists = this.favorites.some(fav => fav.id === trackId);
        if (exists) {
            console.log('⚠️ La canción ya está en favoritos');
            return false;
        }

        // Crear el objeto de favorito
        const favorite = {
            id: trackId,
            name: track.name,
            artist: track.artist,
            album: track.album,
            cover: track.cover,
            audioFile: track.audioFile,
            duration: track.duration || '0:00',
            explicit: !!track.explicit,
            addedAt: new Date().toISOString()
        };

        this.favorites.push(favorite);
        await this.saveFavorites();
        try { window.dispatchEvent(new Event('favorites:changed')); } catch (err) { /* ignore */ }
        console.log('❤️ Agregado a favoritos:', track.name);
        return true;
    }

    // Remover una canción de favoritos
    async removeFavorite(trackName, artistName, albumName) {
        const trackId = this.createTrackId(trackName, artistName, albumName);
        const initialLength = this.favorites.length;

        this.favorites = this.favorites.filter(fav => fav.id !== trackId);

        if (this.favorites.length < initialLength) {
            await this.saveFavorites();
            try { window.dispatchEvent(new Event('favorites:changed')); } catch (err) { /* ignore */ }
            console.log('💔 Removido de favoritos:', trackName);
            return true;
        }

        return false;
    }

    // Verificar si una canción es favorita
    isFavorite(trackName, artistName, albumName) {
        const trackId = this.createTrackId(trackName, artistName, albumName);
        return this.favorites.some(fav => fav.id === trackId);
    }

    // Toggle: agregar o remover según el estado actual
    async toggleFavorite(track) {
        if (this.isFavorite(track.name, track.artist, track.album)) {
            return await this.removeFavorite(track.name, track.artist, track.album);
        } else {
            return await this.addFavorite(track);
        }
    }

    // Obtener todos los favoritos
    getAllFavorites() {
        return [...this.favorites]; // Retorna una copia
    }

    // Obtener favoritos ordenados por fecha (más recientes primero)
    getFavoritesByDate() {
        return [...this.favorites].sort((a, b) =>
            new Date(b.addedAt) - new Date(a.addedAt)
        );
    }

    // Obtener favoritos ordenados alfabéticamente
    getFavoritesByName() {
        return [...this.favorites].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    // Buscar favoritos por nombre
    searchFavorites(query) {
        const lowerQuery = query.toLowerCase();
        return this.favorites.filter(fav =>
            fav.name.toLowerCase().includes(lowerQuery) ||
            fav.artist.toLowerCase().includes(lowerQuery) ||
            fav.album.toLowerCase().includes(lowerQuery)
        );
    }

    // Limpiar todos los favoritos
    async clearAllFavorites() {
        this.favorites = [];
        try {
            if (window.storage && typeof window.storage.delete === 'function') {
                await window.storage.delete(this.storageKey);
            } else {
                localStorage.removeItem(this.storageKey);
            }
        } catch (err) {
            console.warn('Error eliminando storage nativo:', err);
            localStorage.removeItem(this.storageKey);
        }
        try { window.dispatchEvent(new Event('favorites:changed')); } catch (err) { /* ignore */ }
        console.log('🗑️ Todos los favoritos eliminados');
    }

    // Obtener cantidad de favoritos
    getFavoritesCount() {
        return this.favorites.length;
    }

    // Exportar favoritos como JSON 
    exportFavorites() {
        return JSON.stringify(this.favorites, null, 2);
    }

    // Importar favoritos desde JSON
    async importFavorites(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.favorites = imported;
                await this.saveFavorites();
                return true;
            }
        } catch (error) {
            console.error('Error importando favoritos:', error);
        }
        return false;
    }
}

// Exportar una instancia única
export const favoritesManager = new FavoritesManager();