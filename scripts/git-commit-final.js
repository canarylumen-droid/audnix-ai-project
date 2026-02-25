import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

process.chdir(projectRoot);

try {
  console.log('[v0] Staging all changes...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('[v0] Committing changes...');
  execSync('git commit -m "feat: implement real-time messaging with drafts, email tracking, and autonomous mode toggle\n\n- Add draft auto-save with debouncing to message_drafts table\n- Implement real-time conversation thread with WebSocket support\n- Add email tracking with open/click indicators and timestamps\n- Implement autonomous mode toggle in dashboard\n- Add real-time KPI dashboard and analytics updates\n- Create draft persistence API endpoints\n- Add email tracking listener hooks\n- Fix toggleAutonomousMode undefined error with proper mutation"', { stdio: 'inherit' });

  console.log('[v0] Pushing to remote...');
  execSync('git push origin HEAD', { stdio: 'inherit' });

  console.log('[v0] ✅ Successfully pushed all changes!');
} catch (error) {
  if (error && error.message && error.message.includes('nothing to commit')) {
    console.log('[v0] No changes to commit');
  } else {
    console.error('[v0] Error during git operations:', error);
    process.exit(1);
  }
}
