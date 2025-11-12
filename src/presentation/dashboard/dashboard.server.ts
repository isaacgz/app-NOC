import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as path from 'path';
import { DashboardController } from './dashboard.controller';
import { MultiServiceMonitor } from '../services/multi-service-monitor';

/**
 * Servidor HTTP para el Dashboard
 * Sirve la interfaz web y expone la API REST
 */
export class DashboardServer {
    private app: Express;
    private controller: DashboardController;

    constructor(
        private readonly monitor: MultiServiceMonitor,
        private readonly port: number = 3000
    ) {
        this.app = express();
        this.controller = new DashboardController(monitor);
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
        // Health check
        this.app.get('/api/health', this.controller.getHealth);

        // Overview
        this.app.get('/api/overview', this.controller.getOverview);

        // Services
        this.app.get('/api/services', this.controller.getServices);
        this.app.get('/api/services/:id', this.controller.getServiceById);
        this.app.get('/api/services/:id/history', this.controller.getServiceHistory);
        this.app.get('/api/services/:id/stats', this.controller.getServiceStats);

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
