const { spawn } = require('child_process');

function runScript(scriptPath, env = {}) {
    return new Promise((resolve, reject) => {
        const process = spawn('node', [scriptPath], {
            stdio: 'inherit',
            env: { ...process.env, ...env }
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script ${scriptPath} exited with code ${code}`));
            }
        });

        process.on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    let mockServerProcess;

    try {
        console.log('Starting mock server...');
        mockServerProcess = spawn('node', ['scripts/mock_bhiv_server.cjs'], {
            stdio: 'inherit',
            env: { ...process.env, PORT: '8001' }
        });

        console.log('Waiting for mock server to start...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Running flow script...');
        await runScript('scripts/run_real_flow.js');

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        if (mockServerProcess) {
            console.log('Stopping mock server...');
            mockServerProcess.kill();
        }
    }
}

main();
