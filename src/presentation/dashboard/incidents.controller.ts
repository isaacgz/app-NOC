/**
 * Incidents API Controller
 * Maneja las operaciones REST para incidentes
 */

import { Request, Response, Express } from 'express';
import { IncidentManagerService } from '../../domain/services/incident-manager.service';
import { IncidentStatus, IncidentSeverity } from '../../domain/entities/incident.entity';

export class IncidentsController {
  constructor(private incidentManager: IncidentManagerService) {}

  /**
   * Registra todas las rutas del controlador
   */
  setupRoutes(app: Express): void {
    // Obtener todos los incidentes
    app.get('/api/incidents', async (req: Request, res: Response) => {
      try {
        const status = req.query.status as string;
        const severity = req.query.severity as string;

        let incidents;

        if (status) {
          // Filtrar por estado
          const statuses = status.split(',') as IncidentStatus[];
          incidents = await this.incidentManager.getAllIncidents();
          incidents = incidents.filter(inc => statuses.includes(inc.status));
        } else if (severity) {
          // Filtrar por severidad
          incidents = await this.incidentManager.getAllIncidents();
          incidents = incidents.filter(inc => inc.severity === severity);
        } else {
          // Todos los incidentes
          incidents = await this.incidentManager.getAllIncidents();
        }

        res.json({
          success: true,
          data: incidents,
          count: incidents.length
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener incidentes activos
    app.get('/api/incidents/active', async (req: Request, res: Response) => {
      try {
        const incidents = await this.incidentManager.getActiveIncidents();

        res.json({
          success: true,
          data: incidents,
          count: incidents.length
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener estadísticas de incidentes
    app.get('/api/incidents/stats', async (req: Request, res: Response) => {
      try {
        const stats = await this.incidentManager.getStatistics();

        res.json({
          success: true,
          data: stats
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener incidente por ID
    app.get('/api/incidents/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const incident = await this.incidentManager.getIncidentById(id);

        if (!incident) {
          return res.status(404).json({
            success: false,
            error: 'Incident not found'
          });
        }

        res.json({
          success: true,
          data: incident
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener incidentes por servicio
    app.get('/api/services/:serviceId/incidents', async (req: Request, res: Response) => {
      try {
        const { serviceId } = req.params;
        const incidents = await this.incidentManager.getIncidentsByService(serviceId);

        res.json({
          success: true,
          data: incidents,
          count: incidents.length
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Actualizar estado de incidente
    app.patch('/api/incidents/:id/status', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { status, notes, assignedTo, rootCause, resolution } = req.body;

        if (!status || !Object.values(IncidentStatus).includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid status. Must be one of: new, investigating, in_progress, resolved, closed'
          });
        }

        const incident = await this.incidentManager.updateIncident(id, {
          status,
          notes,
          assignedTo,
          rootCause,
          resolution
        });

        res.json({
          success: true,
          data: incident,
          message: `Incident status updated to ${status}`
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Actualizar incidente (general)
    app.patch('/api/incidents/:id', async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const incident = await this.incidentManager.updateIncident(id, updates);

        res.json({
          success: true,
          data: incident,
          message: 'Incident updated successfully'
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Crear incidente manualmente
    app.post('/api/incidents', async (req: Request, res: Response) => {
      try {
        const { serviceId, serviceName, severity, description, estimatedImpact } = req.body;

        if (!serviceId || !serviceName || !severity || !description) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: serviceId, serviceName, severity, description'
          });
        }

        if (!Object.values(IncidentSeverity).includes(severity)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid severity. Must be one of: critical, high, medium, low'
          });
        }

        const incident = await this.incidentManager.createIncident({
          serviceId,
          serviceName,
          severity,
          description,
          estimatedImpact
        });

        res.status(201).json({
          success: true,
          data: incident,
          message: 'Incident created successfully'
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    console.log('✓ Incidents API routes registered');
  }
}
