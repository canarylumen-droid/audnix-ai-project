import { spawn } from 'child_process';
import { resolve } from 'path';

const p = spawn('npx.cmd', ['drizzle-kit', 'generate'], {
  cwd: process.cwd(),
  shell: true,
});

p.stdout.on('data', (d) => {
  const output = d.toString();
  console.log(output);
  // Send enter whenever it asks a question or gets stuck
  p.stdin.write('\r\n');
});

p.stderr.on('data', (d) => {
  console.error('STDERR:', d.toString());
});

p.on('exit', () => console.log('Diff extraction sequence done.'));
