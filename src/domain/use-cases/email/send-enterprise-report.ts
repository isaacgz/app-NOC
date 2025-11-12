import { EmailService, EnterpriseReportOptions } from '../../../presentation/email/email.service';
import { ReportLevel } from '../../../presentation/email/report-template.generator';
import { LogEntity, LogSeverityLevel } from '../../entities/log.entity';
import { LogRepository } from '../../repository/log.repository';
import { envs } from '../../../../config/plugins/envs.plugin';

interface SendEnterpriseReportUseCase {
    execute: (to: string | string[]) => Promise<boolean>;
}

export class SendEnterpriseReport implements SendEnterpriseReportUseCase {

    constructor(
        private readonly emailService: EmailService,
        private readonly logRepository: LogRepository,
    ) {}

    async execute(to: string | string[]): Promise<boolean> {
        try {
            // Configurar opciones del reporte desde las variables de entorno
            const reportOptions: EnterpriseReportOptions = {
                to,
                reportLevel: envs.REPORT_LEVEL as ReportLevel,
                includePDF: envs.REPORT_INCLUDE_PDF,
                includeExcel: envs.REPORT_INCLUDE_EXCEL,
                companyName: envs.COMPANY_NAME,
                reportPeriod: envs.REPORT_PERIOD,
            };

            // Enviar reporte empresarial
            const sent = await this.emailService.sendEnterpriseReport(reportOptions);

            if (!sent) {
                throw new Error('Enterprise report not sent');
            }

            // Registrar el envío exitoso
            const log = new LogEntity({
                message: `Enterprise report (${reportOptions.reportLevel}) sent successfully`,
                level: LogSeverityLevel.low,
                origin: 'send-enterprise-report.ts',
            });
            this.logRepository.saveLog(log);

            return true;

        } catch (error) {
            // Registrar el error
            const log = new LogEntity({
                message: `Failed to send enterprise report: ${error}`,
                level: LogSeverityLevel.high,
                origin: 'send-enterprise-report.ts',
            });
            this.logRepository.saveLog(log);

            return false;
        }
    }

    /**
     * Envía un reporte empresarial con opciones personalizadas
     */
    async executeWithOptions(options: EnterpriseReportOptions): Promise<boolean> {
        try {
            const sent = await this.emailService.sendEnterpriseReport(options);

            if (!sent) {
                throw new Error('Enterprise report not sent');
            }

            const log = new LogEntity({
                message: `Custom enterprise report (${options.reportLevel}) sent successfully`,
                level: LogSeverityLevel.low,
                origin: 'send-enterprise-report.ts',
            });
            this.logRepository.saveLog(log);

            return true;

        } catch (error) {
            const log = new LogEntity({
                message: `Failed to send custom enterprise report: ${error}`,
                level: LogSeverityLevel.high,
                origin: 'send-enterprise-report.ts',
            });
            this.logRepository.saveLog(log);

            return false;
        }
    }
}
