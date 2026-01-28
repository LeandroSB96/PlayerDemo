// artists-page.js
import { spotifyService } from './spotify-service.js';

// Configuración de categorías de artistas con búsquedas variadas
const ARTIST_CATEGORIES = [
    { 
        name: 'Artistas Trending', 
        queries: ['trending artists', 'top artists', 'hot artists', 'popular today', 'viral artists'],
        color: 'rgba(255, 75, 155, 0.3)', 
        icon: '🔥',
        gradient: 'linear-gradient(135deg, #FF4B9B 0%, #FF1744 100%)'
    },
    { 
        name: 'Leyendas del Rock', 
        queries: ['rock legends', 'classic rock artists', 'rock icons', 'rock pioneers', 'legendary rockers'],
        color: 'rgba(255, 75, 75, 0.3)', 
        icon: '🎸',
        gradient: 'linear-gradient(135deg, #FF4B4B 0%, #B71C1C 100%)'
    },
    { 
        name: 'Íconos del Pop', 
        queries: ['pop artists', 'pop superstars', 'pop icons', 'pop divas', 'mainstream pop artists'],
        color: 'rgba(255, 155, 255, 0.3)', 
        icon: '🎤',
        gradient: 'linear-gradient(135deg, #FF9BFF 0%, #E040FB 100%)'
    },
    { 
        name: 'Rock Argentino', 
        queries: ['rock argentino', 'soda stereo', 'los fabulosos cadillacs', 'ataque 77', 'argentinian rock'],
        color: 'rgba(100, 181, 246, 0.3)', 
        icon: '🇦🇷',
        gradient: 'linear-gradient(135deg, #64B5F6 0%, #1976D2 100%)'
    },
    { 
        name: 'Estrellas del Hip Hop', 
        queries: ['hip hop artists', 'rappers', 'hip hop superstars', 'rap icons', 'hip hop legends'],
        color: 'rgba(255, 165, 0, 0.3)', 
        icon: '🎧',
        gradient: 'linear-gradient(135deg, #FFA500 0%, #FF6F00 100%)'
    },
    { 
        name: 'Maestros del Jazz', 
        queries: ['jazz artists', 'jazz legends', 'jazz musicians', 'jazz masters', 'smooth jazz artists'],
        color: 'rgba(255, 215, 0, 0.3)', 
        icon: '🎷',
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)'
    },
    { 
        name: 'Pioneros de la Electrónica', 
        queries: ['electronic music artists', 'edm artists', 'electronic pioneers', 'synth pioneers', 'electronic icons'],
        color: 'rgba(75, 155, 255, 0.3)', 
        icon: '⚡',
        gradient: 'linear-gradient(135deg, #4B9BFF 0%, #2962FF 100%)'
    },
    { 
        name: 'Voces del R&B', 
        queries: ['r&b artists', 'soul singers', 'r&b legends', 'neo-soul artists', 'r&b superstars'],
        color: 'rgba(155, 75, 255, 0.3)', 
        icon: '🎵',
        gradient: 'linear-gradient(135deg, #9B4BFF 0%, #6A1B9A 100%)'
    },
    { 
        name: 'Talentos Indie', 
        queries: ['indie artists', 'indie rock bands', 'alternative artists', 'indie superstars', 'indie idols'],
        color: 'rgba(75, 255, 155, 0.3)', 
        icon: '🌟',
        gradient: 'linear-gradient(135deg, #4BFF9B 0%, #00C853 100%)'
    }
];

// Función para seleccionar una búsqueda aleatoria de cada categoría
function getRandomQuery(category) {
    return category.queries[Math.floor(Math.random() * category.queries.length)];
}

/**
 * Muestra la página de artistas con categorías organizadas
 * @param {Function} showArtistPageCallback - Callback para mostrar página del artista
 */
export async function showArtistsPage(showArtistPageCallback) {
    console.log('🎤 Iniciando página de Artistas...');

    // Remover páginas existentes
    const existingPages = document.querySelectorAll('.album-page, .favorites-page, .playlists-page, .explore-page, .artists-page');
    existingPages.forEach(page => page.remove());

    // Ocultar contenido principal
    const mainContent = document.querySelector('.content');
    if (mainContent) mainContent.style.display = 'none';

    // Crear página de artistas
    const artistsPage = createArtistsPageStructure();
    
    const mainContentContainer = document.querySelector('.main-content');
    mainContentContainer.appendChild(artistsPage);
    mainContentContainer.scrollTop = 0;

    // Configurar botón de regresar
    setupBackButton(artistsPage);

    // Cargar categorías de artistas
    await loadArtistCategories(artistsPage, showArtistPageCallback);
}

/**
 * Crea la estructura HTML de la página de artistas
 * @returns {HTMLElement} Elemento de la página
 */
function createArtistsPageStructure() {
    const artistsPage = document.createElement('div');
    artistsPage.className = 'artists-page album-page';
    artistsPage.innerHTML = `
        <div class="album-page-header" style="background: linear-gradient(180deg, rgba(255, 75, 155, 0.3) 0%, rgba(26, 26, 46, 0.8) 100%);">
            <button class="back-button">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="album-page-hero">
                <div class="artists-page-icon" style="width: 232px; height: 232px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(255, 75, 155, 0.2), rgba(155, 75, 255, 0.2)); border-radius: 50%; box-shadow: 0 8px 32px rgba(255, 75, 155, 0.3);">
                    <i class="fa-solid fa-microphone" style="font-size: 120px; color: #FF4B9B;"></i>
                </div>
                <div class="album-page-info">
                    <span class="album-page-type">DESCUBRE</span>
                    <h1 class="album-page-title">Artistas</h1>
                    <div class="album-page-meta">
                        <span>${ARTIST_CATEGORIES.length} categorías</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="album-page-content">
            <div id="artistCategoriesContainer"></div>
        </div>

        ${createFooter()}
    `;

    return artistsPage;
}

/**
 * Crea el HTML del footer
 * @returns {string} HTML del footer
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
 * @param {HTMLElement} artistsPage - Elemento de la página
 */
function setupBackButton(artistsPage) {
    const backButton = artistsPage.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            artistsPage.remove();
            const mainContent = document.querySelector('.content');
            if (mainContent) mainContent.style.display = 'block';
        });
    }
}

/**
 * Carga las categorías de artistas
 * @param {HTMLElement} artistsPage - Elemento de la página
 * @param {Function} showArtistPageCallback - Callback para mostrar artista
 */
async function loadArtistCategories(artistsPage, showArtistPageCallback) {
    const categoriesContainer = artistsPage.querySelector('#artistCategoriesContainer');
    if (!categoriesContainer) return;

    for (const category of ARTIST_CATEGORIES) {
        const categorySection = createCategorySection(category);
        categoriesContainer.appendChild(categorySection);

        // Cargar artistas de forma asíncrona
        loadCategoryArtists(categorySection, category, showArtistPageCallback);
    }
}

/**
 * Crea una sección de categoría con skeleton loading
 * @param {Object} category - Objeto de la categoría
 * @returns {HTMLElement} Sección de la categoría
 */
function createCategorySection(category) {
    const categorySection = document.createElement('section');
    categorySection.className = 'artist-category-section';
    categorySection.style.marginBottom = '50px';
    
    categorySection.innerHTML = `
        <div class="section-header" style="margin-bottom: 20px;">
            <h2 class="section-title" style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">${category.icon}</span>
                ${category.name}
            </h2>
        </div>
        <div class="category-artists-grid artists-grid" data-category="${category.query}">
            ${createSkeletonArtistCards(category.gradient, 6)}
        </div>
    `;

    return categorySection;
}

/**
 * Crea cards de skeleton loading para artistas
 * @param {string} gradient - Gradiente de la categoría
 * @param {number} count - Cantidad de cards
 * @returns {string} HTML de las cards
 */
function createSkeletonArtistCards(gradient, count) {
    return Array(count).fill().map(() => `
        <div class="artist-card skeleton-loading" style="text-align: center; padding: 15px;">
            <div class="skeleton-artist-avatar" style="width: 125px; height: 125px; border-radius: 50%; background: ${gradient}; margin: 0 auto 15px; opacity: 0.3;"></div>
            <div class="skeleton-text" style="margin: 0 auto;"></div>
            <div class="skeleton-text-small" style="margin: 8px auto 0;"></div>
        </div>
    `).join('');
}

/**
 * Carga los artistas de una categoría desde Spotify con variabilidad
 * @param {HTMLElement} categorySection - Sección de la categoría
 * @param {Object} category - Objeto de la categoría
 * @param {Function} showArtistPageCallback - Callback para mostrar artista
 */
async function loadCategoryArtists(categorySection, category, showArtistPageCallback) {
    const grid = categorySection.querySelector('.category-artists-grid');
    
    try {
        // Seleccionar una búsqueda aleatoria de la categoría para variabilidad
        const searchQuery = getRandomQuery(category);
        const randomOffset = Math.floor(Math.random() * 20); // Offset aleatorio entre 0 y 20
        
        console.log(`🔍 Buscando "${searchQuery}" para ${category.name} (offset: ${randomOffset})...`);
        
        // Realizar búsqueda con offset para obtener resultados diferentes cada vez
        const searchResults = await spotifyService.search(searchQuery, randomOffset);
        const artists = (searchResults.artists || []).slice(0, 6);
        
        if (artists.length === 0) {
            grid.innerHTML = createEmptyState(category.name);
            return;
        }

        grid.innerHTML = artists.map(artist => createArtistCard(artist, category.gradient)).join('');
        setupArtistCardListeners(grid, showArtistPageCallback);

        console.log(`✅ ${artists.length} artistas de ${category.name} cargados`);

    } catch (error) {
        console.error(`❌ Error cargando artistas de ${category.name}:`, error);
        grid.innerHTML = createErrorState(category.name);
    }
}

/**
 * Crea el HTML de una card de artista
 * @param {Object} artist - Objeto del artista de Spotify
 * @param {string} gradient - Gradiente de la categoría
 * @returns {string} HTML de la card
 */
function createArtistCard(artist, gradient) {
    const followers = artist.followers?.total ? formatFollowers(artist.followers.total) : '0';
    const imageUrl = artist.images[0]?.url || 'assets/images/default-artist.webp';
    
    return `
        <article class="artist-card" tabindex="0" 
            data-artist-id="${artist.id}"
            data-artist-name="${escapeHtml(artist.name)}"
            data-artist-image="${imageUrl}"
            style="cursor: pointer; padding: 15px; border-radius: 16px; transition: all 0.3s ease; background: rgba(255, 255, 255, 0);">
            <div class="artist-avatar" style="width: 125px; height: 125px; border-radius: 50%; background: ${gradient}; margin: 0 auto 15px; position: relative; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);">
                <img src="${imageUrl}" 
                     alt="${escapeHtml(artist.name)}" 
                     style="width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0.85; transition: opacity 0.3s ease, transform 0.3s ease;"
                     loading="lazy">
            </div>
            <h3 class="artist-name" style="font-size: 16px; color: white; font-weight: 600; margin-top: 12px; text-align: center; transition: color 0.3s ease;">
                ${escapeHtml(artist.name)}
            </h3>
            <p class="artist-followers" style="font-size: 13px; color: #b3b3b3; text-align: center; margin-top: 4px;">
                ${followers} seguidores
            </p>
        </article>
    `;
}

/**
 * Formatea el número de seguidores
 * @param {number} followers - Número de seguidores
 * @returns {string} Número formateado
 */
function formatFollowers(followers) {
    if (followers >= 1000000) {
        return (followers / 1000000).toFixed(1) + 'M';
    } else if (followers >= 1000) {
        return (followers / 1000).toFixed(1) + 'K';
    }
    return followers.toString();
}

/**
 * Configura los event listeners de las cards de artista
 * @param {HTMLElement} grid - Grid de artistas
 * @param {Function} showArtistPageCallback - Callback para mostrar artista
 */
function setupArtistCardListeners(grid) {
    grid.querySelectorAll('.artist-card').forEach(card => {
        // Efecto hover
        card.addEventListener('mouseenter', function() {
            const avatar = this.querySelector('.artist-avatar');
            const name = this.querySelector('.artist-name');
            const img = this.querySelector('.artist-avatar img');
            
            if (avatar) {
                avatar.style.transform = 'translateY(-8px)';
                avatar.style.boxShadow = '0 8px 30px rgba(255, 75, 155, 0.4)';
            }
            if (img) {
                img.style.opacity = '1';
                img.style.transform = 'scale(1.05)';
            }
            if (name) {
                name.style.color = '#ff00ff';
            }
            this.style.background = 'rgba(255, 255, 255, 0.08)';
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            const avatar = this.querySelector('.artist-avatar');
            const name = this.querySelector('.artist-name');
            const img = this.querySelector('.artist-avatar img');
            
            if (avatar) {
                avatar.style.transform = 'translateY(0)';
                avatar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
            }
            if (img) {
                img.style.opacity = '0.85';
                img.style.transform = 'scale(1)';
            }
            if (name) {
                name.style.color = 'white';
            }
            this.style.background = 'rgba(255, 255, 255, 0)';
            this.style.transform = 'translateY(0)';
        });

        // Click handler - por ahora solo muestra info en consola
        card.addEventListener('click', function() {
            const artistName = this.dataset.artistName;
            const artistId = this.dataset.artistId;
            
            console.log(`🎤 Artista seleccionado: ${artistName} (ID: ${artistId})`);
            alert(`Funcionalidad en desarrollo: Ver álbumes de ${artistName}`);
            
            // TODO: Implementar showArtistPageCallback(artistId, artistName);
        });
    });
}

/**
 * Crea un estado vacío
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} HTML del estado vacío
 */
function createEmptyState(categoryName) {
    return `
        <p style="color: #b3b3b3; grid-column: 1 / -1; text-align: center; padding: 40px;">
            No se encontraron artistas de ${categoryName} en este momento.
        </p>
    `;
}

/**
 * Crea un estado de error
 * @param {string} categoryName - Nombre de la categoría
 * @returns {string} HTML del estado de error
 */
function createErrorState(categoryName) {
    return `
        <p style="color: #b3b3b3; grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fa-solid fa-circle-exclamation" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
            Error al cargar artistas de ${categoryName}. Por favor, intenta de nuevo más tarde.
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