import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { ConfigManager } from './config-manager';
import { Activity } from './activity-capture';

export class DataTransmitter {
  private client: AxiosInstance;
  private config: ConfigManager;
  private queue: Activity[] = [];
  private transmitting: boolean = false;

  constructor(config: ConfigManager) {
    this.config = config;
    
    const cfg = this.config.getConfig();
    this.client = axios.create({
      baseURL: cfg.platformUrl || 'http://localhost:5000',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': cfg.apiKey || '',
      },
      timeout: 30000,
    });

    this.startQueueProcessor();
  }

  async sendActivity(activity: Activity) {
    const encrypted = this.encryptActivity(activity);
    this.queue.push(encrypted);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.get('/api/health');
      return {
        success: response.status === 200,
        message: 'Connection successful',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed',
      };
    }
  }

  private encryptActivity(activity: Activity): Activity {
    const cfg = this.config.getConfig();
    if (!cfg.encryptData) return activity;

    const encryptionKey = cfg.encryptionKey || this.generateEncryptionKey();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    
    let encrypted = cipher.update(JSON.stringify(activity.data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      ...activity,
      data: {
        encrypted: encrypted,
        iv: iv.toString('hex'),
      },
    };
  }

  private generateEncryptionKey(): string {
    const key = crypto.randomBytes(32).toString('hex');
    const cfg = this.config.getConfig();
    this.config.saveConfig({ ...cfg, encryptionKey: key });
    return key;
  }

  private startQueueProcessor() {
    setInterval(async () => {
      if (this.transmitting || this.queue.length === 0) return;

      this.transmitting = true;
      const batch = this.queue.splice(0, 50);

      try {
        await this.client.post('/api/task-mining/activities', {
          activities: batch,
          sessionId: batch[0]?.sessionId,
        });
      } catch (error) {
        console.error('Failed to transmit activities:', error);
        this.queue.unshift(...batch);
      } finally {
        this.transmitting = false;
      }
    }, 5000);
  }
}
