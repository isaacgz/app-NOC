import { Request, Response } from 'express';
import { MultiServiceMonitor } from '../services/multi-service-monitor';

/**
 * Controlador de la API del Dashboard
 * Expone endpoints REST para consultar el estado del monitoreo
 */
export class DashboardController {
    constructor(private readonly monitor: MultiServiceMonitor) {}

    /**
     * GET /api/overview
     * Obtiene una vista general del sistema
     */
    getOverview = (req: Request, res: Response): void => {
        try {
            const stats = this.monitor.getAllStatistics();
            const totalServices = stats.length;
            const servicesUp = stats.filter(s => s.lastStatus === 'up').length;
            const servicesDown = stats.filter(s => s.lastStatus === 'down').length;
            const servicesDegraded = stats.filter(s => s.lastStatus === 'degraded').length;

            // Calcular uptime general
            const totalUptime = stats.reduce((sum, s) => sum + s.uptime, 0);
            const averageUptime = totalServices > 0 ? totalUptime / totalServices : 100;

            // Calcular tiempo de respuesta promedio
            const totalResponseTime = stats.reduce((sum, s) => sum + s.averageResponseTime, 0);
            const averageResponseTime = totalServices > 0 ? totalResponseTime / totalServices : 0;

            // Total de checks
            const totalChecks = stats.reduce((sum, s) => sum + s.totalChecks, 0);
            const totalFailures = stats.reduce((sum, s) => sum + s.failedChecks, 0);

            res.json({
                success: true,
                data: {
                    totalServices,
                    servicesUp,
                    servicesDown,
                    servicesDegraded,
                    averageUptime: parseFloat(averageUptime.toFixed(2)),
                    averageResponseTime: parseFloat(averageResponseTime.toFixed(0)),
                    totalChecks,
                    totalFailures,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    /**
     * GET /api/services
     * Obtiene lista de todos los servicios con su estado actual
     */
    getServices = (req: Request, res: Response): void => {
        try {
            const stats = this.monitor.getAllStatistics();

            const services = stats.map(stat => ({
                id: stat.serviceId,
                name: stat.serviceName,
                status: stat.lastStatus,
                uptime: parseFloat(stat.uptime.toFixed(2)),
                totalChecks: stat.totalChecks,
                successfulChecks: stat.successfulChecks,
                failedChecks: stat.failedChecks,
                averageResponseTime: parseFloat(stat.averageResponseTime.toFixed(0)),
                minResponseTime: stat.minResponseTime === Infinity ? 0 : stat.minResponseTime,
                maxResponseTime: stat.maxResponseTime,
                lastCheck: stat.lastCheck?.toISOString(),
                lastDowntime: stat.lastDowntime?.toISOString(),
                lastDowntimeDuration: stat.lastDowntimeDuration,
            }));

            res.json({
                success: true,
                data: services,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    /**
     * GET /api/services/:id
     * Obtiene detalles de un servicio específico
     */
    getServiceById = (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            const stat = this.monitor.getServiceStatistics(id);

            if (!stat) {
                res.status(404).json({
                    success: false,
                    error: `Service with id '${id}' not found`,
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    id: stat.serviceId,
                    name: stat.serviceName,
                    status: stat.lastStatus,
                    uptime: parseFloat(stat.uptime.toFixed(2)),
                    totalChecks: stat.totalChecks,
                    successfulChecks: stat.successfulChecks,
                    failedChecks: stat.failedChecks,
                    averageResponseTime: parseFloat(stat.averageResponseTime.toFixed(0)),
                    minResponseTime: stat.minResponseTime === Infinity ? 0 : stat.minResponseTime,
                    maxResponseTime: stat.maxResponseTime,
                    lastCheck: stat.lastCheck?.toISOString(),
                    lastDowntime: stat.lastDowntime?.toISOString(),
                    lastDowntimeDuration: stat.lastDowntimeDuration,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    /**
     * GET /api/services/:id/history
     * Obtiene historial de checks de un servicio
     */
    getServiceHistory = (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

            const history = this.monitor.getServiceHistory(id, limit);

            if (!history || history.length === 0) {
                res.json({
                    success: true,
                    data: [],
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            const formattedHistory = history.map(check => ({
                serviceId: check.serviceId,
                serviceName: check.serviceName,
                url: check.url,
                success: check.success,
                status: check.status,
                responseTime: check.responseTime,
                statusCode: check.statusCode,
                timestamp: check.timestamp.toISOString(),
                message: check.message,
                error: check.error,
            }));

            res.json({
                success: true,
                data: formattedHistory,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    /**
     * GET /api/services/:id/stats
     * Obtiene estadísticas detalladas de un servicio
     */
    getServiceStats = (req: Request, res: Response): void => {
        try {
            const { id } = req.params;
            const stat = this.monitor.getServiceStatistics(id);

            if (!stat) {
                res.status(404).json({
                    success: false,
                    error: `Service with id '${id}' not found`,
                });
                return;
            }

            // Obtener historial para análisis
            const history = this.monitor.getServiceHistory(id, 100);

            // Calcular estadísticas adicionales
            const recentHistory = history.slice(-20); // Últimos 20 checks
            const recentUptime = recentHistory.length > 0
                ? (recentHistory.filter(h => h.success).length / recentHistory.length) * 100
                : 100;

            // Distribución de tiempos de respuesta
            const responseTimes = history
                .filter(h => h.responseTime !== undefined)
                .map(h => h.responseTime!);

            const responseTimeDistribution = {
                fast: responseTimes.filter(t => t < 200).length,
                normal: responseTimes.filter(t => t >= 200 && t < 500).length,
                slow: responseTimes.filter(t => t >= 500 && t < 1000).length,
                verySlow: responseTimes.filter(t => t >= 1000).length,
            };

            res.json({
                success: true,
                data: {
                    service: {
                        id: stat.serviceId,
                        name: stat.serviceName,
                        status: stat.lastStatus,
                    },
                    uptime: {
                        overall: parseFloat(stat.uptime.toFixed(2)),
                        recent: parseFloat(recentUptime.toFixed(2)),
                    },
                    checks: {
                        total: stat.totalChecks,
                        successful: stat.successfulChecks,
                        failed: stat.failedChecks,
                    },
                    responseTime: {
                        average: parseFloat(stat.averageResponseTime.toFixed(0)),
                        min: stat.minResponseTime === Infinity ? 0 : stat.minResponseTime,
                        max: stat.maxResponseTime,
                        distribution: responseTimeDistribution,
                    },
                    lastCheck: stat.lastCheck?.toISOString(),
                    lastDowntime: stat.lastDowntime?.toISOString(),
                    lastDowntimeDuration: stat.lastDowntimeDuration,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    /**
     * GET /api/health
     * Health check del dashboard
     */
    getHealth = (req: Request, res: Response): void => {
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
        });
    };
}
