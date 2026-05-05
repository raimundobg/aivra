// One-off script to delete all Firebase Auth users.
// Usage: node scripts/wipe-auth.js
// Requires: gcloud auth application-default login  (or GOOGLE_APPLICATION_CREDENTIALS env var)
const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'aivra-370c4' });

async function deleteAllUsers(nextPageToken) {
  const result = await admin.auth().listUsers(1000, nextPageToken);
  if (result.users.length === 0) {
    console.log('No more users to delete.');
    return;
  }
  const uids = result.users.map(u => u.uid);
  console.log(`Deleting ${uids.length} users:`, result.users.map(u => u.email || u.uid));
  const deleteResult = await admin.auth().deleteUsers(uids);
  console.log(`  ✓ Deleted: ${deleteResult.successCount}, ✗ Failed: ${deleteResult.failureCount}`);
  if (deleteResult.errors.length > 0) {
    deleteResult.errors.forEach(e => console.error('  Error:', e.error.message));
  }
  if (result.pageToken) {
    await deleteAllUsers(result.pageToken);
  }
}

deleteAllUsers()
  .then(() => { console.log('✓ All users deleted.'); process.exit(0); })
  .catch(err => { console.error('FAILED:', err); process.exit(1); });
