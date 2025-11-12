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
