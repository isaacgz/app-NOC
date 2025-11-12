import { LogStatistics } from '../../domain/services/log-statistics.service';

/**
 * Servicio para generar gráficos usando QuickChart API
 * QuickChart es un servicio gratuito que renderiza gráficos de Chart.js como imágenes
 */
export class ChartService {

    private static readonly QUICKCHART_URL = 'https://quickchart.io/chart';

    /**
     * Genera URL de gráfico de pastel para distribución por severidad
     */
    static generateSeverityPieChart(statistics: LogStatistics, width: number = 500, height: number = 300): string {
        const chartConfig = {
            type: 'pie',
            data: {
                labels: ['Informativos', 'Advertencias', 'Críticos'],
                datasets: [{
                    data: [statistics.lowCount, statistics.mediumCount, statistics.highCount],
                    backgroundColor: [
                        'rgb(16, 185, 129)',  // Green
                        'rgb(245, 158, 11)',  // Orange
                        'rgb(239, 68, 68)',   // Red
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Eventos por Severidad',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        formatter: (value: number, context: any) => {
                            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${value}\n(${percentage}%)`;
                        }
                    }
                }
            }
        };

        const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
        return `${this.QUICKCHART_URL}?width=${width}&height=${height}&chart=${encodedConfig}`;
    }

    /**
     * Genera URL de gráfico de barras horizontales para distribución por severidad
     */
    static generateSeverityBarChart(statistics: LogStatistics, width: number = 600, height: number = 300): string {
        const chartConfig = {
            type: 'horizontalBar',
            data: {
                labels: ['Informativos', 'Advertencias', 'Críticos'],
                datasets: [{
                    label: 'Cantidad de Eventos',
                    data: [statistics.lowCount, statistics.mediumCount, statistics.highCount],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)',
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: 'Eventos por Nivel de Severidad',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        };

        const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
        return `${this.QUICKCHART_URL}?width=${width}&height=${height}&chart=${encodedConfig}`;
    }

    /**
     * Genera URL de gráfico de dona para métricas de uptime
     */
    static generateUptimeDonutChart(uptime: number, width: number = 400, height: number = 300): string {
        const downtime = 100 - uptime;
        const chartConfig = {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'No Disponible'],
                datasets: [{
                    data: [uptime, downtime],
                    backgroundColor: [
                        uptime >= 99 ? 'rgb(16, 185, 129)' : uptime >= 95 ? 'rgb(245, 158, 11)' : 'rgb(239, 68, 68)',
                        'rgb(229, 231, 235)',
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `Disponibilidad del Sistema: ${uptime.toFixed(2)}%`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 16
                        },
                        formatter: (value: number) => {
                            return `${value.toFixed(1)}%`;
                        }
                    }
                },
                cutout: '70%'
            }
        };

        const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
        return `${this.QUICKCHART_URL}?width=${width}&height=${height}&chart=${encodedConfig}`;
    }

    /**
     * Genera URL de gráfico combinado para dashboard ejecutivo
     */
    static generateExecutiveDashboard(statistics: LogStatistics, uptime: number, width: number = 800, height: number = 400): string {
        const chartConfig = {
            type: 'bar',
            data: {
                labels: ['Total', 'Informativos', 'Advertencias', 'Críticos'],
                datasets: [
                    {
                        label: 'Cantidad',
                        data: [statistics.totalLogs, statistics.lowCount, statistics.mediumCount, statistics.highCount],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                        ],
                        borderColor: [
                            'rgb(59, 130, 246)',
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)',
                            'rgb(239, 68, 68)',
                        ],
                        borderWidth: 2
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `Resumen de Eventos - Uptime: ${uptime.toFixed(2)}%`,
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#1f2937',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        };

        const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
        return `${this.QUICKCHART_URL}?width=${width}&height=${height}&chart=${encodedConfig}`;
    }

    /**
     * Genera configuración de Chart.js para embeber en HTML (para uso en navegador)
     */
    static generateEmbeddedChartConfig(statistics: LogStatistics): string {
        return `
        <canvas id="severityChart" width="400" height="200"></canvas>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
        <script>
            const ctx = document.getElementById('severityChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Informativos', 'Advertencias', 'Críticos'],
                    datasets: [{
                        data: [${statistics.lowCount}, ${statistics.mediumCount}, ${statistics.highCount}],
                        backgroundColor: [
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)',
                            'rgb(239, 68, 68)',
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        title: {
                            display: true,
                            text: 'Distribución de Eventos'
                        }
                    }
                }
            });
        </script>
        `;
    }
}
