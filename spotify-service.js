import config from './config.js';

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
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(config.clientId + ':' + config.clientSecret)
                },
                body: 'grant_type=client_credentials'
            });

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenType = data.token_type;
            this.expiresIn = data.expires_in;
            this.tokenTimestamp = Date.now();

            return this.accessToken;
        } catch (error) {
            console.error('Error obteniendo el token de acceso:', error);
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