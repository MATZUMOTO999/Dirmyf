// Manejador de metadatos EXIF
const EXIFHandler = {
    /**
     * Extrae todos los metadatos EXIF de un archivo
     */
    async extract(file) {
        try {
            const exif = await exifr.parse(file, {
                merge: true,
                translateValues: true,
                userComment: true,
                jfif: true,
                iptc: true,
                xmp: true
            });
            
            return exif ? Validators.sanitizeEXIF(exif) : null;
        } catch (error) {
            console.error('Error extrayendo EXIF:', error);
            return null;
        }
    },

    /**
     * Formatea valores EXIF para visualización
     */
    formatValue(key, value) {
        if (value === undefined || value === null) return null;
        
        // GPS
        if (key === 'GPSLatitude' || key === 'GPSLongitude') {
            if (Array.isArray(value)) {
                const decimal = value[0] + value[1]/60 + value[2]/3600;
                return `${decimal.toFixed(6)}°`;
            }
        }
        
        // Fecha
        if (key === 'DateTimeOriginal' || key === 'CreateDate' || key === 'ModifyDate') {
            try {
                return new Date(value).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch {
                return value;
            }
        }
        
        // Velocidad de obturación
        if (key === 'ExposureTime') {
            if (typeof value === 'number') {
                if (value < 1) {
                    return `1/${Math.round(1/value)}s`;
                }
                return `${value}s`;
            }
        }
        
        // Apertura
        if (key === 'FNumber') {
            return `f/${value}`;
        }
        
        // Distancia focal
        if (key === 'FocalLength') {
            return `${value}mm`;
        }
        
        // ISO
        if (key === 'ISO') {
            return `ISO ${value}`;
        }
        
        // Altitud GPS
        if (key === 'GPSAltitude') {
            return `${value.toFixed(1)}m`;
        }
        
        return value;
    },

    /**
     * Verifica si hay datos GPS
     */
    hasGPSData(exif) {
        return exif && (exif.GPSLatitude || exif.GPSLongitude);
    },

    /**
     * Obtiene coordenadas GPS en formato decimal
     */
    getGPSCoordinates(exif) {
        if (!exif || (!exif.GPSLatitude && !exif.GPSLongitude)) {
            return null;
        }
        
        const formatCoord = (value, ref) => {
            if (!Array.isArray(value)) return null;
            const decimal = value[0] + value[1]/60 + value[2]/3600;
            return ref === 'S' || ref === 'W' ? -decimal : decimal;
        };
        
        const lat = formatCoord(exif.GPSLatitude, exif.GPSLatitudeRef);
        const lon = formatCoord(exif.GPSLongitude, exif.GPSLongitudeRef);
        
        return { lat, lon };
    },

    /**
     * Genera HTML para mostrar datos EXIF
     */
    generateHTML(exif) {
        let html = '';
        const sections = ['basic', 'camera', 'gps'];
        
        for (const section of sections) {
            const fields = CONFIG.EXIF_FIELDS[section];
            let sectionHtml = '';
            
            for (const field of fields) {
                const value = this.formatValue(field.key, exif[field.key]);
                if (value !== null) {
                    sectionHtml += `
                        <div class="data-row">
                            <span class="data-label">${field.label}</span>
                            <span class="data-value">${value}</span>
                        </div>
                    `;
                }
            }
            
            if (sectionHtml) {
                html += sectionHtml;
            }
        }
        
        return html || `<p class="no-data">${CONFIG.MESSAGES.noExif}</p>`;
    }
};

