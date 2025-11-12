import { InfluxDBDataSource } from '../../infrastructure/datasources/influxdb.datasource';
import { CheckResult } from '../interfaces/service-monitor.interface';

/**
 * Metrics Storage Service
 *
 * Servicio de dominio para almacenar métricas en InfluxDB.
 * Proporciona una capa de abstracción entre la lógica de negocio
 * y el datasource de InfluxDB.
 */
export class MetricsStorageService {

    private influxDB: InfluxDBDataSource;
    private writeBuffer: CheckResult[] = [];
    private bufferSize: number = 100;
    private flushInterval: NodeJS.Timeout | null = null;

    constructor(influxDB: InfluxDBDataSource, bufferSize: number = 100) {
        this.influxDB = influxDB;
        this.bufferSize = bufferSize;

        // Auto-flush cada 5 segundos
        this.startAutoFlush();
    }

    /**
     * Almacena un resultado de check
     *
     * @param result - Resultado del check
     */
    async storeCheckResult(result: CheckResult): Promise<void> {
        try {
            // Agregar al buffer
            this.writeBuffer.push(result);

            // Si el buffer está lleno, hacer flush
            if (this.writeBuffer.length >= this.bufferSize) {
                await this.flush();
            }
        } catch (error) {
            console.error('Error storing check result:', error);
            // No lanzar error - no queremos que falle el monitoreo si falla InfluxDB
        }
    }

    /**
     * Almacena múltiples resultados de checks
     */
    async storeCheckResults(results: CheckResult[]): Promise<void> {
        try {
            this.writeBuffer.push(...results);

            if (this.writeBuffer.length >= this.bufferSize) {
                await this.flush();
            }
        } catch (error) {
            console.error('Error storing check results:', error);
        }
    }

    /**
     * Hace flush del buffer a InfluxDB
     */
    private async flush(): Promise<void> {
        if (this.writeBuffer.length === 0) return;

        try {
            const toWrite = [...this.writeBuffer];
            this.writeBuffer = [];

            await this.influxDB.writeCheckResults(toWrite);
            await this.influxDB.flush();

            console.log(`✅ Flushed ${toWrite.length} metrics to InfluxDB`);
        } catch (error) {
            console.error('Error flushing to InfluxDB:', error);
            // Recuperar datos en el buffer si falla
            // this.writeBuffer.unshift(...toWrite);
        }
    }

    /**
     * Inicia el auto-flush periódico
     */
    private startAutoFlush(): void {
        this.flushInterval = setInterval(async () => {
            await this.flush();
        }, 5000); // cada 5 segundos
    }

    /**
     * Detiene el servicio y hace flush final
     */
    async stop(): Promise<void> {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }

        await this.flush();
        await this.influxDB.close();
    }

    /**
     * Obtiene métricas de disponibilidad de un servicio
     */
    async getServiceAvailability(serviceId: string, window: string): Promise<number> {
        return await this.influxDB.getServiceAvailability(serviceId, window);
    }

    /**
     * Obtiene latencia promedio de un servicio
     */
    async getAverageLatency(serviceId: string, window: string): Promise<number> {
        return await this.influxDB.getAverageLatency(serviceId, window);
    }

    /**
     * Obtiene error rate de un servicio
     */
    async getErrorRate(serviceId: string, window: string): Promise<number> {
        return await this.influxDB.getErrorRate(serviceId, window);
    }

    /**
     * Obtiene percentiles de latencia
     */
    async getLatencyPercentiles(serviceId: string, window: string) {
        return await this.influxDB.getLatencyPercentiles(serviceId, window);
    }

    /**
     * Obtiene datos de serie temporal para gráficos
     */
    async getTimeSeriesData(
        serviceId: string,
        window: string,
        aggregation: 'mean' | 'max' | 'min' = 'mean'
    ) {
        return await this.influxDB.getTimeSeriesData(serviceId, window, aggregation);
    }

    /**
     * Health check del servicio
     */
    async healthCheck(): Promise<boolean> {
        return await this.influxDB.ping();
    }
}
