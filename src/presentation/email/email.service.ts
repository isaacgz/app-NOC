import { SendMailOptions } from './../../../node_modules/@types/nodemailer/index.d';
import nodemailer from 'nodemailer';
import { envs } from '../../../config/plugins/envs.plugin';
import { Attachment } from 'nodemailer/lib/mailer';
import { LogEntity, LogSeverityLevel } from '../../domain/entities/log.entity';
import { LogStatisticsService } from '../../domain/services/log-statistics.service';
import { ReportTemplateGenerator, ReportLevel } from './report-template.generator';
import { PDFReportService } from '../reports/pdf-report.service';
import { ExcelReportService } from '../reports/excel-report.service';
import fs from 'fs';

interface sendMailOptions{
    to: string | string[];
    subject: string;
    htmlBody: string;
    attachments: Attachment[];
}

export interface EnterpriseReportOptions {
    to: string | string[];
    reportLevel: ReportLevel;
    includePDF?: boolean;
    includeExcel?: boolean;
    companyName?: string;
    reportPeriod?: string;
}

export class EmailService {

    private transporter = nodemailer.createTransport({
        service: envs.MAILER_SERVICE,
        auth: {
            user: envs.MAILER_EMAIL,
            pass: envs.MAILER_SECRET_KEY,
        }
    });

    constructor(){}

    async sendEmail(options: sendMailOptions):Promise<boolean> {

        const { to, subject, htmlBody, attachments } = options;

        try {

            const sentInformation = await this.transporter.sendMail({
                to: to,
                subject: subject,
                html: htmlBody,
                attachments
            });

            // console.log(sentInformation);
            return true;
        } catch (error) {
            return false;
        }

    }

    /**
     * Método legacy - mantener para compatibilidad
     */
    async sendEmailWithFileSystemLogs( to:string | string[]){
        const subject = 'Logs del servidor';
        const htmlBody =  `<h3>Logs de sistema - NOC</h3>
        <p>Hola estos son los logs del sistema</p>
        <p>Ver logs adjuntos</p>
        `;
        const attachments:Attachment[] = [
            { filename: 'logs-all.log', path: './logs/logs-all.log' },
            { filename: 'logs-high.log', path: './logs/logs-high.log' },
            { filename: 'logs-medium.log', path: './logs/logs-medium.log' },
        ];

        return this.sendEmail({
            to, subject, attachments, htmlBody
        })

    }

    /**
     * Nuevo método empresarial para enviar reportes profesionales
     */
    async sendEnterpriseReport(options: EnterpriseReportOptions): Promise<boolean> {
        const {
            to,
            reportLevel,
            includePDF = false,
            includeExcel = false,
            companyName = 'NOC System',
            reportPeriod = 'Últimas 24 horas'
        } = options;

        try {
            // Leer todos los logs
            const allLogs = await this.readLogsFromFiles();

            // Calcular estadísticas
            const statistics = LogStatisticsService.calculateStatistics(allLogs);
            const serviceMetrics = LogStatisticsService.calculateServiceMetrics(allLogs);

            const reportDate = new Date();

            // Generar template HTML
            const htmlBody = ReportTemplateGenerator.generateReport(
                {
                    statistics,
                    serviceMetrics,
                    companyName,
                    reportDate,
                    reportPeriod
                },
                reportLevel
            );

            // Preparar attachments
            const attachments: Attachment[] = [];

            // Agregar logs originales
            if (fs.existsSync('./logs/logs-all.log')) {
                attachments.push({ filename: 'logs-all.log', path: './logs/logs-all.log' });
            }
            if (fs.existsSync('./logs/logs-high.log')) {
                attachments.push({ filename: 'logs-high.log', path: './logs/logs-high.log' });
            }
            if (fs.existsSync('./logs/logs-medium.log')) {
                attachments.push({ filename: 'logs-medium.log', path: './logs/logs-medium.log' });
            }

            // Generar y adjuntar PDF si se solicita
            if (includePDF) {
                const pdfPath = `./logs/reporte-${reportLevel}-${Date.now()}.pdf`;
                try {
                    await PDFReportService.generatePDF({
                        statistics,
                        serviceMetrics,
                        companyName,
                        reportDate,
                        reportPeriod,
                        reportLevel,
                        outputPath: pdfPath
                    });
                    attachments.push({
                        filename: `Reporte-${reportLevel}-${this.formatDateForFilename(reportDate)}.pdf`,
                        path: pdfPath
                    });
                } catch (error) {
                    console.error('Error generando PDF:', error);
                }
            }

            // Generar y adjuntar Excel si se solicita
            if (includeExcel) {
                const excelPath = `./logs/reporte-${reportLevel}-${Date.now()}.xlsx`;
                try {
                    await ExcelReportService.generateExcelReport({
                        statistics,
                        serviceMetrics,
                        logs: allLogs,
                        companyName,
                        reportDate,
                        reportPeriod,
                        outputPath: excelPath
                    });
                    attachments.push({
                        filename: `Reporte-${reportLevel}-${this.formatDateForFilename(reportDate)}.xlsx`,
                        path: excelPath
                    });
                } catch (error) {
                    console.error('Error generando Excel:', error);
                }
            }

            // Determinar el asunto según el nivel de reporte
            const subject = this.getReportSubject(reportLevel, companyName, statistics);

            // Enviar email
            const sent = await this.sendEmail({
                to,
                subject,
                htmlBody,
                attachments
            });

            // Limpiar archivos temporales
            this.cleanupTempFiles(attachments);

            return sent;

        } catch (error) {
            console.error('Error enviando reporte empresarial:', error);
            return false;
        }
    }

    /**
     * Lee todos los logs desde los archivos del sistema
     */
    private async readLogsFromFiles(): Promise<LogEntity[]> {
        const logs: LogEntity[] = [];
        const logPath = './logs/logs-all.log';

        try {
            if (fs.existsSync(logPath)) {
                const content = fs.readFileSync(logPath, 'utf-8');
                const lines = content.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const logData = JSON.parse(line);
                        const log = new LogEntity({
                            level: logData.level as LogSeverityLevel,
                            message: logData.message,
                            origin: logData.origin,
                            createdAt: new Date(logData.createdAt)
                        });
                        logs.push(log);
                    } catch (error) {
                        // Ignorar líneas que no se puedan parsear
                    }
                }
            }
        } catch (error) {
            console.error('Error leyendo logs:', error);
        }

        return logs;
    }

    /**
     * Genera el asunto del email según el nivel de reporte
     */
    private getReportSubject(reportLevel: ReportLevel, companyName: string, statistics: any): string {
        const levelNames = {
            [ReportLevel.EXECUTIVE]: 'Reporte Ejecutivo',
            [ReportLevel.TECHNICAL]: 'Reporte Técnico',
            [ReportLevel.OPERATIONS]: 'Reporte de Operaciones'
        };

        const levelName = levelNames[reportLevel];
        const status = statistics.highCount > 0 ? '⚠️ ATENCIÓN REQUERIDA' : '✓ Sistema OK';

        return `${levelName} - ${companyName} | ${status}`;
    }

    /**
     * Formatea fecha para nombre de archivo
     */
    private formatDateForFilename(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Limpia archivos temporales generados
     */
    private cleanupTempFiles(attachments: Attachment[]): void {
        attachments.forEach(attachment => {
            if (attachment.path && typeof attachment.path === 'string') {
                // Solo eliminar archivos temporales (PDFs y Excel generados)
                if (attachment.path.includes('reporte-') && (attachment.path.endsWith('.pdf') || attachment.path.endsWith('.xlsx'))) {
                    try {
                        if (fs.existsSync(attachment.path)) {
                            fs.unlinkSync(attachment.path);
                        }
                    } catch (error) {
                        console.error('Error eliminando archivo temporal:', error);
                    }
                }
            }
        });
    }

}
