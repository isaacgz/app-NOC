/**
 * Interfaces para Detección de Patrones y Análisis - Fase 4
 */

/**
 * Tipo de patrón detectado
 */
export type PatternType =
    | 'progressive_degradation'      // Response time aumentando
    | 'intermittent_failures'        // Fallos esporádicos
    | 'recurring_downtime'           // Caídas en horarios específicos
    | 'cascade_failure'              // Fallo en cadena de servicios
    | 'performance_spike'            // Pico de latencia
    | 'recovery_pattern';            // Patrón de recuperación

/**
 * Severidad del patrón
 */
export type PatternSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Patrón detectado
 */
export interface DetectedPattern {
    /** ID único del patrón */
    id: string;

    /** Tipo de patrón */
    type: PatternType;

    /** Severidad */
    severity: PatternSeverity;

    /** ID del servicio afectado */
    serviceId: string;

    /** Nombre del servicio */
    serviceName: string;

    /** Descripción del patrón */
    description: string;

    /** Timestamp de detección */
    detectedAt: Date;

    /** Datos del patrón */
    data: {
        /** Ventana de tiempo analizada */
        timeWindowMinutes: number;

        /** Número de eventos analizados */
        eventsAnalyzed: number;

        /** Confianza en la detección (0-100) */
        confidence: number;

        /** Datos específicos del patrón */
        details: any;
    };

    /** Recomendaciones */
    recommendations: string[];

    /** Si ya se notificó */
    notified: boolean;
}

/**
 * Tendencia de métricas
 */
export interface MetricTrend {
    /** ID del servicio */
    serviceId: string;

    /** Métrica analizada */
    metric: 'responseTime' | 'uptime' | 'errorRate';

    /** Dirección de la tendencia */
    direction: 'increasing' | 'decreasing' | 'stable';

    /** Tasa de cambio (porcentaje) */
    changeRate: number;

    /** Ventana de tiempo analizada */
    timeWindowMinutes: number;

    /** Valor actual */
    currentValue: number;

    /** Valor anterior */
    previousValue: number;

    /** Predicción para próxima ventana */
    prediction?: number;

    /** Nivel de preocupación */
    concernLevel: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Configuración de detección de patrones
 */
export interface PatternDetectionConfig {
    /** Habilitar detección de patrones */
    enabled: boolean;

    /** Intervalo de análisis en minutos */
    analysisIntervalMinutes: number;

    /** Ventana de tiempo para análisis en minutos */
    timeWindowMinutes: number;

    /** Umbral de confianza mínima (0-100) */
    confidenceThreshold: number;

    /** Patrones a detectar */
    enabledPatterns: PatternType[];

    /** Notificar automáticamente patrones detectados */
    autoNotify: boolean;
}

/**
 * Análisis de correlación entre servicios
 */
export interface ServiceCorrelation {
    /** ID del servicio primario */
    primaryServiceId: string;

    /** ID del servicio correlacionado */
    correlatedServiceId: string;

    /** Fuerza de la correlación (0-1) */
    correlationStrength: number;

    /** Tipo de correlación */
    correlationType: 'causation' | 'dependency' | 'coincidence';

    /** Descripción */
    description: string;

    /** Timestamp de detección */
    detectedAt: Date;
}

/**
 * Predicción de caída
 */
export interface DowntimePrediction {
    /** ID del servicio */
    serviceId: string;

    /** Probabilidad de caída (0-100) */
    probability: number;

    /** Tiempo estimado hasta la caída */
    estimatedTimeToFailure?: {
        value: number;
        unit: 'minutes' | 'hours' | 'days';
    };

    /** Factores contribuyentes */
    factors: Array<{
        factor: string;
        weight: number;
    }>;

    /** Recomendaciones preventivas */
    preventiveMeasures: string[];

    /** Timestamp de la predicción */
    predictedAt: Date;
}

/**
 * Estadísticas de análisis
 */
export interface AnalysisStatistics {
    /** Total de patrones detectados */
    totalPatternsDetected: number;

    /** Patrones por tipo */
    patternsByType: Record<PatternType, number>;

    /** Predicciones correctas */
    correctPredictions: number;

    /** Predicciones totales */
    totalPredictions: number;

    /** Precisión del análisis (%) */
    accuracy: number;

    /** Última actualización */
    lastAnalysis: Date;
}
