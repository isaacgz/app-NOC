// Dashboard NOC - Client Side JavaScript

const API_BASE_URL = window.location.origin + '/api';
const REFRESH_INTERVAL = 5000; // 5 segundos

let refreshTimer = null;
let countdown = 5;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    startAutoRefresh();
});

/**
 * Carga todos los datos del dashboard
 */
async function loadDashboard() {
    try {
        // Cargar overview
        const overviewResponse = await fetch(`${API_BASE_URL}/overview`);
        if (!overviewResponse.ok) throw new Error('Failed to fetch overview');
        const overviewData = await overviewResponse.json();

        // Cargar servicios
        const servicesResponse = await fetch(`${API_BASE_URL}/services`);
        if (!servicesResponse.ok) throw new Error('Failed to fetch services');
        const servicesData = await servicesResponse.json();

        // Actualizar UI
        updateOverview(overviewData.data);
        updateServices(servicesData.data);

        // FASE 5: Cargar incidentes y SLOs
        await loadIncidents();
        await loadIncidentStats();
        await loadSLOs();

        // Mostrar contenido, ocultar loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';
        document.getElementById('content').style.display = 'block';

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError(error.message);
    }
}

/**
 * Actualiza las tarjetas de overview
 */
function updateOverview(data) {
    document.getElementById('total-services').textContent = data.totalServices;
    document.getElementById('services-up').textContent = data.servicesUp;
    document.getElementById('average-uptime').textContent = `${data.averageUptime}%`;
    document.getElementById('average-response').textContent = `${data.averageResponseTime}ms`;

    // Cambiar color de uptime según el valor
    const uptimeElement = document.getElementById('average-uptime');
    if (data.averageUptime >= 99) {
        uptimeElement.className = 'card-value status-up';
    } else if (data.averageUptime >= 95) {
        uptimeElement.className = 'card-value status-degraded';
    } else {
        uptimeElement.className = 'card-value status-down';
    }
}

/**
 * Actualiza la lista de servicios
 */
function updateServices(services) {
    const container = document.getElementById('services-container');

    if (!services || services.length === 0) {
        container.innerHTML = '<div class="loading">No services configured</div>';
        return;
    }

    // Ordenar: Down primero, luego degraded, luego up
    services.sort((a, b) => {
        const statusOrder = { down: 0, degraded: 1, up: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    container.innerHTML = services.map(service => `
        <div class="service-card" onclick="showServiceDetails('${service.id}')">
            <div class="service-header">
                <div class="service-name">
                    <span class="status-indicator ${service.status}"></span>
                    ${service.name}
                </div>
                <span class="badge badge-${service.status}">${service.status.toUpperCase()}</span>
            </div>

            <div class="service-metrics">
                <div class="metric">
                    <div class="metric-label">Uptime</div>
                    <div class="metric-value ${getUptimeClass(service.uptime)}">${service.uptime}%</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Response</div>
                    <div class="metric-value">${service.averageResponseTime}ms</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Checks</div>
                    <div class="metric-value">${service.totalChecks}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Failures</div>
                    <div class="metric-value ${service.failedChecks > 0 ? 'status-down' : ''}">${service.failedChecks}</div>
                </div>
            </div>

            ${service.lastCheck ? `
                <div class="card-subtitle" style="margin-top: 1rem;">
                    Last check: ${formatTimestamp(service.lastCheck)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

/**
 * Obtiene la clase CSS según el uptime
 */
function getUptimeClass(uptime) {
    if (uptime >= 99) return 'status-up';
    if (uptime >= 95) return 'status-degraded';
    return 'status-down';
}

/**
 * Formatea timestamp para mostrar
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // diferencia en segundos

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleString();
}

/**
 * Muestra detalles de un servicio (para futura implementación)
 */
function showServiceDetails(serviceId) {
    console.log('Show details for service:', serviceId);
    // TODO: Implementar modal con detalles y gráficos
}

/**
 * Muestra un error
 */
function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = `❌ Error: ${message}`;
    errorElement.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

/**
 * Auto-refresh del dashboard
 */
function startAutoRefresh() {
    // Countdown visual
    setInterval(() => {
        countdown--;
        document.getElementById('refresh-countdown').textContent = countdown;

        if (countdown <= 0) {
            countdown = 5;
            loadDashboard();
        }
    }, 1000);
}

// ============================================================
// FASE 5: Funciones de Incidentes y SLOs
// ============================================================

/**
 * Carga incidentes activos
 */
async function loadIncidents() {
    try {
        const response = await fetch(`${API_BASE_URL}/incidents/active`);
        if (!response.ok) {
            console.warn('Incidents API not available');
            return;
        }

        const data = await response.json();
        updateIncidents(data.data || []);
    } catch (error) {
        console.error('Error loading incidents:', error);
        updateIncidents([]);
    }
}

/**
 * Actualiza la sección de incidentes activos
 */
function updateIncidents(incidents) {
    const container = document.getElementById('incidents-container');

    if (!incidents || incidents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div>No active incidents</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">All services are running smoothly</div>
            </div>
        `;
        return;
    }

    // Ordenar por severidad (critical primero)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    incidents.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    container.innerHTML = incidents.map(incident => {
        const icon = getSeverityIcon(incident.severity);
        const timeAgo = formatTimestamp(incident.createdAt);

        return `
            <div class="incident-card ${incident.severity}">
                <div class="incident-header">
                    <div class="incident-title">${icon} ${incident.serviceName}</div>
                    <span class="incident-severity severity-${incident.severity}">
                        ${incident.severity}
                    </span>
                </div>
                <div class="incident-description">${incident.description}</div>
                <div class="incident-meta">
                    Created ${timeAgo} • ${incident.affectedChecks} failed checks
                    ${incident.estimatedImpact ? `• ${incident.estimatedImpact}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Obtiene el icono según la severidad
 */
function getSeverityIcon(severity) {
    const icons = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵'
    };
    return icons[severity] || '⚪';
}

/**
 * Carga estadísticas de incidentes
 */
async function loadIncidentStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/incidents/stats`);
        if (!response.ok) {
            console.warn('Incident stats API not available');
            return;
        }

        const data = await response.json();
        updateIncidentStats(data.data);
    } catch (error) {
        console.error('Error loading incident stats:', error);
        updateIncidentStats(null);
    }
}

/**
 * Actualiza las estadísticas de incidentes
 */
function updateIncidentStats(stats) {
    const container = document.getElementById('incident-stats');

    if (!stats) {
        container.innerHTML = `
            <div class="empty-state">
                <div>📊 No incident data available</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Incidents</div>
        </div>
        <div class="stat-card">
            <div class="stat-value status-down">${stats.active}</div>
            <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
            <div class="stat-value status-up">${stats.resolved}</div>
            <div class="stat-label">Resolved</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.mttr.toFixed(1)}m</div>
            <div class="stat-label">MTTR</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #dc2626;">${stats.bySeverity.critical}</div>
            <div class="stat-label">Critical</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #f97316;">${stats.bySeverity.high}</div>
            <div class="stat-label">High</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #f59e0b;">${stats.bySeverity.medium}</div>
            <div class="stat-label">Medium</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #3b82f6;">${stats.bySeverity.low}</div>
            <div class="stat-label">Low</div>
        </div>
    `;
}

/**
 * Carga el estado de los SLOs
 */
async function loadSLOs() {
    try {
        const response = await fetch(`${API_BASE_URL}/slos/status/all`);
        if (!response.ok) {
            console.warn('SLOs API not available');
            return;
        }

        const data = await response.json();
        updateSLOs(data.data?.slos || []);
    } catch (error) {
        console.error('Error loading SLOs:', error);
        updateSLOs([]);
    }
}

/**
 * Actualiza la sección de SLOs
 */
function updateSLOs(slos) {
    const container = document.getElementById('slo-container');

    if (!slos || slos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <div>No SLOs configured</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">
                    Create config/slos.json to enable SLO monitoring
                </div>
            </div>
        `;
        return;
    }

    // Ordenar por riesgo (critical primero)
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
    slos.sort((a, b) => riskOrder[a.violationRisk] - riskOrder[b.violationRisk]);

    container.innerHTML = slos.map(slo => {
        const progressClass = getProgressClass(slo.currentValue, slo.target);
        const riskClass = `risk-${slo.violationRisk}`;
        const complianceClass = slo.compliance ? 'slo-compliant' : 'slo-violated';
        const complianceText = slo.compliance ? 'COMPLIANT' : 'VIOLATED';

        return `
            <div class="slo-card">
                <div class="slo-header">
                    <div class="slo-name">${slo.sloName}</div>
                    <span class="slo-compliance ${complianceClass}">${complianceText}</span>
                </div>

                <div class="slo-progress-container">
                    <div class="slo-progress-bar">
                        <div class="slo-progress-fill ${progressClass}" style="width: ${Math.min(slo.currentValue, 100)}%">
                            ${slo.currentValue.toFixed(2)}%
                        </div>
                        <div class="slo-target-line" style="left: ${slo.target}%"></div>
                    </div>
                </div>

                <div class="slo-metrics">
                    <div class="slo-metric">
                        <div class="slo-metric-label">Target</div>
                        <div class="slo-metric-value">${slo.target}%</div>
                    </div>
                    <div class="slo-metric">
                        <div class="slo-metric-label">Error Budget</div>
                        <div class="slo-metric-value">${slo.errorBudget.toFixed(1)}m</div>
                    </div>
                    <div class="slo-metric">
                        <div class="slo-metric-label">Budget Used</div>
                        <div class="slo-metric-value">${slo.errorBudgetUsed.toFixed(1)}%</div>
                    </div>
                    <div class="slo-metric">
                        <div class="slo-metric-label">Burn Rate</div>
                        <div class="slo-metric-value ${getBurnRateClass(slo.burnRate)}">
                            ${slo.burnRate.toFixed(2)}x
                        </div>
                    </div>
                    <div class="slo-metric">
                        <div class="slo-metric-label">Risk Level</div>
                        <div class="slo-metric-value ${riskClass}">
                            ${slo.violationRisk.toUpperCase()}
                        </div>
                    </div>
                    <div class="slo-metric">
                        <div class="slo-metric-label">Window</div>
                        <div class="slo-metric-value">${slo.window}</div>
                    </div>
                </div>

                <div class="incident-meta" style="margin-top: 1rem;">
                    ${slo.serviceName} • ${slo.sliType} • Last calculated: ${formatTimestamp(slo.calculatedAt)}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Obtiene la clase de progreso según el valor y target
 */
function getProgressClass(current, target) {
    if (current >= target) return '';
    if (current >= target - 0.5) return 'warning';
    return 'danger';
}

/**
 * Obtiene la clase según el burn rate
 */
function getBurnRateClass(burnRate) {
    if (burnRate < 1) return 'risk-none';
    if (burnRate < 2) return 'risk-low';
    if (burnRate < 3) return 'risk-medium';
    if (burnRate < 5) return 'risk-high';
    return 'risk-critical';
}
