class FavoritesManager {
    constructor() {
        this.storageKey = 'musicPlayerFavorites';
        this.favorites = this.loadFavorites();
    }

    // Cargar favoritos desde localStorage
    loadFavorites() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error cargando favoritos:', error);
            return [];
        }
    }

    // Guardar favoritos en localStorage
    saveFavorites() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
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
    addFavorite(track) {
        const trackId = this.createTrackId(track.name, track.artist, track.album);

        // si existe
        const exists = this.favorites.some(fav => fav.id === trackId);
        if (exists) {
            console.log('⚠️ La canción ya está en favoritos');
            return false;
        }

        // Crea el objeto de favorito
        const favorite = {
            id: trackId,
            name: track.name,
            artist: track.artist,
            album: track.album,
            cover: track.cover,
            audioFile: track.audioFile,
            duration: track.duration || '0:00',
            addedAt: new Date().toISOString()
        };

        this.favorites.push(favorite);
        this.saveFavorites();
        console.log('❤️ Agregado a favoritos:', track.name);
        return true;
    }

    // Remover una canción de favoritos
    removeFavorite(trackName, artistName, albumName) {
        const trackId = this.createTrackId(trackName, artistName, albumName);
        const initialLength = this.favorites.length;

        this.favorites = this.favorites.filter(fav => fav.id !== trackId);

        if (this.favorites.length < initialLength) {
            this.saveFavorites();
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
    toggleFavorite(track) {
        if (this.isFavorite(track.name, track.artist, track.album)) {
            return this.removeFavorite(track.name, track.artist, track.album);
        } else {
            return this.addFavorite(track);
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

    // Limpiar todos los favoritos (con confirmación)
    clearAllFavorites() {
        this.favorites = [];
        this.saveFavorites();
        console.log('🗑️ Todos los favoritos eliminados');
    }

    // Obtener cantidad de favoritos
    getFavoritesCount() {
        return this.favorites.length;
    }

    // Exportar favoritos como JSON (para backup)
    exportFavorites() {
        return JSON.stringify(this.favorites, null, 2);
    }

    // Importar favoritos desde JSON
    importFavorites(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.favorites = imported;
                this.saveFavorites();
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




