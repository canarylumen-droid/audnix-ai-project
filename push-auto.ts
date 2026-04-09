import { spawn } from 'child_process';

const p = spawn('npx.cmd', ['drizzle-kit', 'push', '--force'], {
  cwd: process.cwd(),
  shell: true,
});

p.stdout.on('data', (d) => {
  const output = d.toString();
  process.stdout.write(output);
  
  if (output.includes('?') || output.includes('rename table') || output.includes('create table') || output.includes('from another table')) {
    // Only send the enter key when a prompt is detected
    p.stdin.write('\r\n');
  }
});

p.stderr.on('data', (d) => {
  console.error('STDERR:', d.toString());
});

p.on('exit', (code) => console.log('Push sequence done with code:', code));
