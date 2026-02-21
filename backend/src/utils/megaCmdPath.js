const path = require('path');

/**
 * Resolve path to a MEGAcmd executable (mega-put, mega-export, etc.).
 * If MEGA_CMD_PATH is set in .env, it should be the MEGAcmd install folder
 * (e.g. "C:\\Program Files\\MEGAcmd" on Windows). Then Node can find the exe
 * even when MEGAcmd is not on the system PATH.
 */
function getMegaCmdPath(command) {
    const base = process.env.MEGA_CMD_PATH;
    const isWin = process.platform === 'win32';
    const ext = isWin ? '.exe' : '';
    if (base) {
        return path.join(base.trim(), command + ext);
    }
    return command;
}

module.exports = { getMegaCmdPath };
