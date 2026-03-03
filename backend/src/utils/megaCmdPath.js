const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const ext = isWin ? '.exe' : '';
const commandName = (name) => name + ext;

/** On Windows MEGAcmd often installs .bat (batch) files, not .exe. Try both. */
const winExtensions = ['.exe', '.bat', '.cmd'];

function pathExistsSync(p) {
    try {
        return fs.existsSync(p);
    } catch {
        return false;
    }
}

function normalizeBaseDir(dir) {
    if (!dir || typeof dir !== 'string') return null;
    const trimmed = String(dir).trim().replace(/^["']|["']$/g, '');
    if (!trimmed) return null;
    return path.normalize(trimmed.replace(/\//g, path.sep));
}

function getAllBaseCandidates() {
    const candidates = [];
    const fromEnv = normalizeBaseDir(process.env.MEGA_CMD_PATH);
    if (fromEnv) {
        candidates.push(fromEnv);
        if (!path.isAbsolute(fromEnv)) candidates.push(path.resolve(process.cwd(), fromEnv));
    }

    if (isWin) {
        const home = process.env.USERPROFILE || process.env.HOME || '';
        if (home) candidates.push(path.join(home, 'AppData', 'Local', 'MEGAcmd'));
        candidates.push(path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'MEGAcmd'));
        candidates.push(path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'MEGAcmd'));
    }

    return [...new Set(candidates)].filter(Boolean);
}

/**
 * Find full path to command. On Windows tries .exe, .bat, .cmd (MEGAcmd installs as .bat).
 */
function findMegaCommandPath(command) {
    const bases = getAllBaseCandidates();
    const extensions = isWin ? winExtensions : [''];
    const name = command;

    for (const base of bases) {
        for (const ext of extensions) {
            const fileName = name + ext;
            const fullPath = path.join(base, fileName);
            if (pathExistsSync(fullPath)) return path.resolve(fullPath);
        }
        const binBase = path.join(base, 'bin');
        for (const ext of extensions) {
            const fileName = name + ext;
            const fullPath = path.join(binBase, fileName);
            if (pathExistsSync(fullPath)) return path.resolve(fullPath);
        }
    }

    return null;
}

/**
 * Resolve full path to a MEGAcmd executable (or .bat / .cmd on Windows).
 */
function getMegaCmdPath(command) {
    const fullPath = findMegaCommandPath(command);
    if (fullPath) return fullPath;
    return commandName(command);
}

/**
 * Validate MEGAcmd at startup and return the path (or null). Logs result.
 */
function validateAndLogMegaPath() {
    const putPath = getMegaCmdPath('mega-put');
    if (path.isAbsolute(putPath)) {
        console.log('[MEGAcmd] Resolved:', putPath);
        return putPath;
    }
    const envPath = process.env.MEGA_CMD_PATH;
    const userProfile = process.env.USERPROFILE || process.env.HOME;
    const defaultPath = userProfile ? path.join(userProfile, 'AppData', 'Local', 'MEGAcmd') : '';
    console.warn('[MEGAcmd] Not found. MEGA_CMD_PATH=' + (envPath || '(not set)') + ', USERPROFILE=' + (userProfile || '(not set)'));
    if (defaultPath) console.warn('[MEGAcmd] Check that mega-put.exe or mega-put.bat exists in:', defaultPath);
    console.warn('[MEGAcmd] Set MEGA_CMD_PATH in backend/.env to the folder that contains mega-put (as .exe or .bat). Example: MEGA_CMD_PATH=C:/Users/Meghana Rodd/AppData/Local/MEGAcmd');
    return null;
}

function quotePathForShell(filePath) {
    if (!filePath || process.platform !== 'win32') return filePath;
    return `"${String(filePath).replace(/"/g, '""')}"`;
}

function getMegaCmdPathForSpawn(command) {
    const resolved = getMegaCmdPath(command);
    if (isWin && path.isAbsolute(resolved)) {
        return { path: resolved, useShell: false, useCmd: true };
    }
    return { path: resolved, useShell: true, useCmd: false };
}

module.exports = { getMegaCmdPath, getMegaCmdPathForSpawn, quotePathForShell, validateAndLogMegaPath };
