// js/config.js
// Configuración de la aplicación

const CONFIG = {
    // URL del backend - CAMBIAR en producción
    API_BASE_URL: 'http://162.245.191.47:8082/api',
    // WS_BASE_URL: 'ws://localhost:8000/ws',
    
    // Configuración del mapa
    MAP: {
        DEFAULT_CENTER: [-17.3935, -66.1570], // Cochabamba
        DEFAULT_ZOOM: 13,
        MAX_ZOOM: 18,
        MIN_ZOOM: 10
    },
    
    // Intervalos de actualización (milisegundos)
    UPDATE_INTERVAL: 5000, // 5 segundos
    
    // Configuración de seguridad
    //TOKEN_KEY: 'taxi_auth_token',
    //TOKEN_EXPIRY_KEY: 'taxi_token_expiry'
};

// No exportar información sensible
// Las API keys deben ir en variables de entorno