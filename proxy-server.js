/// proxy-server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const BACKEND_URL = 'http://162.245.191.47:8082';

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(__dirname));

// Variable para guardar las cookies de sesión
let sessionCookies = '';

// Proxy para todas las peticiones /api/* - CORREGIDO
app.use('/api', async (req, res) => {
    try {
        const url = `${BACKEND_URL}${req.originalUrl}`;
        console.log(`${req.method} ${url}`);

        // Preparar headers
        const headers = {
            'Content-Type': req.headers['content-type'] || 'application/json',
        };

        // Si hay cookies de sesión guardadas, enviarlas
        if (sessionCookies) {
            headers['Cookie'] = sessionCookies;
            console.log('Enviando cookies:', sessionCookies);
        }

        // Preparar body
        let body = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                const params = new URLSearchParams(req.body);
                body = params.toString();
            } else {
                body = JSON.stringify(req.body);
            }
        }

        // Hacer petición al backend
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url, {
            method: req.method,
            headers: headers,
            body: body
        });

        // Capturar cookies de la respuesta (especialmente en login)
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            sessionCookies = setCookie.split(';')[0]; // Guardar la cookie
            console.log('Cookies recibidas:', sessionCookies);
            res.setHeader('Set-Cookie', setCookie);
        }

        // Leer respuesta
        const data = await response.text();
        
        // Enviar respuesta al cliente
        res.status(response.status);
        response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') {
                res.setHeader(key, value);
            }
        });
        
        res.send(data);

    } catch (error) {
        console.error('Error en proxy:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Proxy Server corriendo en:          ║
║   http://localhost:${PORT}                ║
║                                        ║
║   Abre: http://localhost:${PORT}/index.html ║
╚════════════════════════════════════════╝
    `);
});