// ============================================================================
// ALBUMS-PAGE.JS - REESCRITO DESDE CERO
// ============================================================================

/**
 * Muestra la página de álbumes con categorías
 */
export async function showAlbumsPage() {
    console.log('💿 [ALBUMS] Iniciando página de Álbumes...');
    
    try {
        // 1. LIMPIAR páginas anteriores
        limpiarPaginasAnteriores();
        
        // 2. OCULTAR contenido principal
        ocultarContenidoPrincipal();
        
        // 3. CREAR estructura de la página
        const albumsPage = crearEstructuraPagina();
        
        // 4. INSERTAR en el DOM
        insertarEnDOM(albumsPage);
        
        // 5. CONFIGURAR botón de regresar
        configurarBotonRegresar(albumsPage);
        
        // 6. CARGAR álbumes
        await cargarAlbumes(albumsPage);
        
        console.log('✅ [ALBUMS] Página de álbumes mostrada correctamente');
        
    } catch (error) {
        console.error('❌ [ALBUMS] Error mostrando página:', error);
        mostrarError();
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
        '.albums-page'
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
function crearEstructuraPagina() {
    const albumsPage = document.createElement('div');
    albumsPage.className = 'albums-page album-page';
    
    albumsPage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(155, 75, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div style="width: 232px; height: 232px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(155, 75, 255, 0.2), rgba(75, 155, 255, 0.2)); border-radius: 8px; box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);">
                    <i class="fa-solid fa-compact-disc" style="font-size: 120px; color: #9b4bff;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">BIBLIOTECA</span>
                    <h1 class="album-page-title">Álbumes</h1>
                    <div class="album-page-meta">
                        <span>Explora música por categorías</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="album-page-content">
            <div id="albumsCategoriesContainer"></div>
        </div>

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
    
    return albumsPage;
}

/**
 * Inserta la página en el DOM
 */
function insertarEnDOM(albumsPage) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.appendChild(albumsPage);
        mainContent.scrollTop = 0;
    } else {
        console.error('❌ [ALBUMS] No se encontró .main-content');
    }
}

/**
 * Configura el botón de regresar
 */
function configurarBotonRegresar(albumsPage) {
    const backButton = albumsPage.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            console.log('🔙 [ALBUMS] Volviendo al inicio...');
            albumsPage.remove();
            const content = document.querySelector('.content');
            if (content) {
                content.style.display = 'block';
            }
        });
    }
}

/**
 * Carga los álbumes por categoría
 */
async function cargarAlbumes(albumsPage) {
    const container = albumsPage.querySelector('#albumsCategoriesContainer');
    
    if (!container) {
        console.error('❌ [ALBUMS] No se encontró el contenedor');
        return;
    }
    
    // Mostrar loading inicial
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 0; color: #b3b3b3;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
            <p>Cargando álbumes...</p>
        </div>
    `;
    
    // Definir categorías
    const categorias = obtenerCategorias();
    
    // Crear estructura de categorías
    let html = '';
    for (const cat of categorias) {
        html += crearHTMLCategoria(cat);
    }
    container.innerHTML = html;
    
    // Cargar álbumes para cada categoría
    for (const cat of categorias) {
        await cargarAlbumsCategoria(cat, albumsPage);
    }
}

/**
 * Obtiene las categorías de álbumes
 */
function obtenerCategorias() {
    return [
        { id: 'pop', nombre: 'Pop', icono: '🎤', query: 'pop' },
        { id: 'rock', nombre: 'Rock', icono: '🎸', query: 'rock' },
        { id: 'hiphop', nombre: 'Hip Hop', icono: '🎧', query: 'hip hop' },
        { id: 'electronic', nombre: 'Electrónica', icono: '⚡', query: 'electronic' },
        { id: 'jazz', nombre: 'Jazz', icono: '🎷', query: 'jazz' },
        { id: 'latin', nombre: 'Latina', icono: '🌶️', query: 'latin' }
    ];
}

/**
 * Crea el HTML de una categoría
 */
function crearHTMLCategoria(categoria) {
    return `
        <section class="album-category-section" style="margin-bottom: 50px;">
            <div class="section-header" style="margin-bottom: 20px;">
                <h2 class="section-title" style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 32px;">${categoria.icono}</span>
                    ${categoria.nombre}
                </h2>
            </div>
            <div class="albums-grid" data-category="${categoria.id}">
                ${crearSkeletonLoading()}
            </div>
        </section>
    `;
}

/**
 * Crea skeleton loading
 */
function crearSkeletonLoading() {
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `
            <div class="album-card" style="min-height: 280px; pointer-events: none;">
                <div style="width: 100%; height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-bottom: 12px; animation: pulse 1.5s ease-in-out infinite;"></div>
                <div style="width: 80%; height: 16px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s ease-in-out infinite;"></div>
                <div style="width: 60%; height: 14px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; animation: pulse 1.5s ease-in-out infinite;"></div>
            </div>
        `;
    }
    return html;
}

/**
 * Carga álbumes de una categoría específica
 */
async function cargarAlbumsCategoria(categoria, albumsPage) {
    const grid = albumsPage.querySelector(`.albums-grid[data-category="${categoria.id}"]`);
    
    if (!grid) {
        console.error(`❌ [ALBUMS] No se encontró grid para ${categoria.id}`);
        return;
    }
    
    try {
        console.log(`🔍 [ALBUMS] Buscando álbumes de ${categoria.nombre}...`);
        
        // Obtener spotifyService desde window
        const spotifyService = window.spotifyService;
        
        if (!spotifyService) {
            throw new Error('spotifyService no está disponible en window');
        }
        
        // Buscar álbumes
        const resultados = await spotifyService.search(categoria.query, 0, ['album'], 6);
        const albums = resultados.albums || [];
        
        if (albums.length === 0) {
            grid.innerHTML = `<p style="color: #b3b3b3; text-align: center; padding: 40px; grid-column: 1/-1;">No se encontraron álbumes.</p>`;
            return;
        }
        
        // Renderizar álbumes
        let html = '';
        for (const album of albums) {
            html += crearHTMLAlbum(album);
        }
        grid.innerHTML = html;
        
        // Configurar clicks
        configurarClicksAlbums(grid);
        
        console.log(`✅ [ALBUMS] ${albums.length} álbumes de ${categoria.nombre} cargados`);
        
    } catch (error) {
        console.error(`❌ [ALBUMS] Error cargando ${categoria.nombre}:`, error);
        grid.innerHTML = `<p style="color: #ff4b4b; text-align: center; padding: 40px; grid-column: 1/-1;">Error al cargar álbumes de ${categoria.nombre}</p>`;
    }
}

/**
 * Crea el HTML de un álbum
 */
function crearHTMLAlbum(album) {
    const imagen = album.images[0]?.url || 'assets/images/default-album.webp';
    const artistas = album.artists.map(a => a.name).join(', ');
    const año = album.release_date?.split('-')[0] || 'N/A';
    
    return `
        <article class="album-card" tabindex="0"
            data-album-name="${escapeHtml(album.name)}"
            data-artist-name="${escapeHtml(artistas)}"
            data-cover="${imagen}">
            <div class="album-cover">
                <img src="${imagen}" 
                     alt="${escapeHtml(album.name)}"
                     style="width:100%;height:100%;object-fit:cover;">
                <button class="album-play-btn" aria-label="Reproducir álbum"></button>
            </div>
            <div class="album-info">
                <h3 class="album-title">${escapeHtml(album.name)}</h3>
                <p class="album-artist">${escapeHtml(artistas)}</p>
                <p class="album-year">${año}</p>
            </div>
        </article>
    `;
}

/**
 * Configura los clicks en las cards de álbumes
 */
function configurarClicksAlbums(grid) {
    const cards = grid.querySelectorAll('.album-card[data-album-name]');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const albumName = card.dataset.albumName;
            const artistName = card.dataset.artistName;
            const cover = card.dataset.cover;
            
            console.log(`🎵 [ALBUMS] Click en álbum: "${albumName}" de ${artistName}`);
            
            // Buscar showAlbumPage en diferentes lugares
            if (typeof window.showAlbumPage === 'function') {
                window.showAlbumPage(albumName, artistName, cover);
            } else if (typeof showAlbumPage === 'function') {
                showAlbumPage(albumName, artistName, cover);
            } else {
                console.error('❌ [ALBUMS] showAlbumPage no encontrada');
                alert('Error: No se puede abrir el álbum');
            }
        });
    });
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
 * Muestra un error general
 */
function mostrarError() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    const errorPage = document.createElement('div');
    errorPage.className = 'albums-page album-page';
    errorPage.innerHTML = `
        <div class="album-page-content" style="text-align: center; padding: 100px 20px;">
            <i class="fa-solid fa-exclamation-triangle" style="font-size: 80px; color: #ff4b4b; margin-bottom: 20px;"></i>
            <h2 style="margin-bottom: 10px;">Error al cargar la página</h2>
            <p style="color: #b3b3b3; margin-bottom: 30px;">No se pudo cargar la página de álbumes</p>
            <button onclick="location.reload()" style="padding: 12px 24px; background: rgba(155, 75, 255, 0.3); border: none; border-radius: 20px; color: white; cursor: pointer; font-size: 16px;">
                Reintentar
            </button>
        </div>
    `;
    
    mainContent.appendChild(errorPage);
}

// Agregar animación CSS si no existe
if (!document.querySelector('#albums-page-animation')) {
    const style = document.createElement('style');
    style.id = 'albums-page-animation';
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
}