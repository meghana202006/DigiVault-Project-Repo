require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

// Use MEGA_CMD_PATH from .env (handles "Meghana Rodd" etc.)
const megaCmdDir = process.env.MEGA_CMD_PATH
    ? path.normalize(process.env.MEGA_CMD_PATH.replace(/\//g, path.sep))
    : path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'MEGAcmd');

// Path to an existing file in your MEGA account (for LS FILE and EXPORT tests)
const remotePath = `/u_8ea08341-1f17-483e-aad3-7f34b766b53b/Images/643c9f38-608c-430c-a47f-e61015519488_recovery.png`;

async function debugMega() {
    console.log('MEGA_CMD_PATH from .env:', process.env.MEGA_CMD_PATH);
    console.log('Resolved megaCmdDir:', megaCmdDir);

    const commands = [
        { name: 'WHOAMI', cmd: 'mega-whoami.bat', args: [] },
        { name: 'LS ROOT', cmd: 'mega-ls.bat', args: ['/'] },
        { name: 'LS USER FOLDER', cmd: 'mega-ls.bat', args: ['/u_8ea08341-1f17-483e-aad3-7f34b766b53b'] },
        { name: 'LS IMAGES', cmd: 'mega-ls.bat', args: ['/u_8ea08341-1f17-483e-aad3-7f34b766b53b/Images'] },
        { name: 'LS FILE (recovery.png)', cmd: 'mega-ls.bat', args: [remotePath] },
        { name: 'EXPORT', cmd: 'mega-export.bat', args: ['-a', remotePath] }
    ];

    for (const item of commands) {
        console.log(`\n--- Testing ${item.name} ---`);
        await new Promise((resolve) => {
            const fullCmd = `"${path.join(megaCmdDir, item.cmd)}"`;
            console.log('Running:', fullCmd, item.args.length ? item.args : '');
            const proc = spawn(fullCmd, item.args, { shell: true });

            proc.stdout.on('data', d => console.log(`STDOUT: ${d}`));
            proc.stderr.on('data', d => console.error(`STDERR: ${d}`));
            proc.on('close', (code) => {
                console.log(`Exit code: ${code}`);
                resolve();
            });
        });
    }
}

debugMega().catch((err) => {
    console.error(err);
    process.exit(1);
});
