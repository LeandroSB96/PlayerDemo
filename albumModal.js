const albumSongs = {
    'nada-personal': [
        { title: 'Danza Rota', duration: '3:34' },
        { title: 'Nada Personal', duration: '4:52' },
        { title: 'Cuando Pase el Temblor', duration: '3:30' },
        { title: 'Dulce 16', duration: '4:03' },
        { title: 'Observándonos', duration: '4:09' },
        { title: 'Ecos', duration: '4:37' },
        { title: 'Zona de Promesas', duration: '3:56' },
        { title: 'No Existes', duration: '4:52' },
        { title: 'Sobredosis de TV', duration: '4:07' },
        { title: 'Estoy Azulado', duration: '5:16' }
    ],
    'killers': [
        { title: 'The Ides of March', duration: '1:46' },
        { title: 'Wrathchild', duration: '2:56' },
        { title: 'Murders in the Rue Morgue', duration: '4:21' },
        { title: 'Another Life', duration: '3:23' },
        { title: 'Genghis Khan', duration: '3:06' },
        { title: 'Innocent Exile', duration: '3:53' },
        { title: 'Killers', duration: '5:01' },
        { title: 'Prodigal Son', duration: '6:12' },
        { title: 'Purgatory', duration: '3:20' },
        { title: 'Drifter', duration: '4:48' }
    ],
    'starboy': [
        { title: 'Starboy', duration: '3:50' },
        { title: 'Party Monster', duration: '4:09' },
        { title: 'False Alarm', duration: '3:40' },
        { title: 'Reminder', duration: '3:38' },
        { title: 'Rockin\'', duration: '3:52' },
        { title: 'Secrets', duration: '4:25' },
        { title: 'True Colors', duration: '3:26' },
        { title: 'Stargirl Interlude', duration: '1:51' },
        { title: 'Sidewalks', duration: '3:43' },
        { title: 'Six Feet Under', duration: '3:57' }
    ],
    'blur': [
        { title: 'Beetlebum', duration: '5:04' },
        { title: 'Song 2', duration: '2:02' },
        { title: 'Country House', duration: '3:57' },
        { title: 'Tender', duration: '7:40' },
        { title: 'Coffee & TV', duration: '5:58' },
        { title: 'Parklife', duration: '3:05' },
        { title: 'Girls & Boys', duration: '4:50' },
        { title: 'Charmless Man', duration: '3:34' },
        { title: 'The Universal', duration: '4:00' },
        { title: 'End of a Century', duration: '2:47' }
    ]
};

// Función para abrir el modal
function openAlbumModal(albumId, albumTitle, albumArtist, albumYear, albumCover) {
    const modal = document.getElementById('albumModal');
    const modalAlbumCover = document.getElementById('modalAlbumCover');
    const modalAlbumTitle = document.getElementById('modalAlbumTitle');
    const modalAlbumArtist = document.getElementById('modalAlbumArtist');
    const modalAlbumYear = document.getElementById('modalAlbumYear');
    const modalSongsList = document.getElementById('modalSongsList');
    
    // Actualizar información del álbum
    modalAlbumCover.src = albumCover;
    modalAlbumTitle.textContent = albumTitle;
    modalAlbumArtist.textContent = albumArtist;
    modalAlbumYear.textContent = albumYear;
    
    // Cargar canciones
    const songs = albumSongs[albumId] || [];
    modalSongsList.innerHTML = '';
    
    songs.forEach((song, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${song.title}</td>
            <td>${song.duration}</td>
            <td class="song-actions-cell">
                <button class="song-play-btn" onclick="playSong('${song.title}')">
                    <span class="material-symbols-outlined">play_circle</span>
                </button>
                <button class="song-like-btn" onclick="toggleLikeSong(this, '${song.title}')">
                    <span class="material-symbols-outlined">favorite</span>
                </button>
            </td>
        `;
        modalSongsList.appendChild(row);
    });
    
    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

// Función para cerrar el modal
function closeAlbumModal() {
    const modal = document.getElementById('albumModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; 
}

// Función para reproducir canción (placeholder)
function playSong(songTitle) {
    console.log(`Reproduciendo: ${songTitle}`);
}

// Función para manejar el botón de me gusta del álbum
function toggleLikeAlbum() {
    const likeBtn = document.getElementById('likeAlbumBtn');
    const isLiked = likeBtn.classList.contains('liked');
    
    if (isLiked) {
        // Quitar me gusta
        likeBtn.classList.remove('liked');
        console.log('Álbum removido de favoritos');
    } else {
        // Agregar me gusta
        likeBtn.classList.add('liked');
        console.log('Álbum agregado a favoritos');
    }
}

// Función para manejar el botón de me gusta de cada canción
function toggleLikeSong(button, songTitle) {
    const isLiked = button.classList.contains('liked');
    
    if (isLiked) {
        // Quitar me gusta
        button.classList.remove('liked');
        console.log(`Canción "${songTitle}" removida de favoritos`);
    } else {
        // Agregar me gusta
        button.classList.add('liked');
        console.log(`Canción "${songTitle}" agregada a favoritos`);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cerrar modal con el botón X
    document.querySelector('.close-modal').addEventListener('click', closeAlbumModal);
    
    // Cerrar modal haciendo clic fuera
    document.getElementById('albumModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAlbumModal();
        }
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAlbumModal();
        }
    });
    
    // Event listener para el botón de me gusta
    document.getElementById('likeAlbumBtn').addEventListener('click', toggleLikeAlbum);
    
    // Agregar event listeners a los botones de play de los álbumes
    const playButtons = document.querySelectorAll('.album-play-btn');
    playButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const albumCard = this.closest('.album-card');
            const albumCover = albumCard.querySelector('.albumes-cover').src;
            const albumTitle = albumCard.querySelector('.album-name').textContent;
            const albumArtist = albumCard.querySelector('.album-artist').textContent;
            const albumYear = albumCard.querySelector('.album-year').textContent;
            
            // Determinar el ID del álbum basado en el título
            let albumId = 'nada-personal'; // default
            if (albumTitle.toLowerCase().includes('killers')) albumId = 'killers';
            else if (albumTitle.toLowerCase().includes('starboy')) albumId = 'starboy';
            else if (albumTitle.toLowerCase().includes('blur') || albumTitle.toLowerCase().includes('best')) albumId = 'blur';
            
            openAlbumModal(albumId, albumTitle, albumArtist, albumYear, albumCover);
        });
    });
});
