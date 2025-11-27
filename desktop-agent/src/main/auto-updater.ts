import { autoUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import log from 'electron-log';

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  progress: number;
  version: string | null;
  releaseNotes: string | null;
}

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private status: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    version: null,
    releaseNotes: null,
  };

  constructor() {
    this.configureAutoUpdater();
    this.setupEventHandlers();
    this.setupIPC();
  }

  private configureAutoUpdater() {
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = false;

    if (process.env.UPDATE_SERVER_URL) {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: process.env.UPDATE_SERVER_URL,
        channel: 'latest',
      });
    }

    log.info('Auto-updater configured');
    log.info('Current version:', app.getVersion());
  }

  private setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.status = {
        ...this.status,
        checking: true,
        error: null,
      };
      this.sendStatusToRenderer();
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log.info('Update available:', info.version);
      this.status = {
        ...this.status,
        checking: false,
        available: true,
        version: info.version,
        releaseNotes: typeof info.releaseNotes === 'string' 
          ? info.releaseNotes 
          : Array.isArray(info.releaseNotes) 
            ? info.releaseNotes.map(n => n.note).join('\n') 
            : null,
      };
      this.sendStatusToRenderer();
      this.promptForUpdate(info);
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      log.info('No updates available. Current version:', info.version);
      this.status = {
        ...this.status,
        checking: false,
        available: false,
      };
      this.sendStatusToRenderer();
    });

    autoUpdater.on('download-progress', (progress) => {
      log.info(`Download progress: ${progress.percent.toFixed(1)}%`);
      this.status = {
        ...this.status,
        downloading: true,
        progress: progress.percent,
      };
      this.sendStatusToRenderer();
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      log.info('Update downloaded:', info.version);
      this.status = {
        ...this.status,
        downloading: false,
        downloaded: true,
        progress: 100,
      };
      this.sendStatusToRenderer();
      this.promptToInstall(info);
    });

    autoUpdater.on('error', (error: Error) => {
      log.error('Auto-update error:', error.message);
      this.status = {
        ...this.status,
        checking: false,
        downloading: false,
        error: error.message,
      };
      this.sendStatusToRenderer();
    });
  }

  private setupIPC() {
    ipcMain.handle('updater:check', async () => {
      return this.checkForUpdates();
    });

    ipcMain.handle('updater:download', async () => {
      return this.downloadUpdate();
    });

    ipcMain.handle('updater:install', () => {
      this.installUpdate();
    });

    ipcMain.handle('updater:get-status', () => {
      return this.status;
    });

    ipcMain.handle('updater:get-version', () => {
      return app.getVersion();
    });
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private sendStatusToRenderer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater:status', this.status);
    }
  }

  async checkForUpdates(): Promise<UpdateCheckResult | null> {
    try {
      log.info('Manually checking for updates...');
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Error checking for updates:', error);
      return null;
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      log.info('Starting update download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Error downloading update:', error);
      throw error;
    }
  }

  installUpdate(): void {
    log.info('Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  }

  private async promptForUpdate(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow) return;

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'Would you like to download and install it now?',
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response === 0) {
      this.downloadUpdate();
    }
  }

  private async promptToInstall(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow) return;

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The update will be installed when you restart the application. Would you like to restart now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response === 0) {
      this.installUpdate();
    }
  }

  startAutoCheckInterval(intervalMs: number = 3600000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);

    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);

    log.info(`Auto-update check scheduled every ${intervalMs / 1000} seconds`);
  }

  stopAutoCheckInterval(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      log.info('Auto-update check interval stopped');
    }
  }
}

export const autoUpdaterService = new AutoUpdater();
