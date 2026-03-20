import { execSync as s } from "child_process";
function c(t, e) {
  try {
    const o = t.replace(/'/g, "'\\''"), i = e.replace(/'/g, "'\\''");
    s(
      `osascript -e 'display notification "${i}" with title "${o}" sound name "Glass"'`,
      { stdio: "ignore", timeout: 5e3 }
    );
  } catch {
  }
}
function n(t, e) {
  try {
    const o = t.replace(/"/g, '\\"'), i = e.replace(/"/g, '\\"');
    s(
      `notify-send "${o}" "${i}"`,
      { stdio: "ignore", timeout: 5e3 }
    );
  } catch {
  }
}
function r(t, e) {
  switch (process.stdout.write("\x07"), process.platform) {
    case "darwin":
      c(t, e);
      break;
    case "linux":
      n(t, e);
      break;
  }
}
export {
  r as notify
};
