import { execSync } from 'child_process';

/**
 * Send a macOS notification via osascript.
 * Silently fails if osascript is unavailable or notifications are disabled.
 */
function notifyMacOS(title, message) {
  try {
    const safeTitle = title.replace(/'/g, "'\\''");
    const safeMessage = message.replace(/'/g, "'\\''");
    execSync(
      `osascript -e 'display notification "${safeMessage}" with title "${safeTitle}" sound name "Glass"'`,
      { stdio: 'ignore', timeout: 5000 }
    );
  } catch {
    // Silent fail — notification is a convenience, not a requirement
  }
}

/**
 * Send a Linux notification via notify-send.
 * Silently fails if notify-send is unavailable.
 */
function notifyLinux(title, message) {
  try {
    const safeTitle = title.replace(/"/g, '\\"');
    const safeMessage = message.replace(/"/g, '\\"');
    execSync(
      `notify-send "${safeTitle}" "${safeMessage}"`,
      { stdio: 'ignore', timeout: 5000 }
    );
  } catch {
    // Silent fail
  }
}

/**
 * Send a user attention notification.
 * Fires terminal bell (universal) + platform-native notification.
 * Silently fails on any error — this is a convenience feature.
 *
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 */
export function notify(title, message) {
  // Terminal bell — universal baseline, bounces dock icon on macOS
  process.stdout.write('\x07');

  // Platform-specific notification
  switch (process.platform) {
    case 'darwin':
      notifyMacOS(title, message);
      break;
    case 'linux':
      notifyLinux(title, message);
      break;
  }
}
