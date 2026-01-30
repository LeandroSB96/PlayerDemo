/**
 * Muestra la página de un artista con su información y álbumes
 * @param {string} artistName - Nombre del artista
 * @param {string} artistImage - URL de la imagen del artista 
 */
export async function showArtistPage(artistName, artistImage = '') {
    console.log('🎤 [ARTIST] Mostrando página de artista:', artistName);
    
    try {
        // 1. LIMPIAR páginas anteriores
        limpiarPaginasAnteriores();
        
        // 2. OCULTAR contenido principal
        ocultarContenidoPrincipal();
        
        // 3. CREAR página con loading
        const artistPage = crearEstructuraPagina(artistName);
        
        // 4. INSERTAR en el DOM
        insertarEnDOM(artistPage);
        
        // 5. CONFIGURAR botón de regresar
        configurarBotonRegresar(artistPage);
        
        // 6. CARGAR datos del artista
        await cargarDatosArtista(artistPage, artistName, artistImage);
        
        console.log('✅ [ARTIST] Página de artista cargada');
        
    } catch (error) {
        console.error('❌ [ARTIST] Error mostrando página:', error);
        mostrarError(artistName);
    }
}

/**
 * Limpia páginas anteriores
 */
function limpiarPaginasAnteriores() {
    const selectores = [
        '.album-page',
        '.favorites-page',
        '.playlists-page',
        '.explore-page',
        '.artists-page',
        '.albums-page',
        '.artist-page'
    ];
    
    selectores.forEach(selector => {
        document.querySelectorAll(selector).forEach(page => page.remove());
    });
}

/**
 * Oculta el contenido principal
 */
function ocultarContenidoPrincipal() {
    const mainContent = document.querySelector('.content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
}

/**
 * Crea la estructura HTML de la página
 */
function crearEstructuraPagina(artistName) {
    const artistPage = document.createElement('div');
    artistPage.className = 'artist-page album-page';
    
    artistPage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(255, 75, 155, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="artist-image-wrapper" style="width: 232px; height: 232px; border-radius: 50%; overflow: hidden; box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5); background: linear-gradient(135deg, rgba(255, 75, 155, 0.2), rgba(155, 75, 255, 0.2)); display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-user" style="font-size: 120px; color: #ff4b9b;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">ARTISTA</span>
                    <h1 class="album-page-title artist-name-title">${escapeHtml(artistName)}</h1>
                    <div class="album-page-meta">
                        <span class="artist-followers">Cargando...</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="album-page-content">
            <!-- Top Tracks -->
            <div class="artist-top-tracks-section" style="margin-bottom: 50px;">
                <h2 class="section-title" style="margin-bottom: 20px;">
                    <i class="fa-solid fa-fire" style="color: #ff4b9b; margin-right: 10px;"></i>
                    Canciones Populares
                </h2>
                <div class="artist-top-tracks-container">
                    <div class="loading" style="text-align: center; padding: 40px; color: #b3b3b3;">
                        <i class="fa-solid fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
                        <p>Cargando canciones populares...</p>
                    </div>
                </div>
            </div>

            <!-- Albums -->
            <div class="artist-albums-section">
                <h2 class="section-title" style="margin-bottom: 20px;">
                    <i class="fa-solid fa-compact-disc" style="color: #9b4bff; margin-right: 10px;"></i>
                    Discografía
                </h2>
                <div class="albums-grid artist-albums-grid">
                    ${crearSkeletonAlbums()}
                </div>
            </div>
        </div>

        ${crearFooter()}
    `;
    
    return artistPage;
}

/**
 * Crea skeleton loading para álbumes
 */
function crearSkeletonAlbums() {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `
            <div class="album-card" style="pointer-events: none;">
                <div style="width: 100%; aspect-ratio: 1; background: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-bottom: 12px; animation: pulse 1.5s ease-in-out infinite;"></div>
                <div style="width: 80%; height: 16px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s ease-in-out infinite;"></div>
                <div style="width: 60%; height: 14px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; animation: pulse 1.5s ease-in-out infinite;"></div>
            </div>
        `;
    }
    return html;
}

/**
 * Crea el footer
 */
function crearFooter() {
    return `
        <footer class="site-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-logo">
                        <div class="logo-icon">
                            <img src="assets/images/logo-img/logo-disc.webp" alt="Logo Player Demo" />
                        </div>
                        <span class="logo-text">Player <span class="highlight">Demo</span></span>
                    </div>
                    <p style="color: #b3b3b3; margin-bottom: 20px;">Tu música favorita, siempre con vos.</p>
                    <div class="social-icons">
                        <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="social-icon"><i class="fa-brands fa-x-twitter"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-section">
                    <h3 class="footer-title">Recursos</h3>
                    <ul class="footer-links">
                        <li><a href="#">Acerca de</a></li>
                        <li><a href="#">Premium</a></li>
                        <li><a href="#">Para Artistas</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h3 class="footer-title">Comunidad</h3>
                    <ul class="footer-links">
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Eventos</a></li>
                        <li><a href="#">Novedades</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h3 class="footer-title">Ayuda</h3>
                    <ul class="footer-links">
                        <li><a href="#">Soporte</a></li>
                        <li><a href="#">Contacto</a></li>
                        <li><a href="#">Privacidad</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Player Demo. Todos los derechos reservados.</p>
            </div>
        </footer>
    `;
}

/**
 * Inserta la página en el DOM
 */
function insertarEnDOM(artistPage) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.appendChild(artistPage);
        mainContent.scrollTop = 0;
    }
}

/**
 * Configura el botón de regresar
 */
function configurarBotonRegresar(artistPage) {
    const backButton = artistPage.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            console.log('🔙 [ARTIST] Volviendo al inicio...');
            artistPage.remove();
            const content = document.querySelector('.content');
            if (content) {
                content.style.display = 'block';
            }
        });
    }
}

/**
 * Carga los datos del artista desde Spotify
 */
async function cargarDatosArtista(artistPage, artistName, artistImage) {
    try {
        const spotifyService = window.spotifyService;
        
        if (!spotifyService) {
            throw new Error('spotifyService no disponible');
        }
        
        console.log('🔍 [ARTIST] Buscando artista en Spotify...');
        
        // Buscar artista
        const artistData = await spotifyService.searchArtistByName(artistName);
        
        if (!artistData) {
            throw new Error('Artista no encontrado');
        }
        
        console.log('✅ [ARTIST] Artista encontrado:', artistData);
        
        // Actualizar información del artista
        actualizarInformacionArtista(artistPage, artistData, artistImage);
        
        // Cargar top tracks
        await cargarTopTracks(artistPage, artistData.id);
        
        // Cargar álbumes
        await cargarAlbumes(artistPage, artistData.id);
        
    } catch (error) {
        console.error('❌ [ARTIST] Error cargando datos:', error);
        mostrarErrorEnPagina(artistPage, error.message);
    }
}

/**
 * Actualiza la información del artista en el header
 */
function actualizarInformacionArtista(artistPage, artistData, artistImage) {
    // Actualizar imagen
    const imageWrapper = artistPage.querySelector('.artist-image-wrapper');
    if (imageWrapper && artistData.images && artistData.images.length > 0) {
        const img = document.createElement('img');
        img.src = artistData.images[0].url;
        img.alt = artistData.name;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        imageWrapper.innerHTML = '';
        imageWrapper.appendChild(img);
    } else if (imageWrapper && artistImage) {
        const img = document.createElement('img');
        img.src = artistImage;
        img.alt = artistData.name;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        imageWrapper.innerHTML = '';
        imageWrapper.appendChild(img);
    }
    
    // Actualizar nombre (por si es diferente)
    const nameTitle = artistPage.querySelector('.artist-name-title');
    if (nameTitle) {
        nameTitle.textContent = artistData.name;
    }
    
    // Actualizar seguidores
    const followersSpan = artistPage.querySelector('.artist-followers');
    if (followersSpan && artistData.followers) {
        const followers = artistData.followers.total.toLocaleString('es-AR');
        followersSpan.innerHTML = `<i class="fa-solid fa-users" style="margin-right: 5px;"></i>${followers} seguidores`;
    }
    
    // Actualizar color del header según géneros
    const header = artistPage.querySelector('.album-page-header');
    if (header && artistData.genres && artistData.genres.length > 0) {
        const genre = artistData.genres[0].toLowerCase();
        let gradient = 'linear-gradient(180deg, rgba(255, 75, 155, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%)';
        
        if (genre.includes('rock')) {
            gradient = 'linear-gradient(180deg, rgba(255, 75, 75, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%)';
        } else if (genre.includes('pop')) {
            gradient = 'linear-gradient(180deg, rgba(255, 75, 155, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%)';
        } else if (genre.includes('hip hop') || genre.includes('rap')) {
            gradient = 'linear-gradient(180deg, rgba(255, 165, 0, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%)';
        } else if (genre.includes('electronic') || genre.includes('edm')) {
            gradient = 'linear-gradient(180deg, rgba(75, 155, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%)';
        }
        
        header.style.background = gradient;
    }
}

/**
 * Carga las canciones más populares del artista
 */
async function cargarTopTracks(artistPage, artistId) {
    const container = artistPage.querySelector('.artist-top-tracks-container');
    
    if (!container) return;
    
    try {
        console.log('🎵 [ARTIST] Cargando top tracks...');
        
        const spotifyService = window.spotifyService;
        const topTracksData = await spotifyService.getArtistTopTracks(artistId);
        
        const tracks = topTracksData.tracks || [];
        
        if (tracks.length === 0) {
            container.innerHTML = '<p style="color: #b3b3b3; text-align: center; padding: 40px;">No se encontraron canciones.</p>';
            return;
        }
        
        // Mostrar solo las primeras 5
        const topTracks = tracks.slice(0, 5);
        
        let html = '<div class="top-tracks-list" style="display: flex; flex-direction: column; gap: 10px;">';
        
        topTracks.forEach((track, index) => {
            const duration = formatDuration(track.duration_ms);
            const albumImage = track.album.images[2]?.url || track.album.images[0]?.url || '';
            
            html += `
                <div class="top-track-item" style="display: flex; align-items: center; padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.03); cursor: pointer; transition: all 0.3s ease;">
                    <span class="track-number" style="width: 30px; font-size: 18px; font-weight: 700; color: #b3b3b3;">${index + 1}</span>
                    <img src="${albumImage}" alt="${escapeHtml(track.name)}" style="width: 48px; height: 48px; border-radius: 4px; margin: 0 15px; object-fit: cover;">
                    <div style="flex: 1; min-width: 0;">
                        <div class="top-track-name" style="font-size: 15px; font-weight: 500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(track.name)}</div>
                        <div class="top-track-album" style="font-size: 13px; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(track.album.name)}</div>
                    </div>
                    <span class="top-track-duration" style="color: #b3b3b3; font-size: 14px; margin-left: 15px;">${duration}</span>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // Agregar hover effect
        const trackItems = container.querySelectorAll('.top-track-item');
        trackItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255, 255, 255, 0.08)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'rgba(255, 255, 255, 0.03)';
            });
        });
        
        console.log(`✅ [ARTIST] ${topTracks.length} top tracks cargados`);
        
    } catch (error) {
        console.error('❌ [ARTIST] Error cargando top tracks:', error);
        container.innerHTML = '<p style="color: #ff4b4b; text-align: center; padding: 40px;">Error al cargar canciones populares.</p>';
    }
}

/**
 * Carga los álbumes del artista
 */
async function cargarAlbumes(artistPage, artistId) {
    const grid = artistPage.querySelector('.artist-albums-grid');
    
    if (!grid) return;
    
    try {
        console.log('💿 [ARTIST] Cargando álbumes...');
        
        const spotifyService = window.spotifyService;
        const albumsData = await spotifyService.getArtistAlbums(artistId, 12);
        
        const albums = albumsData.items || [];
        
        if (albums.length === 0) {
            grid.innerHTML = '<p style="color: #b3b3b3; text-align: center; padding: 40px; grid-column: 1/-1;">No se encontraron álbumes.</p>';
            return;
        }
        
        let html = '';
        for (const album of albums) {
            html += crearAlbumCard(album);
        }
        
        grid.innerHTML = html;
        
        // Configurar clicks
        configurarClicksAlbumes(grid);
        
        console.log(`✅ [ARTIST] ${albums.length} álbumes cargados`);
        
    } catch (error) {
        console.error('❌ [ARTIST] Error cargando álbumes:', error);
        grid.innerHTML = '<p style="color: #ff4b4b; text-align: center; padding: 40px; grid-column: 1/-1;">Error al cargar álbumes.</p>';
    }
}

/**
 * Crea HTML de una card de álbum
 */
function crearAlbumCard(album) {
    const imageUrl = album.images[0]?.url || 'assets/images/default-album.webp';
    const artistNames = album.artists.map(a => a.name).join(', ');
    const year = album.release_date?.split('-')[0] || 'N/A';
    
    return `
        <article class="album-card" tabindex="0"
            data-album-name="${escapeHtml(album.name)}"
            data-artist-name="${escapeHtml(artistNames)}"
            data-cover="${imageUrl}">
            <div class="album-cover">
                <img src="${imageUrl}" 
                     alt="${escapeHtml(album.name)}"
                     style="width:100%;height:100%;object-fit:cover;">
                <button class="album-play-btn" aria-label="Reproducir álbum"></button>
            </div>
            <div class="album-info">
                <h3 class="album-title">${escapeHtml(album.name)}</h3>
                <p class="album-artist">${escapeHtml(artistNames)}</p>
                <p class="album-year">${year}</p>
            </div>
        </article>
    `;
}

/**
 * Configura clicks en las cards de álbumes
 */
function configurarClicksAlbumes(grid) {
    const cards = grid.querySelectorAll('.album-card[data-album-name]');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const albumName = card.dataset.albumName;
            const artistName = card.dataset.artistName;
            const cover = card.dataset.cover;
            
            console.log('🎵 [ARTIST] Click en álbum:', albumName);
            
            if (typeof window.showAlbumPage === 'function') {
                window.showAlbumPage(albumName, artistName, cover);
            } else {
                console.error('❌ [ARTIST] showAlbumPage no disponible');
            }
        });
    });
}

/**
 * Formatea duración de milisegundos a mm:ss
 */
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Muestra error en la página
 */
function mostrarErrorEnPagina(artistPage, mensaje) {
    const content = artistPage.querySelector('.album-page-content');
    if (content) {
        content.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 64px; color: #ff4b4b; margin-bottom: 20px;"></i>
                <h2 style="margin-bottom: 10px;">Error al cargar artista</h2>
                <p style="color: #b3b3b3; margin-bottom: 30px;">${escapeHtml(mensaje)}</p>
                <button onclick="location.reload()" style="padding: 12px 24px; background: rgba(155, 75, 255, 0.3); border: none; border-radius: 20px; color: white; cursor: pointer; font-size: 16px;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

/**
 * Muestra error general
 */
function mostrarError(artistName) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    const errorPage = document.createElement('div');
    errorPage.className = 'artist-page album-page';
    errorPage.innerHTML = `
        <div class="album-page-content" style="text-align: center; padding: 100px 20px;">
            <i class="fa-solid fa-exclamation-triangle" style="font-size: 80px; color: #ff4b4b; margin-bottom: 20px;"></i>
            <h2 style="margin-bottom: 10px;">Error al cargar artista</h2>
            <p style="color: #b3b3b3; margin-bottom: 10px;">No se pudo cargar la información de ${escapeHtml(artistName)}</p>
            <button onclick="location.reload()" style="padding: 12px 24px; background: rgba(155, 75, 255, 0.3); border: none; border-radius: 20px; color: white; cursor: pointer; font-size: 16px; margin-top: 20px;">
                Reintentar
            </button>
        </div>
    `;
    
    mainContent.appendChild(errorPage);
}

// Agregar animación CSS si no existe
if (!document.querySelector('#artist-page-animation')) {
    const style = document.createElement('style');
    style.id = 'artist-page-animation';
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .top-track-item:hover .track-number {
            color: #ff4b9b !important;
        }
    `;
    document.head.appendChild(style);
}