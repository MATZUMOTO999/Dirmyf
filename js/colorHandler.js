// Manejador de extracción de colores
const ColorHandler = {
    /**
     * Extrae la paleta de colores de una imagen
     */
    extractPalette(imgElement) {
        try {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(imgElement, CONFIG.COLOR_COUNT);
            return palette;
        } catch (error) {
            console.error('Error extrayendo colores:', error);
            return [];
        }
    },

    /**
     * Convierte RGB a HEX
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    },

    /**
     * Convierte RGB a string CSS
     */
    rgbToString(r, g, b) {
        return `rgb(${r}, ${g}, ${b})`;
    },

    /**
     * Obtiene el contraste de un color (claro u oscuro)
     */
    getContrastColor(r, g, b) {
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? '#000000' : '#FFFFFF';
    },

    /**
     * Genera HTML para la paleta de colores
     */
    generatePaletteHTML(palette) {
        if (!palette || palette.length === 0) {
            return '<p class="no-data">No se pudo extraer la paleta de colores</p>';
        }
        
        let swatchesHTML = '';
        let codesHTML = '';
        
        palette.forEach(([r, g, b]) => {
            const hex = this.rgbToHex(r, g, b);
            const rgb = this.rgbToString(r, g, b);
            const contrast = this.getContrastColor(r, g, b);
            
            swatchesHTML += `
                <div class="color-swatch" 
                     style="background-color: ${rgb}" 
                     data-color="${hex}"
                     title="${rgb}">
                </div>
            `;
            
            codesHTML += `
                <div class="color-code" style="background-color: ${rgb}; color: ${contrast}">
                    <span class="color-code-hex">${hex}</span>
                    <span class="color-code-rgb">${rgb}</span>
                </div>
            `;
        });
        
        return {
            swatches: swatchesHTML,
            codes: codesHTML
        };
    },

    /**
     * Copia el color al portapapeles
     */
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Mostrar notificación temporal
            this.showNotification('Color copiado al portapapeles');
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
    },

    /**
     * Muestra notificación temporal
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
};