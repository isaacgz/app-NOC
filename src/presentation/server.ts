import { CheckService } from "../domain/use-cases/checks/check-service";
import { SenEmailLogs } from "../domain/use-cases/email/send-email-logs";
import { FileSystemDataSource } from "../infrastructure/datasources/file-system.datasource";
import { LogRepositoryImpl } from "../infrastructure/repositories/log.repository.impl";
import { CronService } from "./cron/cron-service";
import { EmailService } from "./email/email.service";
import { MultiServiceMonitor } from "./services/multi-service-monitor";
import { CheckResult } from "../domain/interfaces/service-monitor.interface";
import * as path from "path";

const fileSystemRepository  = new LogRepositoryImpl(
    new FileSystemDataSource()
)

const emailService = new EmailService();


export class Server {

    private static monitor: MultiServiceMonitor;

    public static async start(){

        console.log('\n🚀 NOC System Starting...\n');

        // ============================================================
        // SISTEMA DE MONITOREO AVANZADO - FASE 1
        // ============================================================
        // Monitoreo de múltiples servicios con:
        // - Medición de tiempo de respuesta
        // - Health checks avanzados con validación
        // - Estadísticas en tiempo real
        // - Configuración flexible desde archivo JSON
        // ============================================================

        try {
            // Inicializar monitor
            this.monitor = new MultiServiceMonitor(
                fileSystemRepository,
                this.onServiceUp,
                this.onServiceDown
            );

            // Cargar configuración y comenzar monitoreo
            const configPath = path.join(process.cwd(), 'config', 'services.json');
            await this.monitor.startFromConfigFile(configPath);

            // Mostrar estado cada 60 segundos
            setInterval(() => {
                this.monitor.printCurrentStatus();
            }, 60000);

            // Comando para detener el monitoreo
            console.log('💡 TIP: Para ver el estado actual de los servicios, presiona Ctrl+C\n');

        } catch (error) {
            console.error('❌ Failed to start monitoring system:', error);
            console.error('\n📝 Make sure config/services.json exists and is valid');
            console.error('   You can use config/services.example.json as a reference\n');
            process.exit(1);
        }

        // ============================================================
        // SISTEMA ANTIGUO (Comentado - Mantener para referencia)
        // ============================================================

        // Mandar email de logs
        // new SenEmailLogs(
        //     emailService,
        //     fileSystemRepository
        // ).execute(
        //     ['joelgarcia405@gmail.com','joelisaac_99@hotmail.com']
        // )

        // Chequeo simple de un solo servicio
        // CronService.createJob(
        //     '*/5 * * * * *',
        //     () => {
        //         const url = 'https://google.com'
        //         new CheckService(
        //             fileSystemRepository,
        //             () => console.log(`${url} is ok`),
        //             (error) => console.log(error)
        //         ).execute(url);
        //     }
        // );
    }

    /**
     * Callback cuando un servicio está funcionando correctamente
     */
    private static onServiceUp = (result: CheckResult): void => {
        // Puedes agregar lógica personalizada aquí
        // Por ejemplo: enviar notificación de recuperación si estaba caído
    }

    /**
     * Callback cuando un servicio está caído
     */
    private static onServiceDown = (result: CheckResult): void => {
        // Puedes agregar lógica personalizada aquí
        // Por ejemplo: enviar email de alerta inmediata para servicios críticos

        // Ejemplo: Enviar email si es servicio crítico
        // if (result.metadata?.critical) {
        //     emailService.sendAlert(result);
        // }
    }

    /**
     * Detener el servidor y todos los monitores
     */
    public static stop(): void {
        if (this.monitor) {
            this.monitor.stopAll();
        }
        console.log('👋 NOC System stopped\n');
    }

}


