// Aplicación principal
const App = {
    currentFile: null,
    currentExif: null,
    currentColors: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    cacheElements() {
        this.elements = {
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput'),
            previewSection: document.getElementById('previewSection'),
            previewImg: document.getElementById('previewImg'),
            basicInfo: document.getElementById('basicInfo'),
            exifInfo: document.getElementById('exifInfo'),
            exifCard: document.getElementById('exifCard'),
            gpsInfo: document.getElementById('gpsInfo'),
            gpsCard: document.getElementById('gpsCard'),
            gpsWarning: document.getElementById('gpsWarning'),
            gpsMapLink: document.getElementById('gpsMapLink'),
            palette: document.getElementById('palette'),
            colorCodes: document.getElementById('colorCodes'),
            downloadJson: document.getElementById('downloadJson'),
            downloadTxt: document.getElementById('downloadTxt'),
            clearData: document.getElementById('clearData'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            securityNotice: document.getElementById('securityNotice'),
            securityMessage: document.getElementById('securityMessage')
        };
    },
    
    bindEvents() {
        // Drop zone
        this.elements.dropZone.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.dropZone.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.elements.fileInput.click();
            }
        });
        
        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('dragover');
        });
        
        this.elements.dropZone.addEventListener('dragleave', () => {
            this.elements.dropZone.classList.remove('dragover');
        });
        
        this.elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFile(file);
        });
        
        // File input
        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFile(file);
        });
        
        // Botones
        this.elements.downloadJson.addEventListener('click', () => {
            this.downloadJSON();
        });
        
        this.elements.downloadTxt.addEventListener('click', () => {
            this.downloadTXT();
        });
        
        this.elements.clearData.addEventListener('click', () => {
            this.clearAll();
        });
    },
    
    async handleFile(file) {
        // Validar archivo
        this.showLoading(true);
        
        const validation = await Validators.validateFile(file);
        
        if (!validation.valid) {
            this.showSecurityNotice(validation.errors.join(', '));
            this.showLoading(false);
            return;
        }
        
        this.hideSecurityNotice();
        this.currentFile = file;
        
        try {
            await this.processImage(file);
        } catch (error) {
            console.error('Error procesando imagen:', error);
            this.showSecurityNotice('Error al procesar la imagen');
        } finally {
            this.showLoading(false);
        }
    },

    async loadDemoImage(url, filename) {
        this.showLoading(true);
        this.hideSecurityNotice();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`No se pudo cargar la imagen de ejemplo (HTTP ${response.status})`);
            }

            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error('El recurso de ejemplo no es una imagen válida');
            }

            await this.handleFile(new File([blob], filename, { type: blob.type }));
        } catch (error) {
            console.error('Error cargando imagen de ejemplo:', error);
            this.showSecurityNotice('No se pudo cargar la imagen de ejemplo. Comprueba tu conexión e inténtalo de nuevo.');
        } finally {
            this.showLoading(false);
        }
    },
    
    async processImage(file) {
        // Crear URL para preview
        const url = URL.createObjectURL(file);
        
        // Cargar imagen
        const img = new Image();
        img.onload = () => {
            this.elements.previewImg.src = url;
            this.elements.previewSection.style.display = 'flex';
            
            // Información básica
            this.displayBasicInfo(file, img);
            
            // Extraer colores
            this.currentColors = ColorHandler.extractPalette(img);
            const paletteHTML = ColorHandler.generatePaletteHTML(this.currentColors);
            this.elements.palette.innerHTML = paletteHTML.swatches;
            this.elements.colorCodes.innerHTML = paletteHTML.codes;
            
            // Agregar eventos de click a los swatches
            document.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    ColorHandler.copyToClipboard(swatch.getAttribute('data-color'));
                });
            });
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
            throw new Error('Error al cargar la imagen');
        };
        
        img.src = url;
        
        // Extraer EXIF
        this.currentExif = await EXIFHandler.extract(file);
        
        if (this.currentExif) {
            const exifHTML = EXIFHandler.generateHTML(this.currentExif);
            this.elements.exifInfo.innerHTML = exifHTML;
            this.elements.exifCard.style.display = 'block';
            
            // Habilitar botones
            this.elements.downloadJson.disabled = false;
            this.elements.downloadTxt.disabled = false;
            
            // Verificar GPS
            if (EXIFHandler.hasGPSData(this.currentExif)) {
                this.showGPSWarning();
                this.displayGPSInfo();
            }
        } else {
            this.elements.exifCard.style.display = 'block';
            this.elements.exifInfo.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: var(--text-dim);">
                    <p style="font-size: 2rem; margin-bottom: 0.5rem;">⚠</p>
                    <p style="color: var(--accent); font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                        [ NO METADATA FOUND ]
                    </p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-dim);">
                        Image metadata has been stripped.<br>
                        Common sources: WhatsApp, Telegram, Social Media
                    </p>
                </div>
            `;
            this.elements.downloadJson.disabled = true;
            this.elements.downloadTxt.disabled = true;
        }
    },
    
    displayBasicInfo(file, img) {
        const aspectRatio = (img.width / img.height).toFixed(2);
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        this.elements.basicInfo.innerHTML = `
            <div class="data-row">
                <span class="data-label">Nombre</span>
                <span class="data-value">${file.name}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Tamaño</span>
                <span class="data-value">${fileSize} MB</span>
            </div>
            <div class="data-row">
                <span class="data-label">Tipo</span>
                <span class="data-value">${file.type}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Dimensiones</span>
                <span class="data-value">${img.width} × ${img.height} px</span>
            </div>
            <div class="data-row">
                <span class="data-label">Proporción</span>
                <span class="data-value">${aspectRatio}:1</span>
            </div>
            <div class="data-row">
                <span class="data-label">Megapíxeles</span>
                <span class="data-value">${((img.width * img.height) / 1000000).toFixed(2)} MP</span>
            </div>
        `;
    },
    
    showGPSWarning() {
        this.elements.gpsWarning.style.display = 'flex';
        this.showSecurityNotice(CONFIG.MESSAGES.gpsWarning);
    },
    
    displayGPSInfo() {
        const coords = EXIFHandler.getGPSCoordinates(this.currentExif);
        if (!coords) return;
        
        this.elements.gpsCard.style.display = 'block';
        this.elements.gpsInfo.innerHTML = `
            <div class="data-row">
                <span class="data-label">Latitud</span>
                <span class="data-value">${coords.lat.toFixed(6)}°</span>
            </div>
            <div class="data-row">
                <span class="data-label">Longitud</span>
                <span class="data-value">${coords.lon.toFixed(6)}°</span>
            </div>
        `;
        
        // Generar link a Google Maps
        this.elements.gpsMapLink.href = `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;
        this.elements.gpsMapLink.style.display = 'inline-flex';
    },
    
    downloadJSON() {
        if (!this.currentFile || !this.currentExif) return;
        
        const metadata = {
            fileName: this.currentFile.name,
            fileSize: this.currentFile.size,
            fileType: this.currentFile.type,
            uploadDate: new Date().toISOString(),
            exif: this.currentExif,
            colors: this.currentColors
        };
        
        const blob = new Blob([JSON.stringify(metadata, null, 2)], { 
            type: 'application/json' 
        });
        
        this.downloadFile(blob, `${Validators.sanitizeFilename(this.currentFile.name.replace(/\.[^.]+$/, ''))}_metadata.json`);
    },
    
    downloadTXT() {
        if (!this.currentFile || !this.currentExif) return;
        
        let content = `METADATOS DE IMAGEN\n`;
        content += `==================\n\n`;
        content += `Archivo: ${this.currentFile.name}\n`;
        content += `Tamaño: ${(this.currentFile.size / 1024 / 1024).toFixed(2)} MB\n`;
        content += `Fecha: ${new Date().toLocaleString('es-ES')}\n\n`;
        content += `METADATOS EXIF:\n`;
        content += `---------------\n`;
        
        for (const [key, value] of Object.entries(this.currentExif)) {
            const formatted = EXIFHandler.formatValue(key, value);
            if (formatted !== null) {
                content += `${key}: ${formatted}\n`;
            }
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        this.downloadFile(blob, `${Validators.sanitizeFilename(this.currentFile.name.replace(/\.[^.]+$/, ''))}_metadata.txt`);
    },
    
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    },
    
    clearAll() {
        this.currentFile = null;
        this.currentExif = null;
        this.currentColors = null;
        
        this.elements.fileInput.value = '';
        this.elements.previewImg.src = '';
        this.elements.previewSection.style.display = 'none';
        this.elements.basicInfo.innerHTML = '';
        this.elements.exifInfo.innerHTML = '';
        this.elements.gpsInfo.innerHTML = '';
        this.elements.palette.innerHTML = '';
        this.elements.colorCodes.innerHTML = '';
        this.elements.gpsWarning.style.display = 'none';
        this.elements.gpsCard.style.display = 'none';
        this.elements.exifCard.style.display = 'none';
        this.elements.downloadJson.disabled = true;
        this.elements.downloadTxt.disabled = true;
        
        this.hideSecurityNotice();
    },
    
    showLoading(show) {
        this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    },
    
    showSecurityNotice(message) {
        this.elements.securityMessage.textContent = message;
        this.elements.securityNotice.style.display = 'flex';
    },
    
    hideSecurityNotice() {
        this.elements.securityNotice.style.display = 'none';
    }
};

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});