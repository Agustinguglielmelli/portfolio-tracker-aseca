import { execFileSync } from 'node:child_process';

import './load-env';

export default async function globalSetup() {
  execFileSync(
    'npx',
    ['prisma', 'db', 'push', '--url', process.env.DATABASE_URL as string],
    {
      stdio: 'inherit',
      shell: true,
    },
  );
}
