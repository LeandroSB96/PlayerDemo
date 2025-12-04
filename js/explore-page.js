// explore-page.js
import { spotifyService } from './spotify-service.js';

// Configuración de géneros
const GENRES = [
    { name: 'Pop', query: 'pop', color: 'rgba(255, 75, 155, 0.3)', icon: '🎤' },
    { name: 'Rock', query: 'rock', color: 'rgba(255, 75, 75, 0.3)', icon: '🎸' },
    { name: 'Hip Hop', query: 'hip hop', color: 'rgba(255, 165, 0, 0.3)', icon: '🎧' },
    { name: 'Electrónica', query: 'electronic', color: 'rgba(75, 155, 255, 0.3)', icon: '🎹' },
    { name: 'Jazz', query: 'jazz', color: 'rgba(255, 215, 0, 0.3)', icon: '🎷' },
    { name: 'R&B', query: 'r&b', color: 'rgba(155, 75, 255, 0.3)', icon: '🎵' },
    { name: 'Indie', query: 'indie', color: 'rgba(75, 255, 155, 0.3)', icon: '🎼' },
    { name: 'Metal', query: 'metal', color: 'rgba(50, 50, 50, 0.5)', icon: '🤘' }
];

/**
 * Muestra la página de explorar con álbumes organizados por género
 * @param {Function} showAlbumPageCallback - Callback para mostrar página de álbum
 */
export async function showExplorePage(showAlbumPageCallback) {
    console.log('🎵 Iniciando página de Explorar...');

    // Remover páginas existentes
    const existingPages = document.querySelectorAll('.album-page, .favorites-page, .playlists-page, .explore-page');
    existingPages.forEach(page => page.remove());

    // Ocultar contenido principal
    const mainContent = document.querySelector('.content');
    if (mainContent) mainContent.style.display = 'none';

    // Crear página de explorar
    const explorePage = createExplorePageStructure();
    
    const mainContentContainer = document.querySelector('.main-content');
    mainContentContainer.appendChild(explorePage);
    mainContentContainer.scrollTop = 0;

    // Configurar botón de regresar
    setupBackButton(explorePage);

    // Cargar géneros
    await loadGenres(explorePage, showAlbumPageCallback);
}

/**
 * Crea la estructura HTML de la página de explorar
 * @returns {HTMLElement} Elemento de la página
 */
function createExplorePageStructure() {
    const explorePage = document.createElement('div');
    explorePage.className = 'explore-page album-page';
    explorePage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(155, 75, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="explore-icon" style="width: 232px; height: 232px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(155, 75, 255, 0.2), rgba(75, 155, 255, 0.2)); border-radius: 8px;">
                    <i class="fa-solid fa-music" style="font-size: 120px; color: #9b4bff;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">DESCUBRE</span>
                    <h1 class="album-page-title">Explorar Música</h1>
                    <div class="album-page-meta">
                        <span>${GENRES.length} géneros musicales</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="album-page-content">
            <div id="genresContainer"></div>
        </div>

        ${createFooter()}
    `;

    return explorePage;
}

/**
 * Crea el HTML del footer
 * @returns {string} 
 */
function createFooter() {
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
                    <p style="color: #b3b3b3; margin-bottom: 20px;">Tu música favorita, siempre con vos. Descubre nuevos artistas y disfruta de la mejor experiencia musical.</p>
                    <div class="social-icons">
                        <a href="#" class="social-icon" aria-label="Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="social-icon" aria-label="Twitter">
                            <i class="fa-brands fa-x-twitter"></i>
                        </a>
                        <a href="#" class="social-icon" aria-label="Instagram">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="#" class="social-icon" aria-label="YouTube">
                            <i class="fab fa-youtube"></i>
                        </a>
                    </div>
                </div>

                <div class="footer-section">
                    <h3 class="footer-title">Recursos</h3>
                    <ul class="footer-links">
                        <li><a href="#">Acerca de Nosotros</a></li>
                        <li><a href="#">Planes Premium</a></li>
                        <li><a href="#">Para Artistas</a></li>
                        <li><a href="#">Desarrolladores</a></li>
                        <li><a href="#">Inversores</a></li>
                    </ul>
                </div>

                <div class="footer-section">
                    <h3 class="footer-title">Comunidad</h3>
                    <ul class="footer-links">
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Foro</a></li>
                        <li><a href="#">Eventos</a></li>
                        <li><a href="#">Merchandising</a></li>
                        <li><a href="#">Novedades</a></li>
                    </ul>
                </div>

                <div class="footer-section">
                    <h3 class="footer-title">Ayuda</h3>
                    <ul class="footer-links">
                        <li><a href="#">Soporte</a></li>
                        <li><a href="#">Centro de Ayuda</a></li>
                        <li><a href="#">Contacto</a></li>
                        <li><a href="#">Términos de Uso</a></li>
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
 * Configura el botón de regresar
 * @param {HTMLElement} explorePage - Elemento de la página
 */
function setupBackButton(explorePage) {
    const backButton = explorePage.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            explorePage.remove();
            const mainContent = document.querySelector('.content');
            if (mainContent) mainContent.style.display = 'block';
        });
    }
}

/**
 * Carga los álbumes para cada género
 * @param {HTMLElement} explorePage - Elemento de la página
 * @param {Function} showAlbumPageCallback - Callback para mostrar álbum
 */
async function loadGenres(explorePage, showAlbumPageCallback) {
    const genresContainer = explorePage.querySelector('#genresContainer');
    if (!genresContainer) return;

    for (const genre of GENRES) {
        const genreSection = createGenreSection(genre);
        genresContainer.appendChild(genreSection);

        // Cargar álbumes de forma asíncrona
        loadGenreAlbums(genreSection, genre, showAlbumPageCallback);
    }
}

/**
 * Crea una sección de género con skeleton loading
 * @param {Object} genre - Objeto del género
 * @returns {HTMLElement} Sección del género
 */
function createGenreSection(genre) {
    const genreSection = document.createElement('section');
    genreSection.className = 'genre-section';
    genreSection.style.marginBottom = '50px';
    
    genreSection.innerHTML = `
        <div class="section-header" style="margin-bottom: 20px;">
            <h2 class="section-title" style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">${genre.icon}</span>
                ${genre.name}
            </h2>
        </div>
        <div class="genre-albums-grid albums-grid" data-genre="${genre.query}">
            ${createSkeletonCards(genre.color, 6)}
        </div>
    `;

    return genreSection;
}

/**
 * Crea cards de skeleton loading
 * @param {string} color - Color del género
 * @param {number} count - Cantidad de cards
 * @returns {string} HTML de las cards
 */
function createSkeletonCards(color, count) {
    return Array(count).fill().map(() => `
        <div class="album-card skeleton-loading" style="background: ${color}; min-height: 280px;">
            <div class="skeleton-cover"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text-small"></div>
        </div>
    `).join('');
}

/**
 * Carga los álbumes de un género desde Spotify
 * @param {HTMLElement} genreSection - Sección del género
 * @param {Object} genre - Objeto del género
 * @param {Function} showAlbumPageCallback - Callback para mostrar álbum
 */
async function loadGenreAlbums(genreSection, genre, showAlbumPageCallback) {
    const grid = genreSection.querySelector('.genre-albums-grid');
    
    try {
        console.log(`🔍 Buscando álbumes de ${genre.name}...`);
        const searchResults = await spotifyService.search(genre.query);
        const albums = searchResults.albums.slice(0, 6);
        
        if (albums.length === 0) {
            grid.innerHTML = createEmptyState(genre.name);
            return;
        }

        grid.innerHTML = albums.map(album => createAlbumCard(album)).join('');
        setupAlbumCardListeners(grid, showAlbumPageCallback);

        console.log(`✅ ${albums.length} álbumes de ${genre.name} cargados`);

    } catch (error) {
        console.error(`❌ Error cargando álbumes de ${genre.name}:`, error);
        grid.innerHTML = createErrorState(genre.name);
    }
}

/**
 * Crea el HTML de una card de álbum
 * @param {Object} album - Objeto del álbum de Spotify
 * @returns {string} HTML de la card
 */
function createAlbumCard(album) {
    return `
        <article class="album-card" tabindex="0" 
            data-album-name="${escapeHtml(album.name)}" 
            data-artist-name="${escapeHtml(album.artists[0]?.name || '')}" 
            data-cover="${album.images[0]?.url || ''}">
            <div class="album-cover">
                <img src="${album.images[0]?.url || ''}" 
                     alt="${escapeHtml(album.name)}" 
                     style="width:100%;height:100%;object-fit:cover;"
                     loading="lazy">
                <button class="album-play-btn" aria-label="Reproducir álbum"></button>
            </div>
            <div class="album-info">
                <h3 class="album-title">${escapeHtml(album.name)}</h3>
                <p class="album-artist">${escapeHtml(album.artists[0]?.name || 'Artista Desconocido')}</p>
                <p class="album-year">${album.release_date ? album.release_date.split('-')[0] : ''}</p>
            </div>
        </article>
    `;
}

/**
 * Configura los event listeners de las cards de álbum
 * @param {HTMLElement} grid - Grid de álbumes
 * @param {Function} showAlbumPageCallback - Callback para mostrar álbum
 */
function setupAlbumCardListeners(grid, showAlbumPageCallback) {
    grid.querySelectorAll('.album-card').forEach(card => {
        card.addEventListener('click', async function(e) {
            if (e.target.closest('.album-play-btn')) {
                return;
            }
            
            const albumName = this.dataset.albumName;
            const artistName = this.dataset.artistName;
            const cover = this.dataset.cover;
            
            if (showAlbumPageCallback) {
                await showAlbumPageCallback(albumName, artistName, cover);
            }
        });
    });
}

/**
 * Crea un estado vacío
 * @param {string} genreName - Nombre del género
 * @returns {string} HTML del estado vacío
 */
function createEmptyState(genreName) {
    return `
        <p style="color: #b3b3b3; grid-column: 1 / -1; text-align: center; padding: 40px;">
            No se encontraron álbumes de ${genreName} en este momento.
        </p>
    `;
}

/**
 * Crea un estado de error
 * @param {string} genreName - Nombre del género
 * @returns {string} HTML del estado de error
 */
function createErrorState(genreName) {
    return `
        <p style="color: #b3b3b3; grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fa-solid fa-circle-exclamation" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
            Error al cargar álbumes de ${genreName}. Por favor, intenta de nuevo más tarde.
        </p>
    `;
}

/**
 * Escapa caracteres HTML especiales
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}