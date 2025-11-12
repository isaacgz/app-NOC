/**
 * Interfaces para Múltiples Canales de Notificación - Fase 4
 */

import { AlertRecord } from './alert-system.interface';

/**
 * Tipos de canales de notificación disponibles
 */
export type NotificationChannelType = 'email' | 'slack' | 'discord' | 'telegram' | 'teams' | 'webhook';

/**
 * Configuración de Slack
 */
export interface SlackConfig {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
}

/**
 * Configuración de Discord
 */
export interface DiscordConfig {
    enabled: boolean;
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
}

/**
 * Configuración de Telegram
 */
export interface TelegramConfig {
    enabled: boolean;
    botToken: string;
    chatId: string;
}

/**
 * Configuración de Microsoft Teams
 */
export interface TeamsConfig {
    enabled: boolean;
    webhookUrl: string;
}

/**
 * Configuración de Webhook personalizado
 */
export interface WebhookConfig {
    enabled: boolean;
    url: string;
    method?: 'POST' | 'GET' | 'PUT';
    headers?: Record<string, string>;
    customPayload?: boolean;
}

/**
 * Configuración de todos los canales de notificación
 */
export interface NotificationChannelsConfig {
    email?: {
        enabled: boolean;
        recipients: string[];
    };
    slack?: SlackConfig;
    discord?: DiscordConfig;
    telegram?: TelegramConfig;
    teams?: TeamsConfig;
    webhook?: WebhookConfig;
}

/**
 * Payload de Slack
 */
export interface SlackPayload {
    text?: string;
    attachments?: Array<{
        color?: string;
        title?: string;
        text?: string;
        fields?: Array<{
            title: string;
            value: string;
            short?: boolean;
        }>;
        footer?: string;
        ts?: number;
    }>;
}

/**
 * Payload de Discord
 */
export interface DiscordPayload {
    content?: string;
    username?: string;
    avatar_url?: string;
    embeds?: Array<{
        title?: string;
        description?: string;
        color?: number;
        fields?: Array<{
            name: string;
            value: string;
            inline?: boolean;
        }>;
        footer?: {
            text: string;
        };
        timestamp?: string;
    }>;
}

/**
 * Payload de Telegram
 */
export interface TelegramPayload {
    chat_id: string;
    text: string;
    parse_mode?: 'HTML' | 'Markdown';
    disable_notification?: boolean;
}

/**
 * Resultado de envío por canal
 */
export interface ChannelNotificationResult {
    channel: NotificationChannelType;
    success: boolean;
    sentAt: Date;
    error?: string;
}
