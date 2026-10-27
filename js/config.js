// Configuración de la aplicación
const CONFIG = {
    // Límites de seguridad
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    
    // Magic numbers para validación
    MAGIC_NUMBERS: {
        'image/jpeg': ['FFD8FF'],
        'image/png': ['89504E47'],
        'image/webp': ['52494646'] // RIFF
    },
    
    // Campos EXIF a extraer
    EXIF_FIELDS: {
        basic: [
            { key: 'Make', label: 'Marca' },
            { key: 'Model', label: 'Modelo' },
            { key: 'DateTimeOriginal', label: 'Fecha de captura' },
            { key: 'Software', label: 'Software' }
        ],
        camera: [
            { key: 'ExposureTime', label: 'Velocidad' },
            { key: 'FNumber', label: 'Apertura' },
            { key: 'ISO', label: 'ISO' },
            { key: 'FocalLength', label: 'Distancia focal' },
            { key: 'LensModel', label: 'Lente' }
        ],
        gps: [
            { key: 'GPSLatitude', label: 'Latitud' },
            { key: 'GPSLongitude', label: 'Longitud' },
            { key: 'GPSAltitude', label: 'Altitud' }
        ]
    },
    
    // Colores a extraer
    COLOR_COUNT: 6,
    
    // Mensajes
    MESSAGES: {
        invalidType: 'Tipo de archivo no permitido',
        fileTooLarge: 'El archivo excede el tamaño máximo (10MB)',
        invalidFile: 'El archivo parece estar corrupto o no es una imagen válida',
        noExif: 'No se encontraron metadatos EXIF',
        processing: 'Procesando imagen...',
        gpsWarning: '⚠️ Esta imagen contiene datos de ubicación GPS'
    }
};

// Congelar configuración para evitar modificaciones
Object.freeze(CONFIG);
Object.freeze(CONFIG.MESSAGES);