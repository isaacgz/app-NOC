/**
 * Prisma Enums Type Definitions
 *
 * Este archivo define los tipos de enums de Prisma cuando el cliente no está generado.
 * Estos tipos deben coincidir exactamente con los definidos en schema.prisma
 */

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum IncidentStatus {
  NEW = 'NEW',
  INVESTIGATING = 'INVESTIGATING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SLOWindow {
  ONE_HOUR = 'ONE_HOUR',
  TWENTY_FOUR_HOURS = 'TWENTY_FOUR_HOURS',
  SEVEN_DAYS = 'SEVEN_DAYS',
  THIRTY_DAYS = 'THIRTY_DAYS',
  NINETY_DAYS = 'NINETY_DAYS',
}

export enum SLIType {
  AVAILABILITY = 'AVAILABILITY',
  LATENCY = 'LATENCY',
  ERROR_RATE = 'ERROR_RATE',
}

export enum ViolationRisk {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}
