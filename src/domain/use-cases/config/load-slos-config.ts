/**
 * Load SLOs Configuration Use Case
 * Carga la configuración de SLOs desde archivos JSON
 */

import fs from 'fs';
import { SLO } from '../../entities/slo.entity';

interface SLOsConfig {
  slos: SLO[];
}

export class LoadSLOsConfig {
  /**
   * Carga la configuración de SLOs desde un archivo JSON
   */
  static loadFromFile(filePath: string): SLOsConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`SLOs configuration file not found: ${filePath}`);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(fileContent) as SLOsConfig;

      // Validar configuración
      if (!config.slos || !Array.isArray(config.slos)) {
        throw new Error('Invalid SLOs configuration: missing or invalid "slos" array');
      }

      // Convertir fechas si existen
      config.slos = config.slos.map(slo => ({
        ...slo,
        createdAt: slo.createdAt ? new Date(slo.createdAt) : new Date(),
        updatedAt: slo.updatedAt ? new Date(slo.updatedAt) : undefined
      }));

      return config;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`SLOs configuration file not found: ${filePath}`);
      }
      throw new Error(`Failed to parse SLOs configuration: ${error.message}`);
    }
  }

  /**
   * Obtiene solo los SLOs habilitados
   */
  static getEnabledSLOs(config: SLOsConfig): SLO[] {
    return config.slos.filter(slo => slo.enabled !== false);
  }

  /**
   * Obtiene SLOs por servicio
   */
  static getSLOsByService(config: SLOsConfig, serviceId: string): SLO[] {
    return config.slos.filter(slo => slo.serviceId === serviceId);
  }

  /**
   * Valida un SLO
   */
  static validateSLO(slo: SLO): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!slo.id) errors.push('Missing SLO id');
    if (!slo.serviceId) errors.push('Missing serviceId');
    if (!slo.name) errors.push('Missing name');
    if (slo.target === undefined || slo.target < 0 || slo.target > 100) {
      errors.push('Target must be between 0 and 100');
    }
    if (!['1h', '24h', '7d', '30d', '90d'].includes(slo.window)) {
      errors.push('Invalid window. Must be one of: 1h, 24h, 7d, 30d, 90d');
    }
    if (!['availability', 'latency', 'errorRate'].includes(slo.sliType)) {
      errors.push('Invalid sliType. Must be one of: availability, latency, errorRate');
    }
    if (slo.sliType === 'latency' && !slo.threshold) {
      errors.push('Latency SLOs require a threshold value (in milliseconds)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida toda la configuración
   */
  static validateConfig(config: SLOsConfig): { valid: boolean; errors: Record<string, string[]> } {
    const allErrors: Record<string, string[]> = {};

    config.slos.forEach((slo, index) => {
      const validation = this.validateSLO(slo);
      if (!validation.valid) {
        allErrors[`slo[${index}] (${slo.id || 'unknown'})`] = validation.errors;
      }
    });

    return {
      valid: Object.keys(allErrors).length === 0,
      errors: allErrors
    };
  }
}
