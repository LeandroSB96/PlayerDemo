// El token se obtiene desde un proxy local (/spotify-token)
class SpotifyService {
    constructor() {
        this.accessToken = null;
        this.tokenType = 'Bearer';
        this.expiresIn = 0;
        this.tokenTimestamp = null;
        // Caché para optimizar llamadas a la API
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutos
    }

    async initialize() {
        await this.getAccessToken();
    }

    // Método auxiliar para caché
    async cachedFetch(key, fetchFunction) {
        const now = Date.now();
        if (this.cache.has(key)) {
            const { data, timestamp } = this.cache.get(key);
            if (now - timestamp < this.cacheTimeout) {
                return data;
            } else {
                this.cache.delete(key);
            }
        }
        const data = await fetchFunction();
        this.cache.set(key, { data, timestamp: now });
        return data;
    }

    async getAccessToken() {
        try {
            let resp;
            try {
                resp = await fetch('/spotify-token');
            } catch (err) {
                console.warn('Fetch relativo a /spotify-token falló, intentando fallback:', err);
            }

            // Si la petición relativa no fue exitosa, intentamos el proxy en localhost:3001
            if (!resp || !resp.ok) {
                const fallbackUrl = 'http://localhost:3001/spotify-token';
                resp = await fetch(fallbackUrl);
            }

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Token endpoint error: ${resp.status} ${text}`);
            }

            const data = await resp.json();
            this.accessToken = data.access_token;
            this.tokenType = data.token_type || 'Bearer';
            this.expiresIn = data.expires_in || 3600;
            this.tokenTimestamp = Date.now();
            return this.accessToken;
        } catch (error) {
            console.error('Error obteniendo el token de acceso desde el proxy:', error);
            throw error;
        }
    }

    async checkAndRefreshToken() {
        const now = Date.now();
        const tokenAge = (now - this.tokenTimestamp) / 1000;

        if (tokenAge >= this.expiresIn) {
            await this.getAccessToken();
        }
    }

    // Búsqueda de tracks
    // Búsqueda general (artistas, álbumes y canciones)
    async search(query, types = ['artist', 'album', 'track'], limit = 5) {
        await this.checkAndRefreshToken();
        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${types.join(',')}&limit=${limit}`, {
                headers: {
                    'Authorization': `${this.tokenType} ${this.accessToken}`
                }
            });
            const data = await response.json();
            return {
                artists: data.artists?.items || [],
                albums: data.albums?.items || [],
                tracks: data.tracks?.items || []
            };
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            throw error;
        }
    }

    async searchTrack(query) {
        await this.checkAndRefreshToken();
        try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
                headers: {
                    'Authorization': `${this.tokenType} ${this.accessToken}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error buscando track:', error);
            throw error;
        }
    }

    // Búsqueda de artista por nombre
    async searchArtistByName(artistName) {
        return this.cachedFetch(`search_artist_${artistName}`, async () => {
            await this.checkAndRefreshToken();
            try {
                const response = await fetch(
                    `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=5`,
                    {
                        headers: {
                            'Authorization': `${this.tokenType} ${this.accessToken}`
                        }
                    }
                );
                const data = await response.json();
                const artists = data.artists?.items || [];
                
                if (!artists.length) return null;

                // Normalizar para comparación
                const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const target = normalize(artistName);

                // Intentar encontrar coincidencia exacta
                const exactMatch = artists.find(a => normalize(a.name) === target);
                if (exactMatch) return exactMatch;

                // Si no, devolver el primer resultado (mayor relevancia según Spotify)
                console.warn('Búsqueda de artista: devolviendo primer resultado:', artists[0]?.name);
                return artists[0];
            } catch (error) {
                console.error('Error buscando artista:', error);
                return null;
            }
        });
    }

    // Búsqueda de álbumes
    async searchAlbum(albumName, artistName) {
        const cacheKey = `search_album_${albumName}_${artistName}`;
        return this.cachedFetch(cacheKey, async () => {
            await this.checkAndRefreshToken();
            try {
                artistName = artistName || '';
                const query = `${albumName} ${artistName}`;
                const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10`, {
                    headers: {
                        'Authorization': `${this.tokenType} ${this.accessToken}`
                    }
                });
                const data = await response.json();
                const items = data.albums?.items || [];
                if (!items.length) return null;

                // Función auxiliar simple de normalización en este servicio (solo para comparar nombres)
                const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                const targetAlbum = normalize(albumName);
                const targetArtist = normalize(artistName || '');

                // Intentar encontrar un item que coincida exactamente con el álbum y el artista
                const exactMatch = items.find(it => 
                    normalize(it.name) === targetAlbum && 
                    normalize(it.artists?.[0]?.name) === targetArtist
                );
                if (exactMatch) return exactMatch;

                // Si no, buscar coincidencia parcial del álbum y artista
                const partialMatch = items.find(it => 
                    normalize(it.name).includes(targetAlbum) && 
                    normalize(it.artists?.[0]?.name).includes(targetArtist)
                );
                if (partialMatch) return partialMatch;

                // Si aún no, devolver null en lugar de un resultado incorrecto
                console.warn('No se encontró álbum coincidente en Spotify para:', albumName, 'de', artistName);
                return null;
            } catch (error) {
                console.error('Error buscando álbum:', error);
                return null;
            }
        });
    }

    // Obtener detalles de un álbum
    async getAlbum(albumId) {
        return this.cachedFetch(`album_${albumId}`, async () => {
            await this.checkAndRefreshToken();
            try {
                const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
                    headers: {
                        'Authorization': `${this.tokenType} ${this.accessToken}`
                    }
                });
                return await response.json();
            } catch (error) {
                console.error('Error obteniendo álbum:', error);
                throw error;
            }
        });
    }

    // Obtener detalles de un artista
    async getArtist(artistId) {
        return this.cachedFetch(`artist_${artistId}`, async () => {
            await this.checkAndRefreshToken();
            try {
                const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: {
                        'Authorization': `${this.tokenType} ${this.accessToken}`
                    }
                });
                return await response.json();
            } catch (error) {
                console.error('Error obteniendo artista:', error);
                throw error;
            }
        });
    }

    // Obtener las top tracks de un artista
    async getArtistTopTracks(artistId, country = 'AR') {
        await this.checkAndRefreshToken();
        try {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${country}`, {
                headers: {
                    'Authorization': `${this.tokenType} ${this.accessToken}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo top tracks:', error);
            throw error;
        }
    }

    // Obtener nuevos lanzamientos
    async getNewReleases(country = 'AR') {
        await this.checkAndRefreshToken();
        try {
            const response = await fetch(`https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=10`, {
                headers: {
                    'Authorization': `${this.tokenType} ${this.accessToken}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo nuevos lanzamientos:', error);
            throw error;
        }
    }

    // Obtener albumes por artista
    async getArtistAlbums(artistId, limit = 10, country = 'AR') {
        return this.cachedFetch(`artist_albums_${artistId}_${limit}_${country}`, async () => {
            await this.checkAndRefreshToken();
            try {
                console.log(`🎵 Obteniendo álbumes del artista: ${artistId}`);

                const response = await fetch(
                    `https://api.spotify.com/v1/artists/${artistId}/albums?market=${country}&limit=${limit}&include_groups=album,single`,
                    {
                        headers: {
                            'Authorization': `${this.tokenType} ${this.accessToken}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Spotify API error: ${response.status}`);
                }

                const data = await response.json();
                console.log(`✅ Álbumes obtenidos:`, data.items?.length || 0);

                // Devolver el objeto completo 
                return data;

            } catch (error) {
                console.error('❌ Error obteniendo álbumes del artista:', error);
                // Devolver estructura vacía en lugar de lanzar error
                return { items: [], total: 0 };
            }
        });
    }


    //Albumes recomendados del artista
    async getRecommendedAlbums(artistId, limit = 5, country = 'AR') {
        await this.checkAndRefreshToken();
        try {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?market=${country}&limit=${limit}`, {
                headers: {
                    'Authorization': `${this.tokenType} ${this.accessToken}`
                }
            });
            const data = await response.json();
            return data.items;
        } catch (error) {
            console.error('Error obteniendo álbumes recomendados:', error);
            throw error;
        }
    }

}
export const spotifyService = new SpotifyService();