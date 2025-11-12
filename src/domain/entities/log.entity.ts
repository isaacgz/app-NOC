
export enum LogSeverityLevel {
    low = 'low',
    medium = 'medium',
    high = 'high'
}

export interface LogEntityOptions {
    level: LogSeverityLevel;
    message: string;
    origin: string;
    createdAt?: Date;
    // Nuevas métricas de performance
    responseTime?: number;      // Tiempo de respuesta en ms
    statusCode?: number;         // Código HTTP de respuesta
    serviceId?: string;          // ID del servicio monitoreado
    serviceName?: string;        // Nombre del servicio
    url?: string;                // URL chequeada
}


export class LogEntity {

    public level: LogSeverityLevel;
    public message: string;
    public createdAt: Date;
    public origin: string;
    // Nuevas propiedades para métricas de performance
    public responseTime?: number;
    public statusCode?: number;
    public serviceId?: string;
    public serviceName?: string;
    public url?: string;

    constructor( options: LogEntityOptions ){
        const {
            message,
            level,
            origin,
            createdAt = new Date(),
            responseTime,
            statusCode,
            serviceId,
            serviceName,
            url
        } = options;

        this.message = message;
        this.level = level;
        this.createdAt = createdAt;
        this.origin = origin;
        this.responseTime = responseTime;
        this.statusCode = statusCode;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.url = url;
    }

    static fromJson = (json:string):LogEntity => {
        const {
            message,
            level,
            createdAt,
            origin,
            responseTime,
            statusCode,
            serviceId,
            serviceName,
            url
        } = JSON.parse(json);

        const log = new LogEntity({
            message,
            level,
            createdAt,
            origin,
            responseTime,
            statusCode,
            serviceId,
            serviceName,
            url
        });

        return log;

        // if ( !message ) throw new Error('Message is required');
    }

}


