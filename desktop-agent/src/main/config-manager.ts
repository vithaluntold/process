import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface AgentConfig {
  apiKey: string;
  platformUrl: string;
  captureKeyboard: boolean;
  captureApplications: boolean;
  captureScreenshots: boolean;
  screenshotInterval: number;
  encryptData: boolean;
  encryptionKey: string;
  blurSensitiveData: boolean;
  privacyConsent: boolean;
  autoStart: boolean;
  userId: string;
}

const DEFAULT_CONFIG: AgentConfig = {
  apiKey: '',
  platformUrl: 'http://localhost:5000',
  captureKeyboard: true,
  captureApplications: true,
  captureScreenshots: false,
  screenshotInterval: 60000,
  encryptData: false,
  encryptionKey: '',
  blurSensitiveData: true,
  privacyConsent: false,
  autoStart: false,
  userId: '',
};

export class ConfigManager {
  private configPath: string;
  private config: AgentConfig;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.json');
    this.config = this.loadConfig();
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  saveConfig(config: Partial<AgentConfig>) {
    this.config = { ...this.config, ...config };
    
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  private loadConfig(): AgentConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }

    return { ...DEFAULT_CONFIG };
  }
}
