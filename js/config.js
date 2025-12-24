// js/config.js
// Configuración de la aplicación

const CONFIG = {
    // URL del backend - CAMBIAR en producción
    API_BASE_URL: 'http://162.245.191.47:8082/api',
    WS_BASE_URL: 'ws://162.245.191.47:8082/ws',

    //Endpoints
    ENDPOINTS: {
        LOGIN: '/api/session',
        DEVICES: '/api/devices',
        POSITIONS: '/api/positions'
    },
    
    // Configuración del mapa
    MAP: {
        DEFAULT_CENTER: [-17.3935, -66.1570], // Cochabamba
        DEFAULT_ZOOM: 13,
        MAX_ZOOM: 18,
        MIN_ZOOM: 10
    },
    
    // Intervalos de actualización (milisegundos)
    UPDATE_INTERVAL: 5000, // 5 segundos
    
    // LocalStorage keys
    STORAGE_KEYS: {
        TOKEN: 'taxi_auth_token',
        USER_DATA: 'taxi_user_data',
        SESSION_EXPIRY: 'taxi_session_expiry'
    },
    
    // Timeouts
    REQUEST_TIMEOUT: 10000, // 10 segundos
    SESSION_DURATION: 8 * 60 * 60 * 1000 // 8 horas en milisegundos
};

// Hacer CONFIG disponible globalmente
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}


// No exportar información sensible
// Las API keys deben ir en variables de entorno