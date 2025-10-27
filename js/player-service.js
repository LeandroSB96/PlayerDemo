// Servicio para manejar la reproducción de audio local
export class PlayerService {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.currentAlbum = null;
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.shuffle = false;

        // Eventos del reproductor
        this.onTrackChange = null;
        this.onPlayStateChange = null;
        this.onProgressChange = null;

        // Configurar eventos de Audio
        this.audio.addEventListener('timeupdate', () => {
            if (this.onProgressChange) {
                const progress = (this.audio.currentTime / this.audio.duration) * 100;
                this.onProgressChange(progress);
            }
        });

        this.audio.addEventListener('ended', () => {
            this.playNext();
        });
    }

    // Cargar y reproducir un álbum
    loadAlbum(album, startTrackIndex = 0) {
        this.currentAlbum = album;
        this.currentTrackIndex = startTrackIndex;
        this.loadTrack(album.tracks[startTrackIndex]);
    }

    // Cargar una pista específica
    loadTrack(track) {
        this.currentTrack = track;
        this.audio.src = track.audioFile;
        
        if (this.onTrackChange) {
            this.onTrackChange(track);
        }

        // Auto-play si ya estaba reproduciendo
        if (this.isPlaying) {
            this.play();
        }
    }

    // Reproducir/Pausar
    togglePlay() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    play() {
        this.audio.play();
        this.isPlaying = true;
        if (this.onPlayStateChange) {
            this.onPlayStateChange(true);
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        if (this.onPlayStateChange) {
            this.onPlayStateChange(false);
        }
    }

    // Controles de navegación
    playNext() {
        if (!this.currentAlbum) return;

        let nextIndex;
        if (this.shuffle) {
            // Reproducción aleatoria (evitando repetir la pista actual)
            do {
                nextIndex = Math.floor(Math.random() * this.currentAlbum.tracks.length);
            } while (nextIndex === this.currentTrackIndex && this.currentAlbum.tracks.length > 1);
        } else {
            // Reproducción secuencial
            nextIndex = (this.currentTrackIndex + 1) % this.currentAlbum.tracks.length;
        }

        this.currentTrackIndex = nextIndex;
        this.loadTrack(this.currentAlbum.tracks[nextIndex]);
        this.play();
    }

    playPrevious() {
        if (!this.currentAlbum) return;

        // Si la pista actual lleva más de 3 segundos, volver al inicio
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIndex;
        if (this.shuffle) {
            // Reproducción aleatoria
            do {
                prevIndex = Math.floor(Math.random() * this.currentAlbum.tracks.length);
            } while (prevIndex === this.currentTrackIndex && this.currentAlbum.tracks.length > 1);
        } else {
            // Reproducción secuencial
            prevIndex = this.currentTrackIndex - 1;
            if (prevIndex < 0) prevIndex = this.currentAlbum.tracks.length - 1;
        }

        this.currentTrackIndex = prevIndex;
        this.loadTrack(this.currentAlbum.tracks[prevIndex]);
        this.play();
    }

    // Control de volumen
    setVolume(value) {
        this.audio.volume = Math.max(0, Math.min(1, value));
    }

    // Control de progreso
    seek(progressPercent) {
        if (this.audio.duration) {
            this.audio.currentTime = (progressPercent / 100) * this.audio.duration;
        }
    }

    // Control de reproducción aleatoria
    toggleShuffle() {
        this.shuffle = !this.shuffle;
        return this.shuffle;
    }

    // Obtener información actual
    getCurrentTime() {
        return this.audio.currentTime;
    }

    getDuration() {
        return this.audio.duration;
    }

    getProgress() {
        return (this.audio.currentTime / this.audio.duration) * 100 || 0;
    }
}

// Exportar una instancia única del servicio
export const playerService = new PlayerService();