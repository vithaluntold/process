import { EventEmitter } from 'events';
import { screen, desktopCapturer } from 'electron';
import screenshot from 'screenshot-desktop';
import activeWin from 'active-win';
import { GlobalKeyboardListener } from 'node-global-key-listener';
import { ConfigManager } from './config-manager';

export interface Activity {
  timestamp: number;
  type: 'keyboard' | 'mouse' | 'application' | 'screenshot';
  data: any;
  sessionId: string;
}

export class ActivityCapture extends EventEmitter {
  private keyboardListener: GlobalKeyboardListener | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private sessionId: string;
  private stats = {
    keystrokes: 0,
    mouseClicks: 0,
    appSwitches: 0,
    screenshots: 0,
    startTime: 0,
  };
  private lastActiveWindow: string = '';
  private keyBuffer: Array<{ key: string; timestamp: number }> = [];
  private config: ConfigManager;

  constructor(config: ConfigManager) {
    super();
    this.config = config;
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  start() {
    this.stats.startTime = Date.now();
    this.startKeyboardTracking();
    this.startApplicationTracking();
    this.startScreenshotCapture();
  }

  stop() {
    if (this.keyboardListener) {
      this.keyboardListener.kill();
      this.keyboardListener = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getStats() {
    return {
      ...this.stats,
      duration: Date.now() - this.stats.startTime,
      sessionId: this.sessionId,
    };
  }

  private startKeyboardTracking() {
    const cfg = this.config.getConfig();
    if (!cfg.captureKeyboard) return;

    this.keyboardListener = new GlobalKeyboardListener();

    this.keyboardListener.addListener((e, down) => {
      if (e.state !== 'DOWN') return;

      this.stats.keystrokes++;

      const sensitiveText = cfg.blurSensitiveData;
      const keyData = sensitiveText ? '[REDACTED]' : e.name;

      this.keyBuffer.push({
        key: keyData,
        timestamp: Date.now(),
      });

      if (this.keyBuffer.length >= 10) {
        this.flushKeyBuffer();
      }

      if (e.name === 'MOUSE LEFT' || e.name === 'MOUSE RIGHT') {
        this.stats.mouseClicks++;
      }
    });
  }

  private flushKeyBuffer() {
    if (this.keyBuffer.length === 0) return;

    const activity: Activity = {
      timestamp: Date.now(),
      type: 'keyboard',
      data: {
        keyCount: this.keyBuffer.length,
        duration: this.keyBuffer[this.keyBuffer.length - 1].timestamp - this.keyBuffer[0].timestamp,
        application: this.lastActiveWindow,
      },
      sessionId: this.sessionId,
    };

    this.emit('activity', activity);
    this.keyBuffer = [];
  }

  private startApplicationTracking() {
    const cfg = this.config.getConfig();
    if (!cfg.captureApplications) return;

    this.intervalId = setInterval(async () => {
      try {
        const window = await activeWin();
        
        if (window && window.title !== this.lastActiveWindow) {
          this.stats.appSwitches++;
          
          const activity: Activity = {
            timestamp: Date.now(),
            type: 'application',
            data: {
              title: window.title,
              owner: window.owner.name,
              path: window.owner.path,
            },
            sessionId: this.sessionId,
          };

          this.emit('activity', activity);
          this.lastActiveWindow = window.title;

          if (this.keyBuffer.length > 0) {
            this.flushKeyBuffer();
          }
        }
      } catch (error) {
        console.error('Failed to get active window:', error);
      }
    }, 2000);
  }

  private startScreenshotCapture() {
    const cfg = this.config.getConfig();
    if (!cfg.captureScreenshots) return;

    const screenshotInterval = cfg.screenshotInterval || 60000;

    setInterval(async () => {
      try {
        const img = await screenshot({ format: 'png' });
        this.stats.screenshots++;

        const activity: Activity = {
          timestamp: Date.now(),
          type: 'screenshot',
          data: {
            size: img.length,
            format: 'png',
            base64: img.toString('base64'),
          },
          sessionId: this.sessionId,
        };

        this.emit('activity', activity);
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
      }
    }, screenshotInterval);
  }
}
