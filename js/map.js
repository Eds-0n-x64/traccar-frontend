// js/map.js
// Lógica del mapa y gestión de vehículos

// js/map.js
const MapManager = {
    map: null,
    markers: {},
    devices: [],
    positions: [],
    selectedDevice: null,
    isFirstLoad: true, // NUEVO: Flag para saber si es la primera carga

    /**
     * Inicializa el mapa
     */
    async init() {
        try {
            // Crear el mapa centrado en Cochabamba
            this.map = L.map('map').setView(
                CONFIG.MAP.DEFAULT_CENTER,
                CONFIG.MAP.DEFAULT_ZOOM
            );

            // Añadir capa de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: CONFIG.MAP.MAX_ZOOM,
                minZoom: CONFIG.MAP.MIN_ZOOM
            }).addTo(this.map);

            // Cargar datos iniciales
            await this.loadDevices();
            await this.loadPositions();
            
            console.log('Mapa inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando mapa:', error);
            Utils.showError('Error cargando el mapa: ' + error.message);
        }
    },

    /**
     * Carga la lista de dispositivos
     */
    async loadDevices() {
        try {
            this.devices = await API.getDevices();
            this.renderDevicesList();
            this.updateStats();
        } catch (error) {
            console.error('Error cargando dispositivos:', error);
            Utils.showError('Error cargando vehículos');
        }
    },

    /**
     * Carga las posiciones de los dispositivos
     */
    async loadPositions() {
        try {
            this.positions = await API.getPositions();
            this.renderMarkers();
        } catch (error) {
            console.error('Error cargando posiciones:', error);
            Utils.showError('Error cargando ubicaciones');
        }
    },

    /**
     * Renderiza la lista de dispositivos en el sidebar
     */
    renderDevicesList() {
        const listContainer = document.getElementById('vehicles-list');
        
        if (this.devices.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No hay vehículos disponibles</p>';
            return;
        }

        listContainer.innerHTML = this.devices.map(device => `
            <div class="vehicle-item ${device.status}" data-device-id="${device.id}">
                <div class="vehicle-name">
                    <span>${device.name}</span>
                    <span class="vehicle-status ${device.status}">${device.status === 'online' ? 'En línea' : 'Fuera de línea'}</span>
                </div>
                <div class="vehicle-details">
                    ID: ${device.uniqueId}
                </div>
            </div>
        `).join('');

        // Añadir event listeners
        document.querySelectorAll('.vehicle-item').forEach(item => {
            item.addEventListener('click', () => {
                const deviceId = parseInt(item.dataset.deviceId);
                this.selectDevice(deviceId);
            });
        });
    },

    /**
     * Renderiza los marcadores en el mapa
     * MODIFICADO: No resetea la vista del mapa en actualizaciones
     */
    renderMarkers() {
        // Crear o actualizar marcadores para cada posición
        this.positions.forEach(position => {
            const device = this.devices.find(d => d.id === position.deviceId);
            if (!device) return;

            // Crear ícono personalizado según el estado
            const icon = L.divIcon({
                html: `
                    <div style="
                        background: ${device.status === 'online' ? '#16a34a' : '#6b7280'};
                        color: white;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                        🚕
                    </div>
                `,
                className: 'custom-marker',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });

            // Si el marcador ya existe, solo actualizar su posición
            if (this.markers[device.id]) {
                const marker = this.markers[device.id];
                
                // Actualizar posición con animación suave
                marker.setLatLng([position.latitude, position.longitude]);
                
                // Actualizar ícono (por si cambió el estado)
                marker.setIcon(icon);
                
                // Actualizar popup
                marker.setPopupContent(`
                    <b>${device.name}</b><br>
                    Estado: ${device.status === 'online' ? 'En línea' : 'Fuera de línea'}<br>
                    Última actualización: ${new Date(position.fixTime).toLocaleString('es-ES')}
                `);
            } else {
                // Crear nuevo marcador
                const marker = L.marker([position.latitude, position.longitude], { icon })
                    .addTo(this.map)
                    .bindPopup(`
                        <b>${device.name}</b><br>
                        Estado: ${device.status === 'online' ? 'En línea' : 'Fuera de línea'}<br>
                        Última actualización: ${new Date(position.fixTime).toLocaleString('es-ES')}
                    `);

                // Event listener para seleccionar el vehículo
                marker.on('click', () => {
                    this.selectDevice(device.id);
                });

                this.markers[device.id] = marker;
            }
        });

        // Eliminar marcadores de dispositivos que ya no existen
        Object.keys(this.markers).forEach(deviceId => {
            const exists = this.positions.find(p => p.deviceId === parseInt(deviceId));
            if (!exists) {
                this.markers[deviceId].remove();
                delete this.markers[deviceId];
            }
        });

        // Solo ajustar el mapa en la primera carga
        if (this.isFirstLoad && this.positions.length > 0) {
            const bounds = L.latLngBounds(
                this.positions.map(p => [p.latitude, p.longitude])
            );
            this.map.fitBounds(bounds, { padding: [50, 50] });
            this.isFirstLoad = false; // Marcar que ya no es la primera carga
        }
    },

    /**
     * Selecciona un dispositivo y muestra su información
     */
    selectDevice(deviceId) {
        this.selectedDevice = deviceId;

        // Actualizar UI del sidebar
        document.querySelectorAll('.vehicle-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.deviceId) === deviceId) {
                item.classList.add('active');
            }
        });

        // Obtener datos del dispositivo y posición
        const device = this.devices.find(d => d.id === deviceId);
        const position = this.positions.find(p => p.deviceId === deviceId);

        if (!device) return;

        // Mostrar panel de información
        const panel = document.getElementById('vehicle-info-panel');
        const nameEl = document.getElementById('info-vehicle-name');
        const contentEl = document.getElementById('info-content');

        nameEl.textContent = device.name;
        
        if (position) {
            contentEl.innerHTML = `
                <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">${device.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">ID Único:</span>
                    <span class="info-value">${device.uniqueId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Velocidad:</span>
                    <span class="info-value">${position.speed ? position.speed.toFixed(1) + ' km/h' : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Altitud:</span>
                    <span class="info-value">${position.altitude ? position.altitude.toFixed(0) + ' m' : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Coordenadas:</span>
                    <span class="info-value">${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Última actualización:</span>
                    <span class="info-value">${new Date(position.fixTime).toLocaleString('es-ES')}</span>
                </div>
            `;
        } else {
            contentEl.innerHTML = '<p>No hay información de posición disponible</p>';
        }

        panel.style.display = 'block';

        // Centrar el mapa en el marcador seleccionado
        if (position && this.markers[deviceId]) {
            this.map.setView([position.latitude, position.longitude], 15);
        }
    },

    /**
     * Actualiza las estadísticas del sidebar
     */
    updateStats() {
        const total = this.devices.length;
        const online = this.devices.filter(d => d.status === 'online').length;
        const offline = total - online;

        document.getElementById('total-vehicles').textContent = total;
        document.getElementById('online-vehicles').textContent = online;
        document.getElementById('offline-vehicles').textContent = offline;
    },

    /**
     * Filtra vehículos por búsqueda
     */
    filterVehicles(searchTerm) {
        const items = document.querySelectorAll('.vehicle-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const name = item.querySelector('.vehicle-name span').textContent.toLowerCase();
            const id = item.querySelector('.vehicle-details').textContent.toLowerCase();
            
            if (name.includes(term) || id.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    },

    /**
     * Actualiza solo las posiciones (para auto-refresh)
     */
    async updatePositions() {
        try {
            await this.loadPositions();
            
            // Si hay un dispositivo seleccionado, actualizar su info
            if (this.selectedDevice) {
                const device = this.devices.find(d => d.id === this.selectedDevice);
                const position = this.positions.find(p => p.deviceId === this.selectedDevice);
                
                if (device && position) {
                    // Actualizar el panel de información sin cerrarlo
                    const contentEl = document.getElementById('info-content');
                    if (contentEl && document.getElementById('vehicle-info-panel').style.display !== 'none') {
                        contentEl.innerHTML = `
                            <div class="info-row">
                                <span class="info-label">Estado:</span>
                                <span class="info-value">${device.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">ID Único:</span>
                                <span class="info-value">${device.uniqueId}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Velocidad:</span>
                                <span class="info-value">${position.speed ? position.speed.toFixed(1) + ' km/h' : 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Altitud:</span>
                                <span class="info-value">${position.altitude ? position.altitude.toFixed(0) + ' m' : 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Coordenadas:</span>
                                <span class="info-value">${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Última actualización:</span>
                                <span class="info-value">${new Date(position.fixTime).toLocaleString('es-ES')}</span>
                            </div>
                        `;
                    }
                }
            }
            
            console.log('Posiciones actualizadas silenciosamente');
        } catch (error) {
            console.error('Error actualizando posiciones:', error);
        }
    },

    /**
     * Refresca todos los datos
     * MODIFICADO: Opción para resetear la vista del mapa
     */
    async refreshData(resetView = false) {
        const btn = document.getElementById('btn-refresh');
        btn.style.transform = 'rotate(360deg)';
        
        try {
            // Si se solicita resetear vista, marcar como primera carga
            if (resetView) {
                this.isFirstLoad = true;
            }
            
            await this.loadDevices();
            await this.loadPositions();
            Utils.showSuccess('Datos actualizados');
        } catch (error) {
            Utils.showError('Error actualizando datos');
        }
        
        setTimeout(() => {
            btn.style.transform = '';
        }, 300);
    }
};