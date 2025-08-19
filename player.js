// Obtener el elemento de audio
const audio = document.getElementById('audio-player');

// Inicializar WaveSurfer.js
const wavesurfer = WaveSurfer.create({
    container: '#waveform', 
    waveColor: 'linear-gradient(to bottom, #a48bff, #6b48ff)', 
    progressColor: 'rgba(255, 255, 255, 0.3)', 
    height: 30, 
    barWidth: 2, 
    barGap: 1, 
    backend: 'MediaElement', 
    media: audio, 
    responsive: true, 
    hideScrollbar: true
});

// Cargar el audio (asegúrate de que el <source> tenga un archivo válido)
wavesurfer.load(audio);

// Cuando el audio está listo, ajustamos la visualización
wavesurfer.on('ready', () => {
    // Asegurarse de que la visualización esté sincronizada con el audio
    wavesurfer.setVolume(audio.volume);
    wavesurfer.setMute(audio.muted);
});

// Sincronizar el estado de reproducción/pausa
audio.addEventListener('play', () => {
    wavesurfer.play();
});

audio.addEventListener('pause', () => {
    wavesurfer.pause();
});

audio.addEventListener('ended', () => {
    wavesurfer.stop();
});

// Sincronizar el tiempo del audio con WaveSurfer
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    if (duration > 0) {
        wavesurfer.seekTo(currentTime / duration);
    }
});

// Sincronizar el volumen
audio.addEventListener('volumechange', () => {
    wavesurfer.setVolume(audio.volume);
    wavesurfer.setMute(audio.muted);
});