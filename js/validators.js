// Módulo de validación y seguridad
const Validators = {
    /**
     * Verifica el tipo MIME real del archivo usando magic numbers
     */
    async validateFileType(file) {
        const buffer = await file.slice(0, 12).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const hex = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join('');
        
        // Verificar contra magic numbers conocidos
        for (const [mimeType, signatures] of Object.entries(CONFIG.MAGIC_NUMBERS)) {
            if (signatures.some(sig => hex.startsWith(sig))) {
                return { valid: true, mimeType };
            }
        }
        
        return { valid: false, mimeType: null };
    },

    /**
     * Valida el tamaño del archivo
     */
    validateFileSize(file) {
        return file.size <= CONFIG.MAX_FILE_SIZE;
    },

    /**
     * Valida la extensión del archivo
     */
    validateExtension(filename) {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return CONFIG.ALLOWED_EXTENSIONS.includes(ext);
    },

    /**
     * Validación completa del archivo
     */
    async validateFile(file) {
        const errors = [];
        
        // Validar extensión
        if (!this.validateExtension(file.name)) {
            errors.push('Extensión de archivo no permitida');
        }
        
        // Validar tamaño
        if (!this.validateFileSize(file)) {
            errors.push(CONFIG.MESSAGES.fileTooLarge);
        }
        
        // Validar tipo MIME real
        const typeCheck = await this.validateFileType(file);
        if (!typeCheck.valid) {
            errors.push(CONFIG.MESSAGES.invalidFile);
        } else if (!CONFIG.ALLOWED_TYPES.includes(typeCheck.mimeType)) {
            errors.push(CONFIG.MESSAGES.invalidType);
        }
        
        return {
            valid: errors.length === 0,
            errors,
            mimeType: typeCheck.mimeType
        };
    },

    /**
     * Sanitiza datos EXIF para prevenir XSS
     */
    sanitizeEXIF(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sanitized = {};
        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ];
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                // Escapar HTML y remover scripts
                let clean = value
                    .replace(/[&<>"']/g, m => ({
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#039;'
                    }[m]));
                
                // Verificar patrones peligrosos
                if (dangerousPatterns.some(pattern => pattern.test(clean))) {
                    console.warn(`Campo EXIF peligroso detectado: ${key}`);
                    clean = '[DATO ELIMINADO POR SEGURIDAD]';
                }
                
                sanitized[key] = clean;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = value;
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(v => 
                    typeof v === 'string' ? this.sanitizeEXIF(v) : v
                );
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeEXIF(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    },

    /**
     * Genera un nombre de archivo seguro
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }
};