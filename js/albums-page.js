// albums-page.js
import { spotifyService } from './spotify-service.js';

// Configuración de categorías de álbumes
const ALBUM_CATEGORIES = [
    {
        name: 'Álbumes Pop',
        query: 'pop albums',
        queries: ['pop albums', 'top pop albums', 'pop hits albums', 'pop music albums'],
        color: 'rgba(255, 75, 155, 0.3)',
        icon: '🎤',
        gradient: 'linear-gradient(135deg, #FF4B9B 0%, #FF1744 100%)'
    },
    {
        name: 'Rock Clásico',
        query: 'classic rock albums',
        queries: ['classic rock albums', 'rock legends albums', 'rock classics', 'legendary rock albums'],
        color: 'rgba(255, 75, 75, 0.3)',
        icon: '🎸',
        gradient: 'linear-gradient(135deg, #FF4B4B 0%, #B71C1C 100%)'
    },
    {
        name: 'Hip Hop',
        query: 'hip hop albums',
        queries: ['hip hop albums', 'rap albums', 'hip hop classics', 'hip hop hits albums'],
        color: 'rgba(255, 165, 0, 0.3)',
        icon: '🎧',
        gradient: 'linear-gradient(135deg, #FFA500 0%, #FF6F00 100%)'
    },
    {
        name: 'Electrónica',
        query: 'electronic albums',
        queries: ['electronic albums', 'electronic music albums', 'edm albums', 'electronic dance albums'],
        color: 'rgba(75, 155, 255, 0.3)',
        icon: '⚡',
        gradient: 'linear-gradient(135deg, #4B9BFF 0%, #2962FF 100%)'
    },
    {
        name: 'Jazz',
        query: 'jazz albums',
        queries: ['jazz albums', 'jazz classics', 'smooth jazz albums', 'jazz standards albums'],
        color: 'rgba(255, 215, 0, 0.3)',
        icon: '🎷',
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)'
    },
    {
        name: 'R&B',
        query: 'r&b albums',
        queries: ['r&b albums', 'soul albums', 'r&b classics', 'neo-soul albums'],
        color: 'rgba(155, 75, 255, 0.3)',
        icon: '🎵',
        gradient: 'linear-gradient(135deg, #9B4BFF 0%, #6A1B9A 100%)'
    },
    {
        name: 'Indie',
        query: 'indie albums',
        queries: ['indie albums', 'indie rock albums', 'alternative albums', 'indie music albums'],
        color: 'rgba(75, 255, 155, 0.3)',
        icon: '🌟',
        gradient: 'linear-gradient(135deg, #4BFF9B 0%, #00C853 100%)'
    },
    {
        name: 'Latinos',
        query: 'latin albums',
        queries: ['latin albums', 'latin music albums', 'reggaeton albums', 'latin pop albums'],
        color: 'rgba(255, 193, 7, 0.3)',
        icon: '🌶️',
        gradient: 'linear-gradient(135deg, #FFC107 0%, #FF8F00 100%)'
    }
];

// Función para seleccionar una búsqueda aleatoria de cada categoría
function getRandomQuery(category) {
    return category.queries[Math.floor(Math.random() * category.queries.length)];
}

/**
 * Muestra la página de álbumes con categorías organizadas
 * @param {Function} showAlbumPageCallback - Callback para mostrar página del álbum
 */
export async function showAlbumsPage(showAlbumPageCallback) {
    console.log('💿 Iniciando página de Álbumes...');
    console.log('Callback recibido:', typeof showAlbumPageCallback);

    // Remover páginas existentes
    const existingPages = document.querySelectorAll('.album-page, .favorites-page, .playlists-page, .explore-page, .artists-page, .albums-page');
    existingPages.forEach(page => page.remove());

    // Ocultar contenido principal
    const mainContent = document.querySelector('.content');
    if (mainContent) mainContent.style.display = 'none';

    // Crear página de álbumes
    const albumsPage = createAlbumsPageStructure();

    const mainContentContainer = document.querySelector('.main-content');
    mainContentContainer.appendChild(albumsPage);
    mainContentContainer.scrollTop = 0;

    // Configurar botón de regresar
    setupBackButton(albumsPage);

    // Cargar categorías de álbumes
    await loadAlbumCategories(albumsPage, showAlbumPageCallback);
}

/**
 * Crea la estructura HTML de la página de álbumes
 * @returns {HTMLElement} Elemento de la página
 */
function createAlbumsPageStructure() {
    const albumsPage = document.createElement('div');
    albumsPage.className = 'albums-page album-page';
    albumsPage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(155, 75, 255, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="albums-icon" style="width: 232px; height: 232px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(155, 75, 255, 0.2), rgba(75, 155, 255, 0.2)); border-radius: 8px;">
                    <i class="fa-solid fa-compact-disc" style="font-size: 120px; color: #9b4bff;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">DESCUBRE</span>
                    <h1 class="album-page-title">Álbumes Recomendados</h1>
                    <div class="album-page-meta">
                        <span>${ALBUM_CATEGORIES.length} categorías musicales</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="album-page-content">
            <div id="albumCategoriesContainer"></div>
        </div>

        ${createFooter()}
    `;

    return albumsPage;
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
 * @param {HTMLElement} albumsPage - Elemento de la página
 */
function setupBackButton(albumsPage) {
    const backButton = albumsPage.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            albumsPage.remove();
            const mainContent = document.querySelector('.content');
            if (mainContent) mainContent.style.display = 'block';
        });
    }
}

/**
 * Carga las categorías de álbumes
 * @param {HTMLElement} albumsPage - Elemento de la página
 * @param {Function} showAlbumPageCallback - Callback para mostrar álbum
 */
async function loadAlbumCategories(albumsPage, showAlbumPageCallback) {
    const categoriesContainer = albumsPage.querySelector('#albumCategoriesContainer');
    if (!categoriesContainer) return;

    for (const category of ALBUM_CATEGORIES) {
        const categorySection = createCategorySection(category);
        categoriesContainer.appendChild(categorySection);

        // Cargar álbumes de forma asíncrona
        loadCategoryAlbums(categorySection, category, showAlbumPageCallback);
    }
}

/**
 * Crea una sección de categoría con skeleton loading
 * @param {Object} category - Objeto de la categoría
 * @returns {HTMLElement} Sección de la categoría
 */
function createCategorySection(category) {
    const categorySection = document.createElement('section');
    categorySection.className = 'album-category-section';
    categorySection.style.marginBottom = '50px';

    categorySection.innerHTML = `
        <div class="section-header" style="margin-bottom: 20px;">
            <h2 class="section-title" style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">${category.icon}</span>
                ${category.name}
            </h2>
        </div>
        <div class="album-category-grid albums-grid" data-category="${category.query}">
            ${createSkeletonCards(category.color, 6)}
        </div>
    `;

    return categorySection;
}

/**
 * Crea cards de skeleton loading
 * @param {string} color - Color de la categoría
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
 * Carga los álbumes de una categoría desde Spotify con variabilidad
 * @param {HTMLElement} categorySection - Sección de la categoría
 * @param {Object} category - Objeto de la categoría
 * @param {Function} showAlbumPageCallback - Callback para mostrar álbum
 */
async function loadCategoryAlbums(categorySection, category, showAlbumPageCallback) {
    const grid = categorySection.querySelector('.album-category-grid');

    try {
        // Seleccionar una búsqueda aleatoria de la categoría para variabilidad
        const searchQuery = getRandomQuery(category);
        const randomOffset = Math.floor(Math.random() * 20); // Offset aleatorio entre 0 y 20

        console.log(`🔍 Buscando "${searchQuery}" para ${category.name} (offset: ${randomOffset})...`);

        // Realizar búsqueda con offset para obtener resultados diferentes cada vez
        const searchResults = await spotifyService.search(searchQuery, randomOffset, ['album'], 6);
        const albums = (searchResults.albums || []).slice(0, 6);

        if (albums.length === 0) {
            grid.innerHTML = createEmptyState(category.name);
            return;
        }

        grid.innerHTML = albums.map(album => createAlbumCard(album)).join('');
        setupAlbumCardListeners(grid, showAlbumPageCallback);

        console.log(`✅ ${albums.length} álbumes de ${category.name} cargados`);

    } catch (error) {
        console.error(`❌ Error cargando álbumes de ${category.name}:`, error);
        grid.innerHTML = createErrorState(category.name);
    }
}

/**
 * Crea el HTML de una card de álbum
 * @param {Object} album - Objeto del álbum de Spotify
 * @returns {string} HTML de la card
 */
function createAlbumCard(album) {
    const imageUrl = album.images[0]?.url || 'assets/images/default-album.webp';
    const artistNames = album.artists.map(a => a.name).join(', ');

    return `
        <article class="album-card" tabindex="0"
            data-album-name="${album.name.replace(/"/g, '&quot;')}"
            data-artist-name="${artistNames.replace(/"/g, '&quot;')}"
            data-cover="${imageUrl}">
            <div class="album-cover">
                <img src="${imageUrl}"
                     alt="${album.name}"
                     class="album-cover-img">
                <button class="album-play-btn" aria-label="Reproducir álbum"></button>
            </div>
            <div class="album-info">
                <h3 class="album-title">${album.name}</h3>
                <p class="album-artist">${artistNames}</p>
                <p class="album-year">${album.release_date?.split('-')[0] || 'N/A'}</p>
            </div>
        </article>
    `;
}

/**
 * Configura los listeners para las cards de álbum
 * @param {HTMLElement} grid - Grid de álbumes
 * @param {Function} showAlbumPageCallback - Callback para mostrar álbum
 */
function setupAlbumCardListeners(grid, showAlbumPageCallback) {
    const cards = grid.querySelectorAll('.album-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const albumName = card.dataset.albumName;
            const artistName = card.dataset.artistName;
            const cover = card.dataset.cover;
            showAlbumPageCallback(albumName, artistName, cover);
        });
    });
}

/**
 * Crea estado vacío
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} HTML del estado vacío
 */
function createEmptyState(categoryName) {
    return `<p style="color: #b3b3b3; text-align: center; padding: 40px;">No se encontraron álbumes en ${categoryName}.</p>`;
}

/**
 * Crea estado de error
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} HTML del estado de error
 */
function createErrorState(categoryName) {
    return `<p style="color: #b3b3b3; text-align: center; padding: 40px;">Error al cargar álbumes de ${categoryName}.</p>`;
}