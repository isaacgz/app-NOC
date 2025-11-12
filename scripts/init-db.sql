-- ============================================================
-- PostgreSQL Initialization Script for NOC System
-- ============================================================

-- Create database (si no existe)
SELECT 'CREATE DATABASE noc_monitoring'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'noc_monitoring')\gexec

-- Connect to database
\c noc_monitoring

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- (las tablas serán creadas automáticamente por TypeORM en modo synchronize)

-- Función para actualizar updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- La función se aplicará después de que TypeORM cree las tablas

COMMENT ON DATABASE noc_monitoring IS 'NOC Monitoring System Database';
