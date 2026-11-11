# Security Specification & Payload-First TDD (`GuruDigitalLab.id SmansaterPRO`)

## 1. Data Invariants
1. **Strict Multi-Tenant Ownership Partitioning**: Every operational document belongs exclusively to an authenticated, email-verified user (`request.auth != null && request.auth.token.email_verified == true && request.auth.uid == userId`) under `/users/{userId}/{collection}/{docId}`. No cross-user read, list, create, update, or delete is permitted.
2. **Global Default-Deny Catch-All**: Any path outside the 9 explicitly declared user subcollections (`/users/{userId}/data_siswa`, `mapel`, `jadwal`, `log_absensi`, `data_nilai`, `jurnal_agenda`, `siswa_bimbingan`, `bimbingan_wali`, `pengaturan/config`) is denied unconditionally (`allow read, write: if false`).
3. **Document Identity & Referential Integrity**:
   - All document IDs (`{userId}`, `{siswaId}`, `{mapelId}`, `{jadwalId}`, `{absensiId}`, `{nilaiId}`, `{agendaId}`, `{siswaBimbinganId}`, `{bimbinganId}`) are guarded by `isValidId(id)`: `string`, length `1..128`, matching `^[a-zA-Z0-9_\-]+$`.
   - Every subcollection document strictly embeds `userUid == request.auth.uid` on creation and forbids changing `userUid` or `id` on update.
   - Singleton settings document only allows `configId == 'config'` (no list scraping, no sibling config docs).
4. **Strict Field Allowlisting (Anti-Ghost-Field) & Volumetric Bounds**:
   - All entities enforce `data.keys().hasAll(...)` and `data.keys().hasOnly(...)` on create and update, blocking arbitrary shadow fields (e.g., `isAdmin`, `role`).
   - Every string enforces explicit `.size()` boundaries (`Logo_Kiri` and `Logo_Kanan` capped at `400000` chars; standard fields capped at `20`–`2000` chars).
   - `nilai` in `data_nilai` strictly permits `number` in `[0, 100]` or `""` (ungraded).
   - Enums enforced on `mapel.semester` (`Ganjil`, `Genap`), `jadwal.hari` (`Senin`..`Minggu`), `log_absensi.status` (`Hadir`, `Izin`, `Sakit`, `Alpa`), and `jurnal_agenda.status` (`Terlaksana`, `Tunda`).
5. **Temporal Integrity**: `updatedAt` MUST equal `request.time` (Firestore `serverTimestamp()`) on every `create` and `update`. Client-supplied epoch integers or forged dates are rejected.
6. **Update-Gap Protection**: Every `allow update` validates `isValid[Entity](incoming(), ...)` first, asserts immutable `id`/`userUid` (and `idSiswa` on `log_absensi`/`data_nilai`), and checks `incoming().diff(existing()).affectedKeys().hasOnly(...)`.

---

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: `PERMISSION_DENIED`)

1. **Unauthenticated Read/Write**: `request.auth == null` attempting `get` or `create` at `/users/userA/data_siswa/1001`.
2. **Unverified Email Spoofing**: Authenticated user with `request.auth.token.email_verified == false` attempting write to `/users/userA/data_siswa/1001`.
3. **Cross-Tenant Read/List**: Signed-in `userB` (`uid: "userB"`) calling `list` on `/users/userA/data_siswa` or `get` on `/users/userA/pengaturan/config`.
4. **Identity Spoofing (`userUid`)**: Signed-in `userA` writing to `/users/userA/data_siswa/1001` with `{ "id": "1001", "nisn": "001", "nama": "X", "kelas": "X A", "userUid": "userB", "updatedAt": "<serverTimestamp>" }`.
5. **Shadow / Ghost Field Injection**: Signed-in `userA` creating `/users/userA/data_siswa/1001` with extra field `"isAdmin": true` or `"role": "superuser"`.
6. **ID Poisoning / Path Traversal Payload**: Attempting `create` at `/users/userA/data_siswa/invalid%20space_or_long_1500_chars` or mismatched `{ "id": "9999", ... }` at doc path `/1001`.
7. **Forged Client Timestamp**: Submitting `"updatedAt": 1700000000000` (number) or a past Firestore `Timestamp` instead of `request.time` (`serverTimestamp()`).
8. **Score Range / Type Poisoning (`data_nilai`)**: Writing `{ ..., "nilai": 9999 }` or `{ ..., "nilai": true }` to `/users/userA/data_nilai/val1`.
9. **Invalid Enum Injection (`log_absensi`, `mapel`, `jadwal`, `jurnal_agenda`)**: Writing `{ ..., "status": "Bypass" }` on `log_absensi` or `"semester": "Hack"` on `mapel`.
10. **Volumetric Exhaustion ("Denial of Wallet")**: Writing a 900KB `materi` string in `jurnal_agenda` or >400KB `Logo_Kiri` string in `pengaturan/config`.
11. **Singleton Doc Hijack (`pengaturan`)**: Writing to `/users/userA/pengaturan/evil_config` instead of `config`, or calling `list` on `/users/userA/pengaturan`.
12. **Immutable Key Tampering on Update**: Updating `/users/userA/log_absensi/rec1` attempting to mutate `idSiswa` or `userUid` alongside `status`.

---

## 3. Verification Runner (`firestore.rules.test.ts` Reference)

```ts
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

async function runSecurityTests() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'smansater-pro-sec-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });

  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const userADb = testEnv.authenticatedContext('userA', { email: 'guruA@school.id', email_verified: true }).firestore();
  const userBDb = testEnv.authenticatedContext('userB', { email: 'guruB@school.id', email_verified: true }).firestore();
  const unverifiedDb = testEnv.authenticatedContext('userA', { email: 'guruA@school.id', email_verified: false }).firestore();

  // #1 Unauthenticated
  await assertFails(setDoc(doc(unauthDb, 'users/userA/data_siswa/1001'), {
    id: '1001', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userA', updatedAt: serverTimestamp()
  }));

  // #2 Unverified email
  await assertFails(setDoc(doc(unverifiedDb, 'users/userA/data_siswa/1001'), {
    id: '1001', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userA', updatedAt: serverTimestamp()
  }));

  // #3 Cross-tenant list & get
  await assertFails(getDocs(collection(userBDb, 'users/userA/data_siswa')));
  await assertFails(getDoc(doc(userBDb, 'users/userA/pengaturan/config')));

  // #4 Identity spoofing
  await assertFails(setDoc(doc(userADb, 'users/userA/data_siswa/1001'), {
    id: '1001', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userB', updatedAt: serverTimestamp()
  }));

  // #5 Ghost field injection
  await assertFails(setDoc(doc(userADb, 'users/userA/data_siswa/1001'), {
    id: '1001', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userA', updatedAt: serverTimestamp(), isAdmin: true
  }));

  // #6 ID poisoning & mismatched ID
  await assertFails(setDoc(doc(userADb, 'users/userA/data_siswa/invalid space'), {
    id: 'invalid space', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userA', updatedAt: serverTimestamp()
  }));
  await assertFails(setDoc(doc(userADb, 'users/userA/data_siswa/1001'), {
    id: '9999', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userA', updatedAt: serverTimestamp()
  }));

  // #7 Forged timestamp
  await assertFails(setDoc(doc(userADb, 'users/userA/data_siswa/1001'), {
    id: '1001', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userA', updatedAt: 1700000000000
  }));

  // Valid create succeeds
  await assertSucceeds(setDoc(doc(userADb, 'users/userA/data_siswa/1001'), {
    id: '1001', nisn: '001', nama: 'Ahmad', kelas: 'X A', userUid: 'userA', updatedAt: serverTimestamp()
  }));

  // #8 Score poisoning
  await assertFails(setDoc(doc(userADb, 'users/userA/data_nilai/n1'), {
    id: 'n1', waktu: '2026-08-01', jenis: 'UH 1', mapel: 'Matematika', kelas: 'X A',
    idSiswa: '1001', namaSiswa: 'Ahmad', nilai: 9999, namaGuru: 'Guru', userUid: 'userA', updatedAt: serverTimestamp()
  }));

  // #9 Invalid enum
  await assertFails(setDoc(doc(userADb, 'users/userA/log_absensi/a1'), {
    id: 'a1', waktu: '2026-08-01', tanggal: '2026-08-01', kelas: 'X A', mapel: 'Matematika',
    idSiswa: '1001', namaSiswa: 'Ahmad', status: 'Bypass', bulan: '08', tahun: '2026', namaGuru: 'Guru',
    userUid: 'userA', updatedAt: serverTimestamp()
  }));

  // #10 Oversized payload
  await assertFails(setDoc(doc(userADb, 'users/userA/jurnal_agenda/ag1'), {
    id: 'ag1', tanggal: '2026-08-01', jam: '1-2', kelas: 'X A', mapel: 'Matematika',
    materi: 'x'.repeat(5000), status: 'Terlaksana', absenSiswa: 'Nihil', namaGuru: 'Guru',
    userUid: 'userA', updatedAt: serverTimestamp()
  }));

  // #11 Singleton doc hijack & list
  await assertFails(setDoc(doc(userADb, 'users/userA/pengaturan/evil'), {
    Nama_Guru: 'A', NIP_Guru: '', Pemerintah: '', Nama_Sekolah: '', Alamat_Sekolah: '',
    Nama_Kepsek: '', NIP_Kepsek: '', Tempat_Tanda_Tangan: '', Logo_Kiri: '', Logo_Kanan: '',
    userUid: 'userA', updatedAt: serverTimestamp()
  }));
  await assertFails(getDocs(collection(userADb, 'users/userA/pengaturan')));

  // #12 Immutable field tampering on update
  await assertSucceeds(setDoc(doc(userADb, 'users/userA/log_absensi/a1'), {
    id: 'a1', waktu: '2026-08-01', tanggal: '2026-08-01', kelas: 'X A', mapel: 'Matematika',
    idSiswa: '1001', namaSiswa: 'Ahmad', status: 'Hadir', bulan: '08', tahun: '2026', namaGuru: 'Guru',
    userUid: 'userA', updatedAt: serverTimestamp()
  }));
  await assertFails(updateDoc(doc(userADb, 'users/userA/log_absensi/a1'), {
    idSiswa: '9999', status: 'Izin', updatedAt: serverTimestamp()
  }));

  await testEnv.cleanup();
}
```
