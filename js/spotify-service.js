// El token se obtiene desde un proxy local (/spotify-token)
class SpotifyService {
    constructor() {
        this.accessToken = null;
        this.tokenType = 'Bearer';
        this.expiresIn = 0;
        this.tokenTimestamp = null;
    }

    async initialize() {
        await this.getAccessToken();
    }

    async getAccessToken() {
        try {
            let resp;
            try {
                resp = await fetch('/spotify-token');
            } catch (err) {
                console.warn('Fetch relativo a /spotify-token falló, intentando fallback:', err);
            }

            // Si la petición relativa no fue exitosa, intentamos el proxy en localhost:3000
            if (!resp || !resp.ok) {
                const fallbackUrl = 'http://localhost:3000/spotify-token';
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

    // Búsqueda de álbumes
async searchAlbum(albumName, artistName) {
    await this.checkAndRefreshToken();
    try {
        const query = `${albumName} ${artistName}`;
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`, {
            headers: {
                'Authorization': `${this.tokenType} ${this.accessToken}`
            }
        });
        const data = await response.json();
        return data.albums?.items[0] || null;
    } catch (error) {
        console.error('Error buscando álbum:', error);
        return null;
    }
}

    // Obtener detalles de un álbum
    async getAlbum(albumId) {
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
    }

    // Obtener detalles de un artista
    async getArtist(artistId) {
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
    async getArtistAlbums(artistId, limit = 5, country = 'AR') {
        await this.checkAndRefreshToken();
        try {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?market=${country}&limit=10`, {
                headers: {
                    'Authorization': `${this.tokenType} ${this.accessToken}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo álbumes del artista:', error);
            throw error;
        }
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