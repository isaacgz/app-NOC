/**
 * SLOs API Controller
 * Maneja las operaciones REST para SLOs
 */

import { Request, Response, Express } from 'express';
import { SLOCalculatorService } from '../../domain/services/slo-calculator.service';
import { SLORepository } from '../../domain/repository/slo.repository';
import { SLO, SLOStatus } from '../../domain/entities/slo.entity';

interface ServiceInfo {
  id: string;
  name: string;
}

export class SLOsController {
  constructor(
    private sloRepository: SLORepository,
    private sloCalculator: SLOCalculatorService,
    private servicesMap: Map<string, ServiceInfo>
  ) {}

  /**
   * Registra todas las rutas del controlador
   */
  setupRoutes(app: Express): void {
    // Obtener todos los SLOs
    app.get('/api/slos', async (req: Request, res: Response) => {
      try {
        const enabled = req.query.enabled === 'true';

        let slos;
        if (enabled) {
          slos = await this.sloRepository.findEnabled();
        } else {
          slos = await this.sloRepository.getAll();
        }

        res.json({
          success: true,
          data: slos,
          count: slos.length
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener SLOs por servicio
    app.get('/api/services/:serviceId/slos', async (req: Request, res: Response) => {
      try {
        const { serviceId } = req.params;
        const slos = await this.sloRepository.findByServiceId(serviceId);

        res.json({
          success: true,
          data: slos,
          count: slos.length
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener SLO por ID
    app.get('/api/slos/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const slo = await this.sloRepository.findById(id);

        if (!slo) {
          return res.status(404).json({
            success: false,
            error: 'SLO not found'
          });
        }

        res.json({
          success: true,
          data: slo
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener estado actual de todos los SLOs
    app.get('/api/slos/status/all', async (req: Request, res: Response) => {
      try {
        const enabledSLOs = await this.sloRepository.findEnabled();
        const statuses: SLOStatus[] = [];

        for (const slo of enabledSLOs) {
          const serviceInfo = this.servicesMap.get(slo.serviceId);
          const serviceName = serviceInfo?.name || slo.serviceId;

          try {
            const status = await this.sloCalculator.calculateSLOStatus(slo, serviceName);
            await this.sloRepository.saveStatus(status);
            statuses.push(status);
          } catch (error) {
            console.error(`Error calculating SLO ${slo.id}:`, error);
          }
        }

        // Calcular estadísticas agregadas
        const aggregatedStats = await this.sloCalculator.calculateAggregatedStats(statuses);

        res.json({
          success: true,
          data: {
            slos: statuses,
            summary: aggregatedStats
          },
          count: statuses.length
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener estado de un SLO específico
    app.get('/api/slos/:id/status', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const slo = await this.sloRepository.findById(id);

        if (!slo) {
          return res.status(404).json({
            success: false,
            error: 'SLO not found'
          });
        }

        const serviceInfo = this.servicesMap.get(slo.serviceId);
        const serviceName = serviceInfo?.name || slo.serviceId;

        const status = await this.sloCalculator.calculateSLOStatus(slo, serviceName);
        await this.sloRepository.saveStatus(status);

        res.json({
          success: true,
          data: status
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener historial de estado de un SLO
    app.get('/api/slos/:id/history', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit as string) || 100;

        const slo = await this.sloRepository.findById(id);
        if (!slo) {
          return res.status(404).json({
            success: false,
            error: 'SLO not found'
          });
        }

        const history = await this.sloRepository.getStatusHistory(id, limit);

        res.json({
          success: true,
          data: {
            slo: slo,
            history: history
          },
          count: history.length
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Crear nuevo SLO
    app.post('/api/slos', async (req: Request, res: Response) => {
      try {
        const sloData = req.body;

        // Validaciones básicas
        if (!sloData.serviceId || !sloData.name || !sloData.target || !sloData.window || !sloData.sliType) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: serviceId, name, target, window, sliType'
          });
        }

        // Verificar que el servicio existe
        if (!this.servicesMap.has(sloData.serviceId)) {
          return res.status(404).json({
            success: false,
            error: `Service ${sloData.serviceId} not found`
          });
        }

        const slo: SLO = {
          id: `slo-${Date.now()}`,
          serviceId: sloData.serviceId,
          name: sloData.name,
          description: sloData.description || '',
          target: sloData.target,
          window: sloData.window,
          sliType: sloData.sliType,
          threshold: sloData.threshold,
          enabled: sloData.enabled !== false,
          createdAt: new Date()
        };

        const saved = await this.sloRepository.save(slo);

        res.status(201).json({
          success: true,
          data: saved,
          message: 'SLO created successfully'
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Actualizar SLO
    app.patch('/api/slos/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const slo = await this.sloRepository.findById(id);
        if (!slo) {
          return res.status(404).json({
            success: false,
            error: 'SLO not found'
          });
        }

        // Aplicar actualizaciones
        Object.assign(slo, updates);
        slo.updatedAt = new Date();

        const updated = await this.sloRepository.update(slo);

        res.json({
          success: true,
          data: updated,
          message: 'SLO updated successfully'
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Eliminar SLO
    app.delete('/api/slos/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const deleted = await this.sloRepository.deleteById(id);

        if (!deleted) {
          return res.status(404).json({
            success: false,
            error: 'SLO not found'
          });
        }

        res.json({
          success: true,
          message: 'SLO deleted successfully'
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    console.log('✓ SLOs API routes registered');
  }
}
