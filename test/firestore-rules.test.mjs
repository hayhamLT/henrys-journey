// Firestore security-rules tests for the leaderboard anti-cheat.
// Run against the emulator:  firebase emulators:exec --only firestore "node test/firestore-rules.test.mjs"
//
// Verifies the tournament + daily score rules: honest writes are allowed,
// inflated/forged/typed-wrong writes are denied. This is what lets us ship the
// rules change to live without risking a regression on legitimate scoring.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setDoc, doc, increment } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const testEnv = await initializeTestEnvironment({
  projectId: 'henrys-journey-rules-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8') },
});

let failures = 0;
const check = async (label, shouldPass, fn) => {
  try {
    await (shouldPass ? assertSucceeds(fn()) : assertFails(fn()));
    console.log(`  ✓ ${label}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${label} — ${e.message}`);
  }
};

const aliceDb = testEnv.authenticatedContext('alice').firestore();
const bobDb = testEnv.authenticatedContext('bob').firestore();

const tDoc = (db, uid) => doc(db, 'tournaments', 't1', 'scores', uid);
const dDoc = (db, uid) => doc(db, 'daily', '2026-06-16', 'scores', uid);
const meta = (name) => ({ name, photoURL: '', timestamp: 1700000000000 });

console.log('TOURNAMENT scores (increment-based):');
await check('honest create increment(300)', true,
  () => setDoc(tDoc(aliceDb, 'alice'), { ...meta('Alice'), score: increment(300) }));
await check('honest update increment(300) -> 600', true,
  () => setDoc(tDoc(aliceDb, 'alice'), { ...meta('Alice'), score: increment(300) }));
await check('CHEAT create increment(999999) blocked', false,
  () => setDoc(tDoc(bobDb, 'bob'), { ...meta('Bob'), score: increment(999999) }));
await check('CHEAT update jump increment(999999) blocked', false,
  () => setDoc(tDoc(aliceDb, 'alice'), { ...meta('Alice'), score: increment(999999) }));
await check('CHEAT write to another player (alice -> bob) blocked', false,
  () => setDoc(tDoc(aliceDb, 'bob'), { ...meta('Alice'), score: increment(100) }));
await check('CHEAT score as string blocked', false,
  () => setDoc(tDoc(bobDb, 'bob'), { ...meta('Bob'), score: '5000' }));

console.log('DAILY scores (direct value):');
await check('honest daily score 500', true,
  () => setDoc(dDoc(aliceDb, 'alice'), { ...meta('Alice'), score: 500, streak: 3 }));
await check('honest daily score at cap 20000', true,
  () => setDoc(dDoc(aliceDb, 'alice'), { ...meta('Alice'), score: 20000, streak: 3 }));
await check('CHEAT daily score 9999999 blocked', false,
  () => setDoc(dDoc(aliceDb, 'alice'), { ...meta('Alice'), score: 9999999, streak: 3 }));
await check('CHEAT daily write to another player blocked', false,
  () => setDoc(dDoc(aliceDb, 'bob'), { ...meta('Alice'), score: 100, streak: 0 }));
await check('CHEAT daily score as string blocked', false,
  () => setDoc(dDoc(aliceDb, 'alice'), { ...meta('Alice'), score: 'lots', streak: 0 }));

await testEnv.cleanup();
console.log(failures === 0 ? '\n✅ ALL RULE TESTS PASSED' : `\n❌ ${failures} RULE TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
