document.querySelectorAll('.trend-song-row').forEach(song => {
    song.addEventListener('click', () => {
        const songIndex = parseInt(song.getAttribute('data-song-index'));
        window.player.setCurrentPlaylist(window.player.playlist.slice(0, 5));
        window.player.loadAndPlaySong(songIndex);
    });
});

// Event listeners para los botones de like en tendencias
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.trend-like-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que se active el click de la fila
            const isLiked = this.classList.contains('liked');
            
            if (isLiked) {
                this.classList.remove('liked');
                console.log('Canción removida de favoritos');
            } else {
                this.classList.add('liked');
                console.log('Canción agregada a favoritos');
            }
        });
    });

    // Event listeners para los botones de agregar a playlist
    document.querySelectorAll('.trend-add-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que se active el click de la fila
            console.log('Canción agregada a playlist');
        });
    });
});