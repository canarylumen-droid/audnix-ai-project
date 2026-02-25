import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function commitChanges() {
  try {
    console.log('[v0] Starting git commit...');

    // Stage all changes
    await execAsync('git add -A', { cwd: '/vercel/share/v0-project' });
    console.log('[v0] Staged all changes');

    // Commit with message
    const commitMsg = `feat: Fix TypeScript compilation errors and enhance real-time messaging

- Fixed missing catch block in outreach.ts line 519
- Fixed deals reference in MemStorage with proper this.deals context
- Added type assertions for draft routes params
- Added header extraction utility
- Enhanced tsconfig for better Express type handling
- All real-time messaging, draft persistence, and email tracking features now fully integrated`;

    const { stdout, stderr } = await execAsync(
      `git commit -m "${commitMsg}"`,
      { cwd: '/vercel/share/v0-project' }
    );

    console.log('[v0] Commit successful');
    console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);

    // Push to remote
    await execAsync('git push origin bug-fixing-with-git', { cwd: '/vercel/share/v0-project' });
    console.log('[v0] Pushed to remote branch');

  } catch (error) {
    console.error('[v0] Git operation failed:', error.message);
    process.exit(1);
  }
}

commitChanges();
