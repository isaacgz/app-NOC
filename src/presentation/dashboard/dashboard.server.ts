import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as path from 'path';
import { DashboardController } from './dashboard.controller';
import { IncidentsController } from './incidents.controller';
import { SLOsController } from './slos.controller';
import { MultiServiceMonitor } from '../services/multi-service-monitor';
import { IncidentManagerService } from '../../domain/services/incident-manager.service';
import { SLOCalculatorService } from '../../domain/services/slo-calculator.service';
import { SLORepository } from '../../domain/repository/slo.repository';

/**
 * Servidor HTTP para el Dashboard (Fase 3 + Fase 5)
 * Sirve la interfaz web y expone la API REST para:
 * - Monitoreo de servicios
 * - Gestión de incidentes
 * - SLOs y error budgets
 */
export class DashboardServer {
    private app: Express;
    private controller: DashboardController;
    private incidentsController?: IncidentsController;
    private slosController?: SLOsController;

    constructor(
        private readonly monitor: MultiServiceMonitor,
        private readonly port: number = 3000,
        private readonly incidentManager?: IncidentManagerService,
        private readonly sloCalculator?: SLOCalculatorService,
        private readonly sloRepository?: SLORepository,
        private readonly servicesMap?: Map<string, { id: string; name: string }>
    ) {
        this.app = express();
        this.controller = new DashboardController(monitor);

        // Inicializar controladores opcionales
        if (incidentManager) {
            this.incidentsController = new IncidentsController(incidentManager);
        }

        if (sloCalculator && sloRepository && servicesMap) {
            this.slosController = new SLOsController(sloRepository, sloCalculator, servicesMap);
        }

        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Configura middlewares
     */
    private setupMiddleware(): void {
        // CORS
        this.app.use(cors());

        // JSON parser
        this.app.use(express.json());

        // Static files (para servir el frontend)
        const publicPath = path.join(__dirname, '../../../public');
        this.app.use(express.static(publicPath));

        // Logger
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Configura rutas de la API
     */
    private setupRoutes(): void {
        console.log('\n🔧 Setting up API routes...');

        // Health check
        this.app.get('/api/health', this.controller.getHealth);

        // Overview
        this.app.get('/api/overview', this.controller.getOverview);

        // Services
        this.app.get('/api/services', this.controller.getServices);
        this.app.get('/api/services/:id', this.controller.getServiceById);
        this.app.get('/api/services/:id/history', this.controller.getServiceHistory);
        this.app.get('/api/services/:id/stats', this.controller.getServiceStats);

        // FASE 5: Incidents API
        if (this.incidentsController) {
            this.incidentsController.setupRoutes(this.app);
        }

        // FASE 5: SLOs API
        if (this.slosController) {
            this.slosController.setupRoutes(this.app);
        }

        // Ruta por defecto - servir index.html
        this.app.get('/', (req: Request, res: Response) => {
            const indexPath = path.join(__dirname, '../../../public/index.html');
            res.sendFile(indexPath);
        });

        // 404 handler para API
        this.app.use('/api/*', (req: Request, res: Response) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
            });
        });

        // Error handler global
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error('Error:', err);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        });

        console.log('✅ API routes configured\n');
    }

    /**
     * Inicia el servidor
     */
    start(): void {
        this.app.listen(this.port, () => {
            console.log(`\n📊 Dashboard available at: http://localhost:${this.port}`);
            console.log(`📡 API available at: http://localhost:${this.port}/api`);
        });
    }

    /**
     * Obtiene la instancia de Express (para testing)
     */
    getApp(): Express {
        return this.app;
    }
}
