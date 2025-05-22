// scripts/start-dev.js
const { spawn } = require('child_process');

const nextCommandArgs = ['dev'];

// Extract port from arguments if IDX provided --port
// process.argv contains: ['node', 'scripts/start-dev.js', '--port', 'actual_port', '--host', '0.0.0.0']
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex > -1 && process.argv[portArgIndex + 1]) {
  nextCommandArgs.push('-p', process.argv[portArgIndex + 1]);
}
// If --port is not found, Next.js will automatically use process.env.PORT, which IDX also sets.

// Use the correct --hostname flag for Next.js
nextCommandArgs.push('-H', '0.0.0.0');

// You can re-add --turbo here if desired, once the base setup works
// nextCommandArgs.push('--turbo');

console.log(`Executing: npx next ${nextCommandArgs.join(' ')}`);

const child = spawn('npx', ['next', ...nextCommandArgs], { stdio: 'inherit' });

child.on('error', (error) => {
  console.error(`Failed to start Next.js subprocess: ${error}`);
});

child.on('exit', (code, signal) => {
  if (code) {
    console.error(`Next.js subprocess exited with code ${code}`);
  }
  if (signal) {
    console.error(`Next.js subprocess killed with signal ${signal}`);
  }
  process.exit(code || 1); // Exit with the child's code or 1 if signal
});
