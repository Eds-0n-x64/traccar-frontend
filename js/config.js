// js/config.js
// Configuración de la aplicación

// js/config.js
const CONFIG = {
    // URL del backend (ahora apunta al proxy local)
    API_BASE_URL: 'http://localhost:3000',
    
    // Endpoints
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
    
    // LocalStorage keys
    STORAGE_KEYS: {
        TOKEN: 'taxi_auth_token',
        USER_DATA: 'taxi_user_data',
        SESSION_EXPIRY: 'taxi_session_expiry'
    },
    
    // Timeouts
    REQUEST_TIMEOUT: 10000,
    SESSION_DURATION: 8 * 60 * 60 * 1000
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}


// No exportar información sensible
// Las API keys deben ir en variables de entorno