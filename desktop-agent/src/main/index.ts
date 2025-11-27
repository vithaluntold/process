import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from 'electron';
import path from 'path';
import log from 'electron-log';
import { ActivityCapture } from './activity-capture';
import { DataTransmitter } from './data-transmitter';
import { ConfigManager } from './config-manager';
import { autoUpdaterService } from './auto-updater';

declare module 'electron' {
  interface App {
    isQuitting?: boolean;
  }
}

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

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
    this.setupSingleInstance();
  }

  private setupSingleInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      log.info('Another instance is already running. Exiting.');
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });
  }

  async initialize() {
    await app.whenReady();
    
    log.info('EPI-Q Agent starting...');
    log.info('Version:', app.getVersion());
    log.info('Platform:', process.platform);
    log.info('Architecture:', process.arch);
    
    this.createTray();
    this.createWindow();
    
    autoUpdaterService.setMainWindow(this.mainWindow!);
    
    if (!app.isPackaged || process.env.NODE_ENV === 'development') {
      log.info('Running in development mode - auto-update disabled');
    } else {
      autoUpdaterService.startAutoCheckInterval(3600000);
    }
    
    const config = this.configManager.getConfig();
    if (config.autoStart && config.apiKey) {
      this.startTracking();
    }

    if (process.argv.includes('--hidden')) {
      log.info('Started in hidden mode');
    } else {
      this.mainWindow?.show();
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
      icon: this.getIconPath(),
    });

    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    this.mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    this.mainWindow.webContents.on('did-finish-load', () => {
      this.mainWindow?.webContents.send('app-version', app.getVersion());
    });
  }

  private getIconPath(): string {
    const platform = process.platform;
    const basePath = path.join(__dirname, '../../assets');
    
    if (platform === 'win32') {
      return path.join(basePath, 'icon.ico');
    } else if (platform === 'darwin') {
      return path.join(basePath, 'icon.icns');
    } else {
      return path.join(basePath, 'icon.png');
    }
  }

  private createTray() {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    let trayIcon: Electron.NativeImage;
    
    try {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } catch (error) {
      log.error('Failed to load tray icon:', error);
      trayIcon = nativeImage.createEmpty();
    }
    
    this.tray = new Tray(trayIcon);
    this.updateTrayMenu();
    
    this.tray.on('click', () => {
      this.mainWindow?.isVisible() ? this.mainWindow.hide() : this.mainWindow?.show();
    });

    this.tray.on('double-click', () => {
      this.mainWindow?.show();
    });
  }

  private updateTrayMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `EPI-Q Agent v${app.getVersion()}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: this.isTracking ? 'Tracking Active' : 'Tracking Paused',
        enabled: false,
        icon: this.isTracking 
          ? nativeImage.createEmpty() 
          : nativeImage.createEmpty(),
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
        label: 'Check for Updates',
        click: async () => {
          await autoUpdaterService.checkForUpdates();
        },
      },
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
        ? 'EPI-Q Agent - Tracking Active'
        : 'EPI-Q Agent - Paused'
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

    ipcMain.handle('get-app-info', () => {
      return {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        isPackaged: app.isPackaged,
      };
    });
  }

  private async startTracking() {
    const config = this.configManager.getConfig();
    
    if (!config.apiKey || !config.platformUrl) {
      log.warn('Cannot start tracking: API key or platform URL not configured');
      this.mainWindow?.webContents.send('error', 'Please configure API key and platform URL');
      return;
    }

    if (!config.privacyConsent) {
      log.warn('Cannot start tracking: Privacy consent not given');
      this.mainWindow?.webContents.send('error', 'Privacy consent required');
      return;
    }

    log.info('Starting activity tracking');
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
    log.info('Stopping activity tracking');
    this.isTracking = false;
    this.updateTrayMenu();
    this.activityCapture.stop();
    this.mainWindow?.webContents.send('tracking-stopped');
  }
}

const agent = new DesktopAgent();
agent.initialize();

app.on('window-all-closed', () => {
  log.info('All windows closed - keeping app in system tray');
});

app.on('activate', () => {
  log.info('App activated (macOS)');
});

app.on('before-quit', () => {
  log.info('App quitting');
  app.isQuitting = true;
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
