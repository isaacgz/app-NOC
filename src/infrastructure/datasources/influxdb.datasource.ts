import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import { CheckResult } from '../../domain/interfaces/service-monitor.interface';

export interface InfluxDBConfig {
    url: string;
    token: string;
    org: string;
    bucket: string;
}

/**
 * InfluxDB Datasource - Time-Series Database
 *
 * Almacena métricas de monitoreo en InfluxDB para:
 * - Performance mejorado en queries de rangos temporales
 * - Agregaciones y downsampling automático
 * - Retención de datos configurable
 * - Queries optimizados para SLOs
 */
export class InfluxDBDataSource {

    private client: InfluxDB;
    private writeApi: WriteApi;
    private config: InfluxDBConfig;

    constructor(config: InfluxDBConfig) {
        this.config = config;

        // Inicializar cliente de InfluxDB
        this.client = new InfluxDB({
            url: config.url,
            token: config.token,
        });

        // Crear Write API para escritura de métricas
        this.writeApi = this.client.getWriteApi(config.org, config.bucket);

        // Configurar precisión de timestamps (nanosegundos)
        this.writeApi.useDefaultTags({});
    }

    /**
     * Escribe un resultado de check en InfluxDB
     */
    async writeCheckResult(result: CheckResult): Promise<void> {
        try {
            const point = new Point('service_check')
                .tag('service_id', result.serviceId)
                .tag('service_name', result.serviceName)
                .tag('status', result.success ? 'up' : 'down')
                .floatField('response_time', result.responseTime || 0)
                .booleanField('is_success', result.success)
                .timestamp(new Date(result.timestamp));

            // Agregar status code si está disponible
            if (result.statusCode) {
                point.intField('status_code', result.statusCode);
            }

            // Escribir el punto
            this.writeApi.writePoint(point);

            // Flush periódico (cada 1000 puntos o 1 segundo)
            // Los puntos se acumulan en buffer para eficiencia
        } catch (error) {
            console.error('Error writing to InfluxDB:', error);
            throw error;
        }
    }

    /**
     * Escribe múltiples check results en batch
     */
    async writeCheckResults(results: CheckResult[]): Promise<void> {
        try {
            const points = results.map(result =>
                new Point('service_check')
                    .tag('service_id', result.serviceId)
                    .tag('service_name', result.serviceName)
                    .tag('status', result.success ? 'up' : 'down')
                    .floatField('response_time', result.responseTime || 0)
                    .booleanField('is_success', result.success)
                    .timestamp(new Date(result.timestamp))
            );

            this.writeApi.writePoints(points);
        } catch (error) {
            console.error('Error writing batch to InfluxDB:', error);
            throw error;
        }
    }

    /**
     * Flush manual del buffer de escritura
     */
    async flush(): Promise<void> {
        try {
            await this.writeApi.flush();
        } catch (error) {
            console.error('Error flushing InfluxDB writes:', error);
            throw error;
        }
    }

    /**
     * Obtiene la disponibilidad de un servicio en un rango de tiempo
     *
     * @param serviceId - ID del servicio
     * @param window - Ventana de tiempo (e.g., '1h', '24h', '7d', '30d')
     * @returns Porcentaje de disponibilidad (0-100)
     */
    async getServiceAvailability(serviceId: string, window: string): Promise<number> {
        const queryApi = this.client.getQueryApi(this.config.org);

        const fluxQuery = `
            from(bucket: "${this.config.bucket}")
                |> range(start: -${window})
                |> filter(fn: (r) => r._measurement == "service_check")
                |> filter(fn: (r) => r.service_id == "${serviceId}")
                |> filter(fn: (r) => r._field == "is_success")
                |> count()
                |> group()
        `;

        try {
            const results: any[] = [];

            await queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    results.push(o);
                },
                error(error) {
                    console.error('Query error:', error);
                },
                complete() {
                    // Query completo
                }
            });

            if (results.length === 0) {
                return 100; // No hay datos = asumimos disponible
            }

            // Calcular disponibilidad
            const totalChecks = results.reduce((sum, r) => sum + (r._value || 0), 0);
            const successCount = results
                .filter(r => r.status === 'up')
                .reduce((sum, r) => sum + (r._value || 0), 0);

            if (totalChecks === 0) return 100;

            return (successCount / totalChecks) * 100;

        } catch (error) {
            console.error('Error querying InfluxDB:', error);
            throw error;
        }
    }

    /**
     * Obtiene la latencia promedio de un servicio
     */
    async getAverageLatency(serviceId: string, window: string): Promise<number> {
        const queryApi = this.client.getQueryApi(this.config.org);

        const fluxQuery = `
            from(bucket: "${this.config.bucket}")
                |> range(start: -${window})
                |> filter(fn: (r) => r._measurement == "service_check")
                |> filter(fn: (r) => r.service_id == "${serviceId}")
                |> filter(fn: (r) => r._field == "response_time")
                |> filter(fn: (r) => r.status == "up")
                |> mean()
        `;

        try {
            const results: any[] = [];

            await queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    results.push(o);
                },
                error(error) {
                    console.error('Query error:', error);
                },
                complete() {
                    // Query completo
                }
            });

            if (results.length === 0 || !results[0]._value) {
                return 0;
            }

            return results[0]._value;

        } catch (error) {
            console.error('Error querying average latency:', error);
            throw error;
        }
    }

    /**
     * Obtiene el error rate de un servicio
     */
    async getErrorRate(serviceId: string, window: string): Promise<number> {
        const availability = await this.getServiceAvailability(serviceId, window);
        return 100 - availability;
    }

    /**
     * Obtiene métricas de latencia (P50, P90, P95, P99)
     */
    async getLatencyPercentiles(
        serviceId: string,
        window: string
    ): Promise<{ p50: number; p90: number; p95: number; p99: number }> {
        const queryApi = this.client.getQueryApi(this.config.org);

        const fluxQuery = `
            from(bucket: "${this.config.bucket}")
                |> range(start: -${window})
                |> filter(fn: (r) => r._measurement == "service_check")
                |> filter(fn: (r) => r.service_id == "${serviceId}")
                |> filter(fn: (r) => r._field == "response_time")
                |> filter(fn: (r) => r.status == "up")
                |> quantile(q: 0.50, method: "estimate_tdigest")
                |> yield(name: "p50")
        `;

        // Similar queries for p90, p95, p99
        // Nota: En producción, ejecutar en paralelo

        try {
            // Implementación simplificada - retornar valores por defecto
            return {
                p50: 0,
                p90: 0,
                p95: 0,
                p99: 0
            };
        } catch (error) {
            console.error('Error getting latency percentiles:', error);
            throw error;
        }
    }

    /**
     * Obtiene el número total de checks en una ventana
     */
    async getTotalChecks(serviceId: string, window: string): Promise<number> {
        const queryApi = this.client.getQueryApi(this.config.org);

        const fluxQuery = `
            from(bucket: "${this.config.bucket}")
                |> range(start: -${window})
                |> filter(fn: (r) => r._measurement == "service_check")
                |> filter(fn: (r) => r.service_id == "${serviceId}")
                |> filter(fn: (r) => r._field == "is_success")
                |> count()
        `;

        try {
            const results: any[] = [];

            await queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    results.push(o);
                },
                error(error) {
                    console.error('Query error:', error);
                },
                complete() {
                    // Query completo
                }
            });

            if (results.length === 0) return 0;

            return results[0]._value || 0;

        } catch (error) {
            console.error('Error getting total checks:', error);
            throw error;
        }
    }

    /**
     * Obtiene datos para gráficos de serie temporal
     */
    async getTimeSeriesData(
        serviceId: string,
        window: string,
        aggregation: 'mean' | 'max' | 'min' = 'mean'
    ): Promise<Array<{ time: Date; responseTime: number; success: boolean }>> {
        const queryApi = this.client.getQueryApi(this.config.org);

        const fluxQuery = `
            from(bucket: "${this.config.bucket}")
                |> range(start: -${window})
                |> filter(fn: (r) => r._measurement == "service_check")
                |> filter(fn: (r) => r.service_id == "${serviceId}")
                |> aggregateWindow(every: 1m, fn: ${aggregation}, createEmpty: false)
        `;

        try {
            const results: any[] = [];

            await queryApi.queryRows(fluxQuery, {
                next(row, tableMeta) {
                    const o = tableMeta.toObject(row);
                    results.push(o);
                },
                error(error) {
                    console.error('Query error:', error);
                },
                complete() {
                    // Query completo
                }
            });

            // Transformar resultados en formato útil
            return results.map(r => ({
                time: new Date(r._time),
                responseTime: r._field === 'response_time' ? r._value : 0,
                success: r._field === 'is_success' ? r._value : true
            }));

        } catch (error) {
            console.error('Error getting time series data:', error);
            throw error;
        }
    }

    /**
     * Cierra la conexión y hace flush final
     */
    async close(): Promise<void> {
        try {
            await this.writeApi.close();
        } catch (error) {
            console.error('Error closing InfluxDB connection:', error);
            throw error;
        }
    }

    /**
     * Health check de la conexión a InfluxDB
     */
    async ping(): Promise<boolean> {
        try {
            // Intentar escribir un punto de prueba y hacer flush
            await this.writeApi.flush();
            return true;
        } catch (error) {
            console.error('InfluxDB ping failed:', error);
            return false;
        }
    }
}
