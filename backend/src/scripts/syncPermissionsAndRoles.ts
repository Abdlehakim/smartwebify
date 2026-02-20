// scripts/syncPermissionsAndRoles.ts

import { createOrUpdatePermissions } from './createOrUpdatePermissions';
import { initializeDefaultRoles } from './initRoles';

(async () => {
  const changesMade = await createOrUpdatePermissions();
  if (changesMade) {
    await initializeDefaultRoles();
  } else {
    console.log('🟡 Skipped SuperAdmin role update – no permission changes detected.');
  }
})();
