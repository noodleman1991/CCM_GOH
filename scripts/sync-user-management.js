const { execSync } = require('child_process');
const path = require('path');

console.log('Running user management sync script...');

try {
  // Run the Next.js API route to trigger the sync
  const result = execSync(`curl -X POST http://localhost:3000/api/sync/user-management`, {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..')
  });

  console.log('Sync result:', result);
} catch (error) {
  console.error('Sync failed:', error.message);

  // Fallback: Create a temporary Next.js script
  console.log('Creating temporary sync endpoint...');

  const apiRouteContent = `
import { syncUserManagementToSanity } from '@/lib/actions/sync-user-management'

export async function POST() {
  try {
    const result = await syncUserManagementToSanity()
    return Response.json(result)
  } catch (error) {
    console.error('Sync error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
`;

  const fs = require('fs');
  const apiDir = path.resolve(__dirname, '..', 'app', 'api', 'sync');

  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  fs.writeFileSync(path.join(apiDir, 'user-management', 'route.ts'), apiRouteContent);
  console.log('Created sync API endpoint. Please run the development server and call POST /api/sync/user-management');
}