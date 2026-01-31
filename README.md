# 🎵 Player Demo

Demo de un reproductor de música desktop moderno con integración a Spotify. Diseñado para ofrecer una experiencia fluida y visual explorando artistas, álbumes y canciones populares.

<img width="1363" height="640" alt="Captura de pantalla 2026-01-30 210023" src="https://github.com/user-attachments/assets/b1ada844-201c-476f-9e97-d2d354af6dc6" />


## ✨ Características

- 🔍 **Búsqueda integrada** de artistas, álbumes y canciones 
- 🎤 **Página de artista** con información, top tracks y discografía completa
- 💿 **Catálogo de álbumes** organizados por géneros y tendencias
- 🎧 **Reproductor de música** con controles completos
- ❤️ **Gestión de favoritos** - guarda tus canciones favoritas
- 🎵 **Sistema de playlists** - crea y organiza tus propias listas
- 🎨 **Interfaz responsive** - funciona en desktop, tablet y mobile
- 🌙 **Diseño moderno** con gradientes y animaciones fluidas

## 🚀 Instalación

### Requisitos
- Node.js (v14 o superior)
- npm o yarn
- Cliente ID y Secret de Spotify (obtén uno en [developer.spotify.com](https://developer.spotify.com))

### Pasos

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/LeandroSB96/PlayerDemo.git
   cd PlayerDemo
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura tus credenciales de Spotify**
   - Copia `js/config.example.js` y renómbralo a `js/config.js`
   - Agrega tu `CLIENT_ID` y `CLIENT_SECRET` de Spotify
   ```javascript
   export const SPOTIFY_CONFIG = {
       CLIENT_ID: 'tu_client_id',
       CLIENT_SECRET: 'tu_client_secret'
   };
   ```

4. **Inicia el proyecto**
   ```bash
   npm start
   ```
   - Cliente en `http://localhost:5500`
   - Servidor en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
PlayerDemo/
├── index.html              # Página principal
├── styles.css             # Estilos globales
├── js/                    # JavaScript modular
│   ├── script.js          # Lógica principal
│   ├── spotify-service.js # Conexión con Spotify API
│   ├── player-service.js  # Lógica del reproductor
│   ├── music-data.js      # Datos de música local
│   ├── explore-page.js    # Página de exploración
│   ├── artists-page.js    # Listado de artistas
│   ├── artist-detail-page.js # Página individual del artista
│   ├── albums-page.js     # Página de álbumes
│   ├── favorites-manager.js # Gestión de favoritos
│   ├── playlist-system.js # Sistema de playlists
│   └── playlist-ui.js     # UI de playlists
├── assets/
│   ├── audio/             # Archivos de música local
│   ├── images/            # Imágenes, logos y covers
│   └── videos/            # Videos (si aplica)
└── server/                # Backend Node.js
    ├── server.js          # Servidor proxy
    └── package.json
```

## 🎯 Uso

### Buscar una canción/artista/álbum
1. Haz click en la barra de búsqueda
2. Escribe lo que buscas (ej: "Queen", "Bohemian Rhapsody")
3. Se mostrarán resultados categorizados
4. Click en cualquier resultado para ver detalles

### Ver página de un artista
1. Busca un artista
2. Click en el resultado con badge "ARTISTA"
3. Verás su información, top 5 canciones y álbumes

### Crear una playlist
1. Busca y agrega canciones a favoritos
2. Accede a "Mis Playlists"
3. Crea nueva playlist y agrega temas

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: Node.js + Express (proxy para Spotify)
- **API**: Spotify Web API
- **Tools**: Live Server, Concurrently

## 🔐 Variables de Entorno

Crear archivo `.env` en la raíz:
```
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
PORT=3000
```

## 📝 Notas de Desarrollo

- Las búsquedas se cachean para optimizar performance
- Los álbumes pueden cargarse desde Spotify o música local
- La UI se adapta automáticamente al tamaño de pantalla
- Los estilos usan CSS variables para fácil personalización

## 🐛 Solución de Problemas

**"API key no válida"**
- Verifica que `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` estén correctos en `config.js`

**Canciones no se reproducen**
- Asegúrate de que los archivos de audio existan en `assets/audio/`
- Verifica la consola del navegador (F12) por errores

**Búsqueda lenta**
- Es normal en la primera búsqueda (conexión con Spotify)
- Las búsquedas posteriores usan caché

## 📄 Licencia

ISC License

Copyright (c) 2026, LeandroSB96

## 🤝 Contribuciones

Las pull requests son bienvenidas. Para cambios mayores, abre un issue primero para discutir los cambios propuestos.

---

**Hecho con ❤️ para los amantes de la música**
