import fs from 'fs';
import path from 'path';

const DYNACONTEXT_DIR = '.dynacontext';

/**
 * Strip transient fields (keys starting with _) and config from session object.
 * Returns a deep clone suitable for serialization.
 */
function serializeSession(session) {
  const cloned = JSON.parse(JSON.stringify(session, (key, value) => {
    // Remove config at the top level
    if (key === 'config') return undefined;
    // Remove any key starting with _
    if (key.startsWith('_')) return undefined;
    return value;
  }));
  return cloned;
}

/**
 * Get the path to the project-local .dynacontext directory.
 * This is for session storage in the current working directory.
 */
function getProjectSessionDir() {
  return path.join(process.cwd(), DYNACONTEXT_DIR);
}

/**
 * Save session state to disk.
 * Creates .dynacontext/ and timestamp folder on first save.
 * Sets session._sessionId to the folder name.
 *
 * @param {Object} session - The session object to save
 */
export function saveSession(session) {
  const dynacontextPath = getProjectSessionDir();

  // Create .dynacontext directory if it doesn't exist
  if (!fs.existsSync(dynacontextPath)) {
    fs.mkdirSync(dynacontextPath, { recursive: true });
  }

  // Determine session ID (timestamp folder name)
  let sessionId = session._sessionId;
  if (!sessionId) {
    sessionId = String(Date.now());
    session._sessionId = sessionId;
  }

  const sessionDir = path.join(dynacontextPath, sessionId);

  // Create session folder if it doesn't exist
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const sessionPath = path.join(sessionDir, 'session.json');
  const serialized = serializeSession(session);

  fs.writeFileSync(sessionPath, JSON.stringify(serialized, null, 2), 'utf8');
}

/**
 * Load a session from disk.
 * Injects fresh config, sets cwd to process.cwd(), resets transient fields.
 *
 * @param {string} sessionId - The session folder name (epoch ms string)
 * @param {Object} config - Fresh config to inject
 * @returns {Object} The hydrated session object
 */
export function loadSession(sessionId, config) {
  const dynacontextPath = getProjectSessionDir();
  const sessionPath = path.join(dynacontextPath, sessionId, 'session.json');

  if (!fs.existsSync(sessionPath)) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const raw = fs.readFileSync(sessionPath, 'utf8');
  const parsed = JSON.parse(raw);

  // Inject fresh config and cwd
  parsed.config = config;
  parsed.cwd = process.cwd();

  // Reset transient fields in retrieval.expandedSteps if they exist
  if (parsed.retrieval && Array.isArray(parsed.retrieval.expandedSteps)) {
    parsed.retrieval.expandedSteps = parsed.retrieval.expandedSteps.map(step => {
      if (typeof step === 'object' && step !== null) {
        const cleanStep = { ...step };
        // Remove any _ prefixed keys
        Object.keys(cleanStep).forEach(key => {
          if (key.startsWith('_')) {
            delete cleanStep[key];
          }
        });
        return cleanStep;
      }
      return step;
    });
  }

  // Set runtime-only _sessionId
  parsed._sessionId = sessionId;

  return parsed;
}

/**
 * Extract display name from session data.
 * Uses assembly content title if available, otherwise formatted timestamp.
 *
 * @param {Object} sessionData - Parsed session.json data
 * @param {string} sessionId - The folder name (epoch ms)
 * @returns {string} Display name for the session
 */
function getDisplayName(sessionData, sessionId) {
  // Try to extract title from assembly.content
  if (sessionData.assembly?.content) {
    const titleMatch = sessionData.assembly.content.match(/^# (.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }

  // Fall back to formatted timestamp
  const timestamp = Number(sessionId);
  if (!isNaN(timestamp)) {
    return new Date(timestamp).toLocaleString();
  }

  return `Session ${sessionId}`;
}

/**
 * List all saved sessions sorted newest-first.
 *
 * @returns {Array<{id, path, phase, displayName}>} Array of session info objects
 */
export function listSessions() {
  const dynacontextPath = getProjectSessionDir();

  if (!fs.existsSync(dynacontextPath)) {
    return [];
  }

  const entries = fs.readdirSync(dynacontextPath, { withFileTypes: true });
  const sessions = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const sessionId = entry.name;
    const sessionDir = path.join(dynacontextPath, sessionId);
    const sessionPath = path.join(sessionDir, 'session.json');

    if (!fs.existsSync(sessionPath)) continue;

    try {
      const raw = fs.readFileSync(sessionPath, 'utf8');
      const data = JSON.parse(raw);

      sessions.push({
        id: sessionId,
        path: sessionDir,
        phase: data.phase || 'UNKNOWN',
        displayName: getDisplayName(data, sessionId)
      });
    } catch (err) {
      // Skip invalid session files
      continue;
    }
  }

  // Sort by sessionId (epoch ms) descending - newest first
  sessions.sort((a, b) => Number(b.id) - Number(a.id));

  return sessions;
}

/**
 * Delete a session folder and all its contents.
 *
 * @param {string} sessionId - The session folder name to delete
 */
export function deleteSession(sessionId) {
  const dynacontextPath = getProjectSessionDir();
  const sessionDir = path.join(dynacontextPath, sessionId);

  if (!fs.existsSync(sessionDir)) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Recursively delete the session folder
  fs.rmSync(sessionDir, { recursive: true, force: true });
}
