// Función para formatear tiempo en formato mm:ss
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Estado global del reproductor
export const playerState = {
    currentAudio: null,
    currentTrackIndex: -1,
    tracks: [],
    isShuffleOn: false,
    repeatMode: 'no-repeat', 
    shuffledIndexes: []
};

// Función para obtener el siguiente índice según el modo de reproducción
function getNextTrackIndex() {
    if (playerState.repeatMode === 'repeat-one') {
        return playerState.currentTrackIndex;
    }

    if (playerState.isShuffleOn) {
        const currentShuffleIndex = playerState.shuffledIndexes.indexOf(playerState.currentTrackIndex);
        if (currentShuffleIndex === playerState.shuffledIndexes.length - 1) {
            return playerState.repeatMode === 'repeat-all' ? playerState.shuffledIndexes[0] : -1;
        }
        return playerState.shuffledIndexes[currentShuffleIndex + 1];
    }

    const nextIndex = playerState.currentTrackIndex + 1;
    if (nextIndex >= playerState.tracks.length) {
        return playerState.repeatMode === 'repeat-all' ? 0 : -1;
    }
    return nextIndex;
}

// Función para obtener el índice anterior
function getPreviousTrackIndex() {
    if (playerState.repeatMode === 'repeat-one') {
        return playerState.currentTrackIndex;
    }

    if (playerState.isShuffleOn) {
        const currentShuffleIndex = playerState.shuffledIndexes.indexOf(playerState.currentTrackIndex);
        if (currentShuffleIndex === 0) {
            return playerState.repeatMode === 'repeat-all' ? playerState.shuffledIndexes[playerState.shuffledIndexes.length - 1] : -1;
        }
        return playerState.shuffledIndexes[currentShuffleIndex - 1];
    }

    const prevIndex = playerState.currentTrackIndex - 1;
    if (prevIndex < 0) {
        return playerState.repeatMode === 'repeat-all' ? playerState.tracks.length - 1 : -1;
    }
    return prevIndex;
}

// Función para barajar el array de índices
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Función para actualizar el estado de reproducción aleatoria
export function toggleShuffle() {
    playerState.isShuffleOn = !playerState.isShuffleOn;
    if (playerState.isShuffleOn) {
        // Generar nueva secuencia aleatoria
        playerState.shuffledIndexes = shuffleArray([...Array(playerState.tracks.length).keys()]);
    
        if (playerState.currentTrackIndex !== -1) {
            const currentIndex = playerState.shuffledIndexes.indexOf(playerState.currentTrackIndex);
            if (currentIndex !== -1) {
                [playerState.shuffledIndexes[0], playerState.shuffledIndexes[currentIndex]] = 
                [playerState.shuffledIndexes[currentIndex], playerState.shuffledIndexes[0]];
            }
        }
    }

    // Actualizar UI
    const shuffleBtn = document.querySelector('.shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.classList.toggle('active', playerState.isShuffleOn);
    }
}

// Función para cambiar el modo de repetición
export function toggleRepeat() {
    const modes = ['no-repeat', 'repeat-all', 'repeat-one'];
    const currentIndex = modes.indexOf(playerState.repeatMode);
    playerState.repeatMode = modes[(currentIndex + 1) % modes.length];
    
    // Actualizar UI
    const repeatBtn = document.querySelector('.repeat-btn');
    if (repeatBtn) {
        repeatBtn.classList.remove('no-repeat', 'repeat-all', 'repeat-one');
        repeatBtn.classList.add(playerState.repeatMode);
        
        // Actualizar el ícono según el modo
        const icon = repeatBtn.querySelector('i');
        if (icon) {
            icon.className = playerState.repeatMode === 'repeat-one' ? 
                'fas fa-repeat-1' : 'fas fa-repeat';
        }
    }
}

// Reproducir siguiente canción
export function playNextTrack() {
    const nextIndex = getNextTrackIndex();
    if (nextIndex !== -1 && playerState.tracks[nextIndex]) {
        playTrack(nextIndex);
    }
}

// Reproducir canción anterior
export function playPreviousTrack() {
    const prevIndex = getPreviousTrackIndex();
    if (prevIndex !== -1 && playerState.tracks[prevIndex]) {
        playTrack(prevIndex);
    }
}

// Función principal para reproducir una pista
export function playTrack(index) {
    if (index < 0 || index >= playerState.tracks.length) {
        console.error('Índice de pista inválido:', index);
        return;
    }
    
    const track = playerState.tracks[index];
    const audioFile = track.audioFile || track.dataset?.localAudio;
    if (!audioFile) {
        console.error('No se encontró el archivo de audio para la pista:', track);
        return;
    }
    
    console.log('Intentando reproducir pista:', {
        title: track.title || track.dataset?.title,
        artist: track.artist,
        audioFile: audioFile
    });

    // Detener reproducción actual
    if (playerState.currentAudio) {
        playerState.currentAudio.pause();
        playerState.currentAudio.removeEventListener('ended', playNextTrack);
        playerState.currentAudio.removeEventListener('timeupdate', updateProgress);
        playerState.currentAudio = null;
    }

    // Crear y configurar nuevo audio
    const audio = new Audio(audioFile);
    playerState.currentAudio = audio;
    playerState.currentTrackIndex = index;

    // Configurar volumen inicial
    audio.volume = 0.6;
    const volumeFill = document.querySelector('.volume-fill');
    if (volumeFill) {
        volumeFill.style.width = '60%';
    }

    // Configurar control de volumen
    const volumeBar = document.querySelector('.volume-bar');
    if (volumeBar) {
        const updateVolume = (e) => {
            const rect = volumeBar.getBoundingClientRect();
            const volumePercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audio.volume = volumePercent;
            if (volumeFill) {
                volumeFill.style.width = `${volumePercent * 100}%`;
            }
        };

        volumeBar.addEventListener('mousedown', (e) => {
            updateVolume(e);
            
            const onMouseMove = (moveEvent) => {
                updateVolume(moveEvent);
            };
            
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        volumeBar.addEventListener('click', updateVolume);
    }

    // Eventos del audio
    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        // Actualizar tiempos
        const currentTime = document.getElementById('currentTime');
        const totalTime = document.getElementById('totalTime');
        if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
        if (totalTime) totalTime.textContent = formatTime(audio.duration);
    });

    // Actualizar UI
    updatePlayingUI(index);

    // Inicializar controles
    initializeProgressBar();

    // Reproducir
    audio.play().catch(error => {
        console.error('Error al reproducir el audio:', error);
        console.log('Intentando reproducir desde:', audioFile);
        alert('Error al reproducir la canción. Por favor, verifica que el archivo de audio existe.');
    });
}

// Actualizar la interfaz para la pista en reproducción
function updatePlayingUI(index) {
    // Actualizar filas de canciones
    const trackRows = document.querySelectorAll('.track-row');
    trackRows.forEach((row, idx) => {
        row.classList.toggle('playing', idx === index);
    });

    // Actualizar botón de reproducción
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }

    // Actualizar contenedor del reproductor
    const albumContainer = document.getElementById('playerAlbumContainer');
    const progressBar = document.querySelector('.progress-bar');
    if (albumContainer) {
        albumContainer.classList.add('active');
        if (progressBar) progressBar.classList.add('active');
    }

    // Actualizar información de la canción
    const track = playerState.tracks[index];
    if (track) {
        const playerTrackName = document.getElementById('playerTrackName');
        const playerArtistName = document.getElementById('playerArtistName');
        const playerAlbumCover = document.getElementById('playerAlbumCover');

        if (playerTrackName) playerTrackName.textContent = track.title || track.dataset?.title;
        if (playerArtistName) playerArtistName.textContent = track.artist || document.querySelector('.album-page-meta .artist-name-bold')?.textContent;
        if (playerAlbumCover) {
            const coverSrc = document.querySelector('.album-page-cover')?.src;
            if (coverSrc) playerAlbumCover.src = coverSrc;
        }
    }
}

// Función para alternar reproducción/pausa
export function togglePlay() {
    if (!playerState.currentAudio) return;

    const playBtn = document.querySelector('.play-btn i');
    
    if (playerState.currentAudio.paused) {
        playerState.currentAudio.play()
            .then(() => {
                if (playBtn) {
                    playBtn.className = 'fa-solid fa-pause';
                }
            })
            .catch(error => {
                console.error('Error al reproducir:', error);
            });
    } else {
        playerState.currentAudio.pause();
        if (playBtn) {
            playBtn.className = 'fa-solid fa-play';
        }
    }
}

// Configurar los controles del reproductor
export function setupPlayerControls() {
    console.log('Configurando controles del reproductor');
    // Remover listeners existentes
    const controls = {
        '.play-btn': togglePlay,
        '.prev-btn': playPreviousTrack,
        '.next-btn': playNextTrack,
        '.shuffle-btn': toggleShuffle,
        '.repeat-btn': toggleRepeat
    };

    Object.entries(controls).forEach(([selector, handler]) => {
        const element = document.querySelector(selector);
        if (element) {
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
            clone.addEventListener('click', handler);
        }
    });
}

    // Inicializar controles de progreso
    function initializeProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.querySelector('.progress-fill');
        const currentTime = document.getElementById('currentTime');
        const totalTime = document.getElementById('totalTime');

        if (progressBar && progressFill) {
            const updateProgressBar = (e) => {
                if (!playerState.currentAudio) return;
                const rect = progressBar.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const duration = playerState.currentAudio.duration;
                if (!isNaN(duration)) {
                    playerState.currentAudio.currentTime = percent * duration;
                }
            };

            // Manejar clicks y arrastre en la barra de progreso
            progressBar.addEventListener('mousedown', (e) => {
                updateProgressBar(e);
                
                const onMouseMove = (moveEvent) => {
                    moveEvent.preventDefault();
                    updateProgressBar(moveEvent);
                };
                
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            progressBar.addEventListener('click', updateProgressBar);
        }

        // Actualizar progreso durante la reproducción
        if (playerState.currentAudio) {
            playerState.currentAudio.addEventListener('timeupdate', () => {
                if (!playerState.currentAudio) return;
                
                const current = playerState.currentAudio.currentTime;
                const duration = playerState.currentAudio.duration;
                
                if (!isNaN(duration) && progressFill) {
                    const progress = (current / duration) * 100;
                    progressFill.style.width = `${progress}%`;
                }

                if (currentTime) {
                    currentTime.textContent = formatTime(current);
                }
                if (totalTime) {
                    totalTime.textContent = formatTime(duration);
                }
            });
        }
}// Actualización de progreso
function updateProgress() {
    if (!playerState.currentAudio) return;
    
    const progress = (playerState.currentAudio.currentTime / playerState.currentAudio.duration) * 100;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }

    // Actualizar tiempos
    const currentTime = document.getElementById('currentTime');
    const totalTime = document.getElementById('totalTime');
    if (currentTime) currentTime.textContent = formatTime(playerState.currentAudio.currentTime);
    if (totalTime) totalTime.textContent = formatTime(playerState.currentAudio.duration);
}