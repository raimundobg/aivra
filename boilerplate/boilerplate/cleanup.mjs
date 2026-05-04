import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Use firebase-admin from functions/node_modules
const admin = require('./functions/node_modules/firebase-admin')

const UIDS = [
  'Blz9bqGxoWPUtNKc2cTG5QySUMA2', // rburchardtg@gmail.com
  'C5WatjQvkuREssLhoqgnNa59xp92',  // rburchardt@fresherb.io
  'hzC1kBOdDXe9BMgWNDRxyCIfHfh1',  // info@fresherb.io
]

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'aivra-370c4',
})

const auth = admin.auth()
const db = admin.firestore()

async function deleteSubcollection(ref) {
  const snap = await ref.limit(200).get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

async function deleteUserData(uid) {
  console.log(`\nCleaning Firestore for ${uid}...`)
  for (const sub of ['mediciones', 'habits', 'pauta', 'intake']) {
    await deleteSubcollection(db.collection('users').doc(uid).collection(sub))
  }
  await db.collection('users').doc(uid).delete()
  console.log(`  ✓ users/${uid}`)

  await deleteSubcollection(db.collection('conversations').doc(uid).collection('messages'))
  await db.collection('conversations').doc(uid).delete()
  console.log(`  ✓ conversations/${uid}`)
}

async function main() {
  for (const uid of UIDS) {
    await deleteUserData(uid)
    try {
      await auth.deleteUser(uid)
      console.log(`  ✓ Auth user deleted`)
    } catch (e) {
      console.log(`  ! Auth: ${e.message}`)
    }
  }
  console.log('\nDone.')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
