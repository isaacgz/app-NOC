import { CheckService } from "../domain/use-cases/checks/check-service";
import { SenEmailLogs } from "../domain/use-cases/email/send-email-logs";
import { FileSystemDataSource } from "../infrastructure/datasources/file-system.datasource";
import { LogRepositoryImpl } from "../infrastructure/repositories/log.repository.impl";
import { CronService } from "./cron/cron-service";
import { EmailService } from "./email/email.service";
import { MultiServiceMonitor } from "./services/multi-service-monitor";
import { CheckResult, MonitoringConfig } from "../domain/interfaces/service-monitor.interface";
import { DashboardServer } from "./dashboard/dashboard.server";
import * as path from "path";
import { IncidentRepositoryImpl } from "../infrastructure/repositories/incident.repository.impl";
import { SLORepositoryImpl } from "../infrastructure/repositories/slo.repository.impl";
import { IncidentManagerService } from "../domain/services/incident-manager.service";
import { SLOCalculatorService } from "../domain/services/slo-calculator.service";
import { LoadServicesConfig } from "../domain/use-cases/config/load-services-config";
import { LoadSLOsConfig } from "../domain/use-cases/config/load-slos-config";
import { InfluxDBDataSource } from "../infrastructure/datasources/influxdb.datasource";
import { MetricsStorageService } from "../domain/services/metrics-storage.service";
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const fileSystemRepository  = new LogRepositoryImpl(
    new FileSystemDataSource()
)

const emailService = new EmailService();


export class Server {

    private static monitor: MultiServiceMonitor;
    private static dashboardServer: DashboardServer;
    private static incidentManager?: IncidentManagerService;
    private static sloCalculator?: SLOCalculatorService;
    private static metricsStorage?: MetricsStorageService;

    public static async start(){

        console.log('\n🚀 NOC System Starting...\n');

        // ============================================================
        // SISTEMA DE MONITOREO AVANZADO
        // ============================================================
        // Fase 1: Monitoreo de múltiples servicios
        // Fase 2: Alertas inteligentes
        // Fase 3: Dashboard web en tiempo real
        // Fase 5: Gestión de incidentes y SLOs
        // Fase 6: Time-Series Database (InfluxDB)
        // ============================================================

        try {
            // ============================================================
            // FASE 6: Inicializar InfluxDB (Opcional)
            // ============================================================
            const influxEnabled = process.env.INFLUXDB_ENABLED === 'true';

            if (influxEnabled) {
                console.log('📊 Initializing InfluxDB Time-Series Database (Phase 6)...');

                const influxConfig = {
                    url: process.env.INFLUXDB_URL || 'http://localhost:8086',
                    token: process.env.INFLUXDB_TOKEN || '',
                    org: process.env.INFLUXDB_ORG || 'noc-monitoring',
                    bucket: process.env.INFLUXDB_BUCKET || 'service-metrics'
                };

                try {
                    const influxDB = new InfluxDBDataSource(influxConfig);

                    // Verificar conexión
                    const isConnected = await influxDB.ping();
                    if (isConnected) {
                        this.metricsStorage = new MetricsStorageService(influxDB);
                        console.log('✅ InfluxDB connected successfully');
                        console.log(`   Organization: ${influxConfig.org}`);
                        console.log(`   Bucket: ${influxConfig.bucket}\n`);
                    } else {
                        console.warn('⚠️  InfluxDB ping failed, continuing without time-series storage\n');
                    }
                } catch (error) {
                    console.warn('⚠️  Failed to connect to InfluxDB, continuing without time-series storage');
                    console.warn(`   Error: ${error}`);
                    console.warn('   System will use filesystem logs only\n');
                }
            } else {
                console.log('📝 InfluxDB disabled - Using filesystem logs only');
                console.log('   Set INFLUXDB_ENABLED=true in .env to enable time-series storage\n');
            }

            // ============================================================
            // FASE 5: Inicializar Sistema de Incidentes y SLOs
            // ============================================================
            console.log('📋 Initializing Incident Management System (Phase 5)...');

            // Repositorios
            const incidentRepository = new IncidentRepositoryImpl();
            const sloRepository = new SLORepositoryImpl();

            // Servicios (FASE 6: pasar metricsStorage a SLO calculator)
            this.incidentManager = new IncidentManagerService(incidentRepository);
            this.sloCalculator = new SLOCalculatorService(fileSystemRepository, this.metricsStorage);

            console.log('✅ Incident Management System initialized\n');

            // ============================================================
            // Cargar configuración de servicios
            // ============================================================
            const configPath = path.join(process.cwd(), 'config', 'services.json');
            const servicesConfig: MonitoringConfig = LoadServicesConfig.loadFromFile(configPath);

            // Crear mapa de servicios para los controladores
            const servicesMap = new Map(
                servicesConfig.services.map(s => [s.id, { id: s.id, name: s.name }])
            );

            // ============================================================
            // Cargar configuración de SLOs
            // ============================================================
            console.log('🎯 Loading SLO configuration...');
            const slosConfigPath = path.join(process.cwd(), 'config', 'slos.json');

            try {
                const slosConfig = LoadSLOsConfig.loadFromFile(slosConfigPath);
                const validation = LoadSLOsConfig.validateConfig(slosConfig);

                if (!validation.valid) {
                    console.warn('⚠️  Some SLOs have validation errors:');
                    Object.entries(validation.errors).forEach(([slo, errors]) => {
                        console.warn(`   - ${slo}: ${errors.join(', ')}`);
                    });
                }

                // Guardar SLOs en el repositorio
                for (const slo of slosConfig.slos) {
                    await sloRepository.save(slo);
                }

                console.log(`✅ Loaded ${slosConfig.slos.length} SLOs\n`);
            } catch (error) {
                console.warn('⚠️  No SLO configuration found. SLO features will be disabled.');
                console.warn('   Create config/slos.json to enable SLO monitoring\n');
            }

            // ============================================================
            // Inicializar monitor con sistema de incidentes (FASE 6: + InfluxDB)
            // ============================================================
            this.monitor = new MultiServiceMonitor(
                fileSystemRepository,
                emailService,
                this.incidentManager,
                this.metricsStorage,
                this.onServiceUp,
                this.onServiceDown
            );

            // Cargar configuración y comenzar monitoreo
            await this.monitor.startFromConfigFile(configPath);

            // ============================================================
            // Iniciar Dashboard Web (Fase 3 + Fase 5)
            // ============================================================
            const dashboardPort = parseInt(process.env.PORT || '3000');
            this.dashboardServer = new DashboardServer(
                this.monitor,
                dashboardPort,
                this.incidentManager,
                this.sloCalculator,
                sloRepository,
                servicesMap
            );
            this.dashboardServer.start();

            // ============================================================
            // Calcular SLOs periódicamente (cada 5 minutos)
            // ============================================================
            if (this.sloCalculator) {
                setInterval(async () => {
                    try {
                        const enabledSLOs = await sloRepository.findEnabled();
                        for (const slo of enabledSLOs) {
                            const serviceInfo = servicesMap.get(slo.serviceId);
                            const serviceName = serviceInfo?.name || slo.serviceId;

                            const status = await this.sloCalculator!.calculateSLOStatus(slo, serviceName);
                            await sloRepository.saveStatus(status);

                            // Alertar si hay violación crítica
                            if (status.violationRisk === 'critical') {
                                console.log(`🚨 SLO VIOLATION RISK: ${slo.name} - Error budget: ${status.errorBudget.toFixed(2)}min`);
                            }
                        }
                    } catch (error) {
                        console.error('Error calculating SLOs:', error);
                    }
                }, 5 * 60 * 1000); // 5 minutos
            }

            // Mostrar estado cada 60 segundos
            setInterval(() => {
                this.monitor.printCurrentStatus();
            }, 60000);

            console.log('💡 TIP: Open http://localhost:' + dashboardPort + ' to view the dashboard');
            console.log('📊 API Endpoints:');
            console.log('   - GET  /api/incidents         - List all incidents');
            console.log('   - GET  /api/incidents/active  - Active incidents');
            console.log('   - GET  /api/slos/status/all   - SLO compliance status');
            console.log('   - GET  /api/services          - Services overview\n');

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


