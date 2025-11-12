import 'dotenv/config';
import * as env from 'env-var';


export const envs = {

    PORT: env.get('PORT').required().asPortNumber(),
    MAILER_SERVICE: env.get('MAILER_SERVICE').required().asString(),
    MAILER_EMAIL: env.get('MAILER_EMAIL').required().asEmailString(),
    MAILER_SECRET_KEY: env.get('MAILER_SECRET_KEY').required().asString(),
    PROD: env.get('PROD').required().asBool(),

    // Configuración de reportes empresariales
    REPORT_LEVEL: env.get('REPORT_LEVEL').default('operations').asEnum(['executive', 'technical', 'operations']),
    REPORT_INCLUDE_PDF: env.get('REPORT_INCLUDE_PDF').default('false').asBool(),
    REPORT_INCLUDE_EXCEL: env.get('REPORT_INCLUDE_EXCEL').default('false').asBool(),
    COMPANY_NAME: env.get('COMPANY_NAME').default('NOC System').asString(),
    REPORT_PERIOD: env.get('REPORT_PERIOD').default('Últimas 24 horas').asString(),
}

