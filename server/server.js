require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PORT = process.env.PORT || 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are not set. Create a .env file based on .env.example');
}

app.use((req, res, next) => {
  // Permitir CORS para desarrollo local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/spotify-token', async (req, res) => {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    // devolver solo lo necesario
    res.json({ access_token: data.access_token, token_type: data.token_type, expires_in: data.expires_in });
  } catch (err) {
    console.error('Error fetching Spotify token:', err);
    res.status(500).json({ error: 'token_error', details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Spotify token proxy running on http://localhost:${PORT}. Endpoint: /spotify-token`);
});