import axios from 'axios';
import {
    NotificationChannelsConfig,
    SlackPayload,
    DiscordPayload,
    TelegramPayload,
    ChannelNotificationResult,
    NotificationChannelType,
} from '../interfaces/notification-channels.interface';
import { AlertRecord } from '../interfaces/alert-system.interface';
import { ServiceHealthState } from '../interfaces/alert-system.interface';

/**
 * Servicio de notificaciones multi-canal
 * Soporta Slack, Discord, Telegram, Teams y Webhooks personalizados
 */
export class MultiChannelNotifier {
    /**
     * Envía notificación a todos los canales configurados
     */
    async notifyAll(
        alert: AlertRecord,
        channelsConfig: NotificationChannelsConfig,
        healthState?: ServiceHealthState,
        isEscalation: boolean = false
    ): Promise<ChannelNotificationResult[]> {
        const results: ChannelNotificationResult[] = [];

        // Slack
        if (channelsConfig.slack?.enabled) {
            const result = await this.notifySlack(alert, channelsConfig.slack, healthState, isEscalation);
            results.push(result);
        }

        // Discord
        if (channelsConfig.discord?.enabled) {
            const result = await this.notifyDiscord(alert, channelsConfig.discord, healthState, isEscalation);
            results.push(result);
        }

        // Telegram
        if (channelsConfig.telegram?.enabled) {
            const result = await this.notifyTelegram(alert, channelsConfig.telegram, healthState, isEscalation);
            results.push(result);
        }

        // Microsoft Teams
        if (channelsConfig.teams?.enabled) {
            const result = await this.notifyTeams(alert, channelsConfig.teams, healthState, isEscalation);
            results.push(result);
        }

        // Webhook personalizado
        if (channelsConfig.webhook?.enabled) {
            const result = await this.notifyWebhook(alert, channelsConfig.webhook, healthState, isEscalation);
            results.push(result);
        }

        return results;
    }

    /**
     * Notifica por Slack
     */
    private async notifySlack(
        alert: AlertRecord,
        config: any,
        healthState?: ServiceHealthState,
        isEscalation: boolean = false
    ): Promise<ChannelNotificationResult> {
        try {
            const payload: SlackPayload = {
                text: isEscalation ? `🚨 *ESCALATION*: ${alert.serviceName}` : undefined,
                attachments: [
                    {
                        color: this.getSlackColor(alert.type, alert.priority),
                        title: `${this.getStatusEmoji(alert.type)} ${alert.serviceName} - ${alert.type.toUpperCase()}`,
                        text: alert.checkResult.message,
                        fields: [
                            {
                                title: 'Status',
                                value: alert.checkResult.status.toUpperCase(),
                                short: true,
                            },
                            {
                                title: 'URL',
                                value: alert.checkResult.url,
                                short: true,
                            },
                            {
                                title: 'Response Time',
                                value: `${alert.checkResult.responseTime}ms`,
                                short: true,
                            },
                            {
                                title: 'Priority',
                                value: alert.priority.toUpperCase(),
                                short: true,
                            },
                        ],
                        footer: 'NOC Monitoring System',
                        ts: Math.floor(alert.createdAt.getTime() / 1000),
                    },
                ],
            };

            // Agregar campos adicionales si hay healthState
            if (healthState && payload.attachments && payload.attachments[0]) {
                payload.attachments[0].fields?.push({
                    title: 'Consecutive Failures',
                    value: `${healthState.consecutiveFailures}`,
                    short: true,
                });

                if (healthState.downtimeStarted) {
                    const downtime = Math.floor((Date.now() - healthState.downtimeStarted.getTime()) / 60000);
                    payload.attachments[0].fields?.push({
                        title: 'Downtime',
                        value: `${downtime} minutes`,
                        short: true,
                    });
                }
            }

            await axios.post(config.webhookUrl, payload);

            return {
                channel: 'slack',
                success: true,
                sentAt: new Date(),
            };
        } catch (error) {
            return {
                channel: 'slack',
                success: false,
                sentAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Notifica por Discord
     */
    private async notifyDiscord(
        alert: AlertRecord,
        config: any,
        healthState?: ServiceHealthState,
        isEscalation: boolean = false
    ): Promise<ChannelNotificationResult> {
        try {
            const fields: Array<{ name: string; value: string; inline?: boolean }> = [
                { name: 'Status', value: alert.checkResult.status.toUpperCase(), inline: true },
                { name: 'URL', value: alert.checkResult.url, inline: false },
                { name: 'Response Time', value: `${alert.checkResult.responseTime}ms`, inline: true },
                { name: 'Priority', value: alert.priority.toUpperCase(), inline: true },
            ];

            if (alert.checkResult.statusCode) {
                fields.push({
                    name: 'HTTP Status',
                    value: `${alert.checkResult.statusCode}`,
                    inline: true,
                });
            }

            if (healthState) {
                fields.push({
                    name: 'Consecutive Failures',
                    value: `${healthState.consecutiveFailures}`,
                    inline: true,
                });

                if (healthState.downtimeStarted) {
                    const downtime = Math.floor((Date.now() - healthState.downtimeStarted.getTime()) / 60000);
                    fields.push({
                        name: 'Downtime',
                        value: `${downtime} minutes`,
                        inline: true,
                    });
                }
            }

            const payload: DiscordPayload = {
                username: config.username || 'NOC Monitor',
                avatar_url: config.avatarUrl,
                embeds: [
                    {
                        title: isEscalation
                            ? `🚨 ESCALATION: ${alert.serviceName}`
                            : `${this.getStatusEmoji(alert.type)} ${alert.serviceName}`,
                        description: alert.checkResult.message,
                        color: this.getDiscordColor(alert.type, alert.priority),
                        fields,
                        footer: {
                            text: 'NOC Monitoring System',
                        },
                        timestamp: alert.createdAt.toISOString(),
                    },
                ],
            };

            await axios.post(config.webhookUrl, payload);

            return {
                channel: 'discord',
                success: true,
                sentAt: new Date(),
            };
        } catch (error) {
            return {
                channel: 'discord',
                success: false,
                sentAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Notifica por Telegram
     */
    private async notifyTelegram(
        alert: AlertRecord,
        config: any,
        healthState?: ServiceHealthState,
        isEscalation: boolean = false
    ): Promise<ChannelNotificationResult> {
        try {
            const emoji = this.getStatusEmoji(alert.type);
            const escalationTag = isEscalation ? '🚨 <b>ESCALATION</b>\n\n' : '';

            let message = `${escalationTag}${emoji} <b>${alert.serviceName}</b>\n\n`;
            message += `<b>Status:</b> ${alert.checkResult.status.toUpperCase()}\n`;
            message += `<b>Priority:</b> ${alert.priority.toUpperCase()}\n`;
            message += `<b>URL:</b> ${alert.checkResult.url}\n`;
            message += `<b>Response Time:</b> ${alert.checkResult.responseTime}ms\n`;

            if (alert.checkResult.statusCode) {
                message += `<b>HTTP Status:</b> ${alert.checkResult.statusCode}\n`;
            }

            if (healthState) {
                message += `<b>Consecutive Failures:</b> ${healthState.consecutiveFailures}\n`;

                if (healthState.downtimeStarted) {
                    const downtime = Math.floor((Date.now() - healthState.downtimeStarted.getTime()) / 60000);
                    message += `<b>Downtime:</b> ${downtime} minutes\n`;
                }
            }

            message += `\n<i>${alert.checkResult.message}</i>`;

            const payload: TelegramPayload = {
                chat_id: config.chatId,
                text: message,
                parse_mode: 'HTML',
            };

            await axios.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, payload);

            return {
                channel: 'telegram',
                success: true,
                sentAt: new Date(),
            };
        } catch (error) {
            return {
                channel: 'telegram',
                success: false,
                sentAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Notifica por Microsoft Teams
     */
    private async notifyTeams(
        alert: AlertRecord,
        config: any,
        healthState?: ServiceHealthState,
        isEscalation: boolean = false
    ): Promise<ChannelNotificationResult> {
        try {
            const facts: Array<{ name: string; value: string }> = [
                { name: 'Status', value: alert.checkResult.status.toUpperCase() },
                { name: 'Priority', value: alert.priority.toUpperCase() },
                { name: 'Response Time', value: `${alert.checkResult.responseTime}ms` },
            ];

            if (healthState && healthState.downtimeStarted) {
                const downtime = Math.floor((Date.now() - healthState.downtimeStarted.getTime()) / 60000);
                facts.push({ name: 'Downtime', value: `${downtime} minutes` });
            }

            const payload = {
                '@type': 'MessageCard',
                '@context': 'https://schema.org/extensions',
                summary: `${alert.serviceName} - ${alert.type}`,
                themeColor: this.getTeamsColor(alert.type, alert.priority),
                title: isEscalation ? `🚨 ESCALATION: ${alert.serviceName}` : alert.serviceName,
                sections: [
                    {
                        activityTitle: alert.checkResult.message,
                        activitySubtitle: alert.checkResult.url,
                        facts,
                    },
                ],
            };

            await axios.post(config.webhookUrl, payload);

            return {
                channel: 'teams',
                success: true,
                sentAt: new Date(),
            };
        } catch (error) {
            return {
                channel: 'teams',
                success: false,
                sentAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Notifica por Webhook personalizado
     */
    private async notifyWebhook(
        alert: AlertRecord,
        config: any,
        healthState?: ServiceHealthState,
        isEscalation: boolean = false
    ): Promise<ChannelNotificationResult> {
        try {
            const payload = config.customPayload
                ? { alert, healthState, isEscalation }
                : {
                      service: alert.serviceName,
                      status: alert.checkResult.status,
                      url: alert.checkResult.url,
                      responseTime: alert.checkResult.responseTime,
                      message: alert.checkResult.message,
                      priority: alert.priority,
                      isEscalation,
                      timestamp: alert.createdAt.toISOString(),
                  };

            const axiosConfig: any = {
                method: config.method || 'POST',
                url: config.url,
                data: payload,
            };

            if (config.headers) {
                axiosConfig.headers = config.headers;
            }

            await axios(axiosConfig);

            return {
                channel: 'webhook',
                success: true,
                sentAt: new Date(),
            };
        } catch (error) {
            return {
                channel: 'webhook',
                success: false,
                sentAt: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Obtiene color para Slack
     */
    private getSlackColor(type: string, priority: string): string {
        if (type === 'service_down') return 'danger';
        if (type === 'service_degraded') return 'warning';
        if (type === 'service_recovered') return 'good';
        return '#808080';
    }

    /**
     * Obtiene color para Discord (decimal)
     */
    private getDiscordColor(type: string, priority: string): number {
        if (type === 'service_down') return 15158332; // Rojo
        if (type === 'service_degraded') return 16776960; // Amarillo
        if (type === 'service_recovered') return 3066993; // Verde
        return 8421504; // Gris
    }

    /**
     * Obtiene color para Teams (hex)
     */
    private getTeamsColor(type: string, priority: string): string {
        if (type === 'service_down') return 'FF0000';
        if (type === 'service_degraded') return 'FFA500';
        if (type === 'service_recovered') return '00FF00';
        return '808080';
    }

    /**
     * Obtiene emoji de estado
     */
    private getStatusEmoji(type: string): string {
        const emojis: Record<string, string> = {
            service_down: '🔴',
            service_degraded: '🟡',
            service_recovered: '🟢',
            service_timeout: '⏱️',
        };
        return emojis[type] || '⚪';
    }
}
