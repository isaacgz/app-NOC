import { LogEntity, LogSeverityLevel } from "../../entities/log.entity";
import { LogRepository } from "../../repository/log.repository";
import {
    CheckResult,
    HealthCheckConfig,
    HttpMethod,
    ServiceStatus,
} from "../../interfaces/service-monitor.interface";

/**
 * Servicio mejorado de chequeo de servicios
 * Incluye:
 * - Medición de tiempo de respuesta
 * - Health checks avanzados con validación
 * - Soporte para múltiples métodos HTTP
 * - Validación de contenido de respuesta
 */
export class CheckServiceAdvanced {
    constructor(
        private readonly logRepository: LogRepository,
        private readonly successCallback?: (result: CheckResult) => void,
        private readonly errorCallback?: (result: CheckResult) => void
    ) {}

    /**
     * Ejecuta un chequeo de servicio con configuración avanzada
     */
    public async execute(
        serviceId: string,
        serviceName: string,
        url: string,
        config?: HealthCheckConfig
    ): Promise<CheckResult> {
        const startTime = Date.now();

        try {
            // Configuración por defecto
            const method: HttpMethod = config?.method || 'GET';
            const timeout = config?.timeout || 5000;
            const headers = config?.headers || {};
            const body = config?.body;
            const followRedirects = config?.followRedirects !== false;

            // Configurar AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // Preparar opciones del fetch
            const fetchOptions: RequestInit = {
                method,
                headers: {
                    'User-Agent': 'NOC-Monitor/1.0',
                    ...headers,
                },
                signal: controller.signal,
                redirect: followRedirects ? 'follow' : 'manual',
            };

            // Agregar body si es necesario
            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
                if (!headers['Content-Type']) {
                    fetchOptions.headers = {
                        ...fetchOptions.headers,
                        'Content-Type': 'application/json',
                    };
                }
            }

            // Realizar el request
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            // Calcular tiempo de respuesta
            const responseTime = Date.now() - startTime;
            const statusCode = response.status;

            // Validar respuesta
            const validationResult = await this.validateResponse(
                response,
                responseTime,
                config?.expectedResponse
            );

            // Determinar si el servicio está OK
            const isOk = validationResult.isValid;
            const status: ServiceStatus = isOk ? 'up' : 'degraded';

            // Crear resultado del chequeo
            const checkResult: CheckResult = {
                serviceId,
                serviceName,
                url,
                success: isOk,
                status,
                responseTime,
                statusCode,
                timestamp: new Date(),
                message: isOk
                    ? `Service ${serviceName} is UP - ${responseTime}ms (${statusCode})`
                    : `Service ${serviceName} validation failed: ${validationResult.errors.join(', ')}`,
                metadata: {
                    method,
                    validationPassed: validationResult.isValid,
                    validationErrors: validationResult.errors,
                },
            };

            // Determinar nivel de severidad del log
            const logLevel = this.determineLogLevel(isOk, responseTime, config?.expectedResponse?.maxResponseTime);

            // Crear y guardar log
            const log = new LogEntity({
                message: checkResult.message,
                level: logLevel,
                origin: 'check-service-advanced.ts',
                responseTime,
                statusCode,
                serviceId,
                serviceName,
                url,
            });

            await this.logRepository.saveLog(log);

            // Ejecutar callback apropiado
            if (isOk) {
                this.successCallback?.(checkResult);
            } else {
                this.errorCallback?.(checkResult);
            }

            return checkResult;

        } catch (error) {
            // Calcular tiempo hasta el error
            const responseTime = Date.now() - startTime;

            // Determinar tipo de error
            const errorMessage = this.getErrorMessage(error);
            const isTimeout = error instanceof Error && error.name === 'AbortError';

            const checkResult: CheckResult = {
                serviceId,
                serviceName,
                url,
                success: false,
                status: 'down',
                responseTime,
                timestamp: new Date(),
                message: `Service ${serviceName} is DOWN: ${errorMessage}`,
                error: errorMessage,
                metadata: {
                    method: config?.method || 'GET',
                },
            };

            // Crear log de error
            const log = new LogEntity({
                message: checkResult.message,
                level: LogSeverityLevel.high,
                origin: 'check-service-advanced.ts',
                responseTime,
                serviceId,
                serviceName,
                url,
            });

            await this.logRepository.saveLog(log);

            // Ejecutar callback de error
            this.errorCallback?.(checkResult);

            return checkResult;
        }
    }

    /**
     * Valida la respuesta del servicio según la configuración
     */
    private async validateResponse(
        response: Response,
        responseTime: number,
        expectedResponse?: {
            statusCode?: number;
            acceptedStatusCodes?: number[];
            bodyContains?: string;
            requiredHeaders?: string[];
            maxResponseTime?: number;
        }
    ): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        if (!expectedResponse) {
            // Sin configuración específica, solo validar que la respuesta sea OK
            if (!response.ok) {
                errors.push(`HTTP ${response.status} ${response.statusText}`);
            }
            return { isValid: errors.length === 0, errors };
        }

        // Validar código de estado
        if (expectedResponse.statusCode !== undefined) {
            if (response.status !== expectedResponse.statusCode) {
                errors.push(
                    `Expected status ${expectedResponse.statusCode}, got ${response.status}`
                );
            }
        } else if (expectedResponse.acceptedStatusCodes) {
            if (!expectedResponse.acceptedStatusCodes.includes(response.status)) {
                errors.push(
                    `Status ${response.status} not in accepted codes: ${expectedResponse.acceptedStatusCodes.join(', ')}`
                );
            }
        } else if (!response.ok) {
            errors.push(`HTTP ${response.status} ${response.statusText}`);
        }

        // Validar tiempo de respuesta
        if (
            expectedResponse.maxResponseTime !== undefined &&
            responseTime > expectedResponse.maxResponseTime
        ) {
            errors.push(
                `Response time ${responseTime}ms exceeds maximum ${expectedResponse.maxResponseTime}ms`
            );
        }

        // Validar headers requeridos
        if (expectedResponse.requiredHeaders) {
            for (const header of expectedResponse.requiredHeaders) {
                if (!response.headers.has(header)) {
                    errors.push(`Missing required header: ${header}`);
                }
            }
        }

        // Validar contenido del body
        if (expectedResponse.bodyContains) {
            try {
                const text = await response.text();
                if (!text.includes(expectedResponse.bodyContains)) {
                    errors.push(
                        `Response body does not contain expected text: "${expectedResponse.bodyContains}"`
                    );
                }
            } catch (error) {
                errors.push(`Failed to read response body: ${error}`);
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * Determina el nivel de severidad del log basado en el resultado
     */
    private determineLogLevel(
        isOk: boolean,
        responseTime: number,
        maxResponseTime?: number
    ): LogSeverityLevel {
        if (!isOk) {
            return LogSeverityLevel.high;
        }

        // Si el tiempo de respuesta excede el 80% del máximo, es medium
        if (maxResponseTime && responseTime > maxResponseTime * 0.8) {
            return LogSeverityLevel.medium;
        }

        return LogSeverityLevel.low;
    }

    /**
     * Extrae un mensaje de error legible
     */
    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return 'Request timeout';
            }
            return error.message;
        }
        return String(error);
    }
}
