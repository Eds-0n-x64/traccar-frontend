// js/api.js
// Módulo para consumir las APIs del backend

// js/api.js
const API = {
    /**
     * Realiza una petición GET autenticada
     */
    async get(endpoint) {
        try {
            console.log('Haciendo petición a:', `${CONFIG.API_BASE_URL}${endpoint}`);
            console.log('Cookies actuales:', document.cookie);
            
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include', // Enviar cookies
                signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
            });

            console.log('Status de respuesta:', response.status);
            console.log('Headers de respuesta:', [...response.headers.entries()]);

            if (response.status === 401) {
                console.error('401 - Sesión no autorizada');
                // NO hacer logout automáticamente, mostrar error
                throw new Error('No autorizado. Las cookies de sesión no están funcionando.');
            }

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en petición GET:', error);
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado');
            }
            throw error;
        }
    },

    /**
     * Obtiene la lista de dispositivos (taxis) del usuario
     */
    async getDevices() {
        try {
            const devices = await this.get(CONFIG.ENDPOINTS.DEVICES);
            console.log('Dispositivos obtenidos:', devices);
            return devices;
        } catch (error) {
            console.error('Error obteniendo dispositivos:', error);
            throw error;
        }
    },

    /**
     * Obtiene las posiciones de todos los dispositivos
     */
    async getPositions(deviceIds = null) {
        try {
            let endpoint = CONFIG.ENDPOINTS.POSITIONS;
            
            if (deviceIds && deviceIds.length > 0) {
                const params = new URLSearchParams();
                deviceIds.forEach(id => params.append('deviceId', id));
                endpoint += `?${params.toString()}`;
            }
            
            const positions = await this.get(endpoint);
            console.log('Posiciones obtenidas:', positions);
            return positions;
        } catch (error) {
            console.error('Error obteniendo posiciones:', error);
            throw error;
        }
    },

    /**
     * Obtiene la posición de un dispositivo específico
     */
    async getDevicePosition(deviceId) {
        try {
            const positions = await this.getPositions([deviceId]);
            return positions.length > 0 ? positions[0] : null;
        } catch (error) {
            console.error(`Error obteniendo posición del dispositivo ${deviceId}:`, error);
            throw error;
        }
    }
};