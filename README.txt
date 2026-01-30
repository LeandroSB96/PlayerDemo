===============================================
         PLAYER DEMO - GUÍA DEL PROYECTO
===============================================

QUÉ ES PLAYER DEMO
------------------
Un reproductor de música moderno con búsqueda y navegación integrada con Spotify. 
Podés explorar artistas, ver sus canciones populares, sus álbumes y armar tus propias playlists.


CARACTERÍSTICAS PRINCIPALES
---------------------------
• Búsqueda de artistas, canciones y álbumes en Spotify
• Página detallada de cada artista con top tracks y discografía
• Reproductor de música con controles básicos
• Sistema de favoritos para guardar tus canciones
• Creación y gestión de playlists propias
• Música local (archivos en assets/audio/)
• Interfaz responsive que se adapta a cualquier pantalla
• Diseño moderno con animaciones fluidas


CÓMO EMPEZAR
------------
1. Instala las dependencias:
   npm install

2. Configura tu Spotify (obtén las credenciales de https://developer.spotify.com):
   - Copia js/config.example.js
   - Renómbralo a js/config.js
   - Agrega tu CLIENT_ID y CLIENT_SECRET

3. Inicia el proyecto:
   npm start

   Esto abre:
   - Frontend: http://localhost:5500
   - Backend: http://localhost:3000


ESTRUCTURA DE CARPETAS
----------------------
js/
  ├─ script.js                 → Lógica principal
  ├─ spotify-service.js        → Conexión con Spotify
  ├─ player-service.js         → Lógica del reproductor
  ├─ music-data.js             → Datos de música local
  ├─ explore-page.js           → Página de exploración
  ├─ artists-page.js           → Listado de artistas
  ├─ artist-detail-page.js     → Página individual del artista (⭐ NUEVO)
  ├─ albums-page.js            → Página de álbumes
  ├─ favorites-manager.js      → Gestión de favoritos
  ├─ playlist-system.js        → Sistema de playlists
  └─ playlist-ui.js            → UI de playlists

assets/
  ├─ audio/                    → Canciones locales
  ├─ images/                   → Logos, covers, fotos
  └─ videos/                   → Videos (si aplica)

server/
  ├─ server.js                 → Backend Node.js
  └─ package.json


FLUJO DE USO
-----------
Buscar → Seleccionar → Ver detalles → Reproducir/Agregar a favoritos

Ejemplo: Buscas "Queen" → Aparece con badge ARTISTA → Ves su página 
→ Ves top 5 canciones y sus álbumes → Podés click en cualquier álbum 
para ver detalles completos.


CAMBIOS RECIENTES
-----------------
✨ Agregada página individual del artista con:
   - Información del artista (followers, género)
   - Top 5 canciones más populares
   - Discografía completa (hasta 12 álbumes)
   - Búsqueda integrada desde Spotify
   - Colores dinámicos según género musical


QUÉ NECESITAS PARA QUE FUNCIONE
--------------------------------
• Node.js v14+
• npm o yarn
• Cuenta de desarrollador en Spotify (es gratis)
• No necesitas ser Premium, con la versión gratuita funciona bien


SOLUCIÓN RÁPIDA DE PROBLEMAS
-----------------------------

🔴 "showArtistPage is not a function"
   → Asegúrate de que artist-detail-page.js está importado en index.html
   → Verifica que showArtistPage esté asignado a window en script.js

🔴 "Spotify API error"
   → Verifica tu CLIENT_ID y CLIENT_SECRET
   → Chequea que no hayan expirado tus credenciales

🔴 La búsqueda es lenta
   → Es normal la primera vez (conexión con Spotify)
   → Después se cachea y es más rápida

🔴 No se ve la página del artista
   → Abre la consola (F12) y mira qué error aparece
   → Verifica que la música no esté bloqueada por CORS


PERSONALIZACIÓN
---------------
Los colores se pueden cambiar en styles.css
Los géneros musicales generan colores automáticos en artist-detail-page.js
Podés agregar más categorías en artists-page.js


NOTAS FINALES
-------------
Este proyecto es responsive, así que funciona bien en mobile, tablet y desktop.
La mayoría de la música viene de Spotify, pero podés agregar canciones locales 
en assets/audio/

Si tenés problemas, chequea siempre la consola del navegador (F12) para ver 
qué error exacto aparece.


¡Que disfrutes explorando música! 🎵


Última actualización: Enero 2026
