// Código para el sidebar lateral
document.addEventListener('DOMContentLoaded', function() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');

});

// Código para las cards
document.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.album-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });
});

// Datos de las canciones de cada álbum
const albumSongs = {
    'nada-personal': [
        { title: 'Nada Personal', duration: '4:52' },
        { title: 'Si No Fuera Por...', duration: '3:27' },
        { title: 'Cuando Pase El Temblor', duration: '3:49' },
        { title: 'Danza Rota', duration: '3:31' },
        { title: 'El Cueerpo Del Delito', duration: '3:46' },
        { title: 'Juegos De Seducción', duration: '3:18' },
        { title: 'Estoy Azulado', duration: '5:17' },
        { title: 'Observándonos (Satélites)', duration: '2:56' },
        { title: 'Imágenes Retro', duration: '3:49' },
        { title: 'Ecos', duration: '4:57' }
    ],
    'killers': [
        { title: 'The Ides of March - Instrumental', duration: '1:45' },
        { title: 'Wrathchild', duration: '2:56' },
        { title: 'Murders In the Rue Morgue', duration: '4:19' },
        { title: 'Another Life', duration: '3:23' },
        { title: 'Genghis Khan - Instrumental', duration: '3:09' },
        { title: 'Innocent Exile', duration: '3:54' },
        { title: 'Killers', duration: '5:01' },
        { title: 'Prodigal Son', duration: '6:12' },
        { title: 'Purgatory', duration: '3:20' },
        { title: 'Twilight Zone', duration: '2:33' },
        { title: 'Drifters', duration: '4:49' }
    ],
    'starboy': [
        { title: 'Starboy', duration: '3:50' },
        { title: 'I Feel It Coming', duration: '4:29' },
        { title: 'Party Monster', duration: '4:09' }
    ],
    'the-best-of': [
        { title: 'Song 2', duration: '2:01' },
        { title: 'Girls & Boys', duration: '4:50' },
        { title: 'Parklife', duration: '3:05' }
    ]
};

document.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', (e) => {
        // Evita que el clic en el botón de play dispare el evento
        if (e.target.closest('.play-button')) return;

        // Obtener datos del álbum
        const albumId = card.getAttribute('data-album');
        const cover = card.querySelector('.album-cover img').src;
        const name = card.querySelector('.album-name').textContent;
        const band = card.querySelector('.band').textContent;
        const year = card.querySelector('.year').textContent;

        // Actualizar la sección de detalle
        const detailSection = document.getElementById('album-detail');
        document.getElementById('detail-cover').src = cover;
        document.getElementById('detail-name').textContent = name;
        document.getElementById('detail-band').textContent = band;
        document.getElementById('detail-year').textContent = year;

        // Llenar la tabla de canciones
        const songTableBody = document.getElementById('song-table-body');
        songTableBody.innerHTML = ''; // Limpiar contenido anterior
        albumSongs[albumId].forEach((song, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="material-symbols-outlined play-song">play_circle</span></td>
                <td>${song.title}</td>
                <td>${song.duration}</td>
                <td class="song-actions">
                    <span class="material-symbols-outlined favorite-icon">favorite</span>
                    <span class="material-symbols-outlined add-playlist-icon">queue_music</span>
                </td>
            `;
            songTableBody.appendChild(row);
        });

        // Mostrar la sección de detalle
        detailSection.classList.add('active');

        // Resaltar el álbum seleccionado
        document.querySelectorAll('.album-card').forEach(otherCard => {
            otherCard.classList.remove('selected');
        });
        card.classList.add('selected');
    });
});

// Cerrar la sección de detalle
document.getElementById('close-detail').addEventListener('click', () => {
    const detailSection = document.getElementById('album-detail');
    detailSection.classList.remove('active');
    document.querySelectorAll('.album-card').forEach(card => {
        card.classList.remove('selected');
    });
});