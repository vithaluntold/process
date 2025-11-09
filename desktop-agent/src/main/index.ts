import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } from 'electron';
import path from 'path';
import { ActivityCapture } from './activity-capture';
import { DataTransmitter } from './data-transmitter';
import { ConfigManager } from './config-manager';

class DesktopAgent {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private activityCapture: ActivityCapture;
  private dataTransmitter: DataTransmitter;
  private configManager: ConfigManager;
  private isTracking: boolean = false;

  constructor() {
    this.configManager = new ConfigManager();
    this.activityCapture = new ActivityCapture(this.configManager);
    this.dataTransmitter = new DataTransmitter(this.configManager);
    
    this.setupIPC();
  }

  async initialize() {
    await app.whenReady();
    
    this.createTray();
    this.createWindow();
    
    const config = this.configManager.getConfig();
    if (config.autoStart && config.apiKey) {
      this.startTracking();
    }
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 500,
      height: 700,
      show: false,
      frame: true,
      resizable: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
      icon: path.join(__dirname, '../../assets/icon.png'),
    });

    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    this.mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });
  }

  private createTray() {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    
    this.tray = new Tray(trayIcon);
    this.updateTrayMenu();
    
    this.tray.on('click', () => {
      this.mainWindow?.isVisible() ? this.mainWindow.hide() : this.mainWindow?.show();
    });
  }

  private updateTrayMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: this.isTracking ? 'Tracking Active' : 'Tracking Paused',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: this.isTracking ? 'Pause Tracking' : 'Start Tracking',
        click: () => {
          this.isTracking ? this.stopTracking() : this.startTracking();
        },
      },
      {
        label: 'Open Dashboard',
        click: () => this.mainWindow?.show(),
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          this.mainWindow?.show();
          this.mainWindow?.webContents.send('show-settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray?.setContextMenu(contextMenu);
    this.tray?.setToolTip(
      this.isTracking
        ? 'EPI X-Ray Agent - Tracking Active'
        : 'EPI X-Ray Agent - Paused'
    );
  }

  private setupIPC() {
    ipcMain.handle('get-config', () => {
      return this.configManager.getConfig();
    });

    ipcMain.handle('save-config', (_, config) => {
      this.configManager.saveConfig(config);
      return { success: true };
    });

    ipcMain.handle('start-tracking', () => {
      this.startTracking();
      return { success: true, tracking: this.isTracking };
    });

    ipcMain.handle('stop-tracking', () => {
      this.stopTracking();
      return { success: true, tracking: this.isTracking };
    });

    ipcMain.handle('get-status', () => {
      return {
        tracking: this.isTracking,
        stats: this.activityCapture.getStats(),
      };
    });

    ipcMain.handle('test-connection', async () => {
      return await this.dataTransmitter.testConnection();
    });
  }

  private async startTracking() {
    const config = this.configManager.getConfig();
    
    if (!config.apiKey || !config.platformUrl) {
      this.mainWindow?.webContents.send('error', 'Please configure API key and platform URL');
      return;
    }

    if (!config.privacyConsent) {
      this.mainWindow?.webContents.send('error', 'Privacy consent required');
      return;
    }

    this.isTracking = true;
    this.updateTrayMenu();
    
    this.activityCapture.on('activity', async (activity) => {
      await this.dataTransmitter.sendActivity(activity);
      this.mainWindow?.webContents.send('activity-logged', activity);
    });

    this.activityCapture.start();
    this.mainWindow?.webContents.send('tracking-started');
  }

  private stopTracking() {
    this.isTracking = false;
    this.updateTrayMenu();
    this.activityCapture.stop();
    this.mainWindow?.webContents.send('tracking-stopped');
  }
}

const agent = new DesktopAgent();
agent.initialize();

app.on('window-all-closed', () => {
  // Keep app running in system tray
});

app.on('activate', () => {
  // macOS specific
});
