import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocFromServer,
  getDocs,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import firebaseConfigData from "../../firebase-applet-config.json";
import { Pengaturan } from "../types";

function isPlaceholderConfigValue(val: string): boolean {
  const normalized = val.trim();
  if (!normalized) return true;
  const lower = normalized.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "remixed-project-id") return true;
  if (normalized.startsWith("MY_") || normalized.startsWith("YOUR_")) return true;
  return false;
}

function pickConfigValue(...candidates: Array<unknown>): string {
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (!isPlaceholderConfigValue(trimmed)) {
        return trimmed;
      }
    }
  }
  return "";
}

const resolvedProjectId = pickConfigValue(
  import.meta.env.VITE_PENGATURAN_FIREBASE_PROJECT_ID,
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  firebaseConfigData.projectId
);

// Firebase Configuration dynamically resolved from Environment Variables or built-in provisioned config
const firebaseConfig = {
  apiKey: pickConfigValue(
    import.meta.env.VITE_PENGATURAN_FIREBASE_API_KEY,
    import.meta.env.VITE_FIREBASE_API_KEY,
    firebaseConfigData.apiKey
  ),
  authDomain: pickConfigValue(
    import.meta.env.VITE_PENGATURAN_FIREBASE_AUTH_DOMAIN,
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    firebaseConfigData.authDomain
  ),
  projectId: resolvedProjectId,
  storageBucket: pickConfigValue(
    import.meta.env.VITE_PENGATURAN_FIREBASE_STORAGE_BUCKET,
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    firebaseConfigData.storageBucket
  ),
  messagingSenderId: pickConfigValue(
    import.meta.env.VITE_PENGATURAN_FIREBASE_MESSAGING_SENDER_ID,
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    firebaseConfigData.messagingSenderId
  ),
  appId: pickConfigValue(
    import.meta.env.VITE_PENGATURAN_FIREBASE_APP_ID,
    import.meta.env.VITE_FIREBASE_APP_ID,
    firebaseConfigData.appId
  )
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Firestore database instance using explicit provisioned database ID (or "(default)" if switching to another custom project without explicit DB ID)
const explicitDbId = pickConfigValue(
  import.meta.env.VITE_PENGATURAN_FIREBASE_DATABASE_ID,
  import.meta.env.VITE_FIREBASE_DATABASE_ID
);
const defaultDbId =
  resolvedProjectId === firebaseConfigData.projectId
    ? pickConfigValue(firebaseConfigData.firestoreDatabaseId, "(default)")
    : "(default)";
const dbId = explicitDbId || defaultDbId;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true
    },
    dbId
  );
} catch {
  firestoreInstance = getFirestore(app, dbId);
}

export const firestore = firestoreInstance;

export function getFirebaseConnectionInfo() {
  const isConfigured = Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      !isPlaceholderConfigValue(firebaseConfig.projectId)
  );
  return {
    isConfigured,
    projectId: firebaseConfig.projectId,
    databaseId: dbId
  };
}

// Collections references
export const COLLECTIONS = {
  SISWA: "data_siswa",
  MAPEL: "mapel",
  JADWAL: "jadwal",
  LOG_ABSENSI: "log_absensi",
  DATA_NILAI: "data_nilai",
  JURNAL_AGENDA: "jurnal_agenda",
  SISWA_BIMBINGAN: "siswa_bimbingan",
  BIMBINGAN_WALI: "bimbingan_wali",
  PENGATURAN: "pengaturan"
} as const;

// Blueprint Validation Constants (synchronized verbatim with firebase-blueprint.json and firestore.rules)
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ID_MAX_LENGTH = 128;
export const MAX_LOGO_LENGTH = 400000;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate live Firestore server reachability on boot
export async function verifyFirestoreConnection(): Promise<{ reachable: boolean; error?: string }> {
  const { isConfigured } = getFirebaseConnectionInfo();
  if (!isConfigured) {
    console.error("Please check your Firebase configuration.");
    return { reachable: false, error: "Konfigurasi Firebase belum lengkap." };
  }
  try {
    await getDocFromServer(doc(firestore, "test", "connection"));
    return { reachable: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("the client is offline") || msg.includes("Could not reach Cloud Firestore backend")) {
      console.error("Please check your Firebase configuration.");
      return { reachable: false, error: msg };
    }
    // Permission denied from server confirms Firestore backend is reachable and enforcing rules
    return { reachable: true };
  }
}

async function testConnection() {
  await verifyFirestoreConnection();
}
void testConnection();

/**
 * Generates deterministic Firestore-safe document IDs matching ^[a-zA-Z0-9_-]+$ within 128 chars.
 */
export function buildSafeDocId(...parts: Array<string | number>): string {
  const raw = parts
    .map((p) => String(p ?? "").trim().replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""))
    .filter(Boolean)
    .join("_");
  const base = raw || `doc_${Date.now()}`;
  if (base.length <= ID_MAX_LENGTH) return base;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  }
  const suffix = `_${Math.abs(hash).toString(36)}`;
  return base.slice(0, ID_MAX_LENGTH - suffix.length) + suffix;
}

function clampString(val: unknown, maxLen: number, fallback = ""): string {
  const s = typeof val === "string" ? val : val == null ? fallback : String(val);
  return s.slice(0, maxLen);
}

function clampRequiredString(val: unknown, maxLen: number, fallback = "-"): string {
  const trimmed = clampString(val, maxLen).trim();
  return trimmed.length > 0 ? trimmed : fallback.slice(0, maxLen);
}

function resolveDocId(rawId: string): string {
  const trimmed = String(rawId || "").trim();
  if (ID_PATTERN.test(trimmed) && trimmed.length >= 1 && trimmed.length <= ID_MAX_LENGTH) {
    return trimmed;
  }
  return buildSafeDocId(trimmed);
}

function sanitizeEntityPayload(collectionName: string, docId: string, data: Record<string, any>, uid: string): Record<string, any> {
  const baseMeta = {
    id: docId,
    userUid: uid,
    updatedAt: serverTimestamp()
  };

  switch (collectionName) {
    case COLLECTIONS.SISWA:
      return {
        ...baseMeta,
        nisn: clampRequiredString(data.nisn, 50),
        nama: clampRequiredString(data.nama, 200),
        kelas: clampRequiredString(data.kelas, 50)
      };

    case COLLECTIONS.MAPEL: {
      const sem = clampRequiredString(data.semester, 30, "Ganjil");
      return {
        ...baseMeta,
        namaMapel: clampRequiredString(data.namaMapel, 200),
        semester: sem === "Genap" ? "Genap" : "Ganjil",
        tahunAjaran: clampRequiredString(data.tahunAjaran, 30, "2026/2027")
      };
    }

    case COLLECTIONS.JADWAL: {
      const allowedDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
      const hariVal = clampRequiredString(data.hari, 20, "Senin");
      return {
        ...baseMeta,
        hari: allowedDays.includes(hariVal) ? hariVal : "Senin",
        jam: clampRequiredString(data.jam, 50, "07:30 - 09:00"),
        kelas: clampRequiredString(data.kelas, 50),
        mapel: clampRequiredString(data.mapel, 200)
      };
    }

    case COLLECTIONS.LOG_ABSENSI: {
      const allowedStatuses = ["Hadir", "Izin", "Sakit", "Alpa"];
      const statusVal = clampRequiredString(data.status, 20, "Hadir");
      const dateStr = clampRequiredString(data.tanggal || data.waktu, 30, new Date().toISOString().split("T")[0]);
      const dateParts = dateStr.split("-");
      return {
        ...baseMeta,
        waktu: clampRequiredString(data.waktu || dateStr, 30, dateStr),
        tanggal: dateStr,
        kelas: clampRequiredString(data.kelas, 50),
        mapel: clampRequiredString(data.mapel, 200, "Absensi QR"),
        idSiswa: resolveDocId(String(data.idSiswa || docId)),
        namaSiswa: clampRequiredString(data.namaSiswa, 200),
        status: allowedStatuses.includes(statusVal) ? statusVal : "Hadir",
        bulan: clampRequiredString(data.bulan || dateParts[1], 20, "01"),
        tahun: clampRequiredString(data.tahun || dateParts[0], 20, "2026"),
        namaGuru: clampRequiredString(data.namaGuru, 200, "Guru")
      };
    }

    case COLLECTIONS.DATA_NILAI: {
      let safeNilai: number | "" = "";
      if (data.nilai !== "" && data.nilai !== null && data.nilai !== undefined && !isNaN(Number(data.nilai))) {
        safeNilai = Math.min(100, Math.max(0, Number(data.nilai)));
      }
      return {
        ...baseMeta,
        waktu: clampString(data.waktu, 30, ""),
        jenis: clampRequiredString(data.jenis, 100, "UH 1"),
        mapel: clampRequiredString(data.mapel, 200),
        kelas: clampRequiredString(data.kelas, 50),
        idSiswa: resolveDocId(String(data.idSiswa || docId)),
        namaSiswa: clampRequiredString(data.namaSiswa, 200),
        nilai: safeNilai,
        namaGuru: clampRequiredString(data.namaGuru, 200, "Guru")
      };
    }

    case COLLECTIONS.JURNAL_AGENDA: {
      const statusVal = clampRequiredString(data.status, 50, "Terlaksana");
      const payload: Record<string, any> = {
        ...baseMeta,
        tanggal: clampRequiredString(data.tanggal, 30, new Date().toISOString().split("T")[0]),
        jam: clampRequiredString(data.jam, 50, "1-2"),
        kelas: clampRequiredString(data.kelas, 50),
        mapel: clampRequiredString(data.mapel, 200),
        materi: clampRequiredString(data.materi, 2000),
        status: statusVal === "Tunda" ? "Tunda" : "Terlaksana",
        absenSiswa: clampString(data.absenSiswa, 500, ""),
        namaGuru: clampRequiredString(data.namaGuru, 200, "Guru")
      };
      if (data.ket !== undefined) {
        payload.ket = clampString(data.ket, 1000, "");
      }
      return payload;
    }

    case COLLECTIONS.SISWA_BIMBINGAN:
      return {
        ...baseMeta,
        namaSiswa: clampRequiredString(data.namaSiswa, 200),
        kelas: clampRequiredString(data.kelas, 50)
      };

    case COLLECTIONS.BIMBINGAN_WALI:
      return {
        ...baseMeta,
        tanggal: clampRequiredString(data.tanggal, 30, new Date().toISOString().split("T")[0]),
        namaSiswa: clampRequiredString(data.namaSiswa, 200),
        kelas: clampString(data.kelas, 50, ""),
        jenis: clampRequiredString(data.jenis, 100, "Akademik"),
        kasus: clampRequiredString(data.kasus, 2000),
        tindakLanjut: clampRequiredString(data.tindakLanjut, 2000),
        guruWali: clampRequiredString(data.guruWali, 200, "Guru Wali")
      };

    default: {
      const cleaned: Record<string, any> = { ...baseMeta };
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined) cleaned[k] = v;
      });
      return cleaned;
    }
  }
}

function sanitizePengaturanPayload(config: Partial<Pengaturan>, uid: string): Record<string, any> {
  const logoKiri = clampString(config.Logo_Kiri, MAX_LOGO_LENGTH, "");
  const logoKanan = clampString(config.Logo_Kanan, MAX_LOGO_LENGTH, "");

  if (typeof config.Logo_Kiri === "string" && config.Logo_Kiri.length > MAX_LOGO_LENGTH) {
    throw new Error("Ukuran Logo Dinas terlalu besar (maks. ~300KB). Silakan pilih gambar yang lebih kecil.");
  }
  if (typeof config.Logo_Kanan === "string" && config.Logo_Kanan.length > MAX_LOGO_LENGTH) {
    throw new Error("Ukuran Logo Sekolah terlalu besar (maks. ~300KB). Silakan pilih gambar yang lebih kecil.");
  }

  const payload: Record<string, any> = {
    Nama_Guru: clampString(config.Nama_Guru, 200, ""),
    NIP_Guru: clampString(config.NIP_Guru, 100, ""),
    Pemerintah: clampString(config.Pemerintah, 200, ""),
    Nama_Sekolah: clampString(config.Nama_Sekolah, 200, ""),
    Alamat_Sekolah: clampString(config.Alamat_Sekolah, 500, ""),
    Nama_Kepsek: clampString(config.Nama_Kepsek, 200, ""),
    NIP_Kepsek: clampString(config.NIP_Kepsek, 100, ""),
    Tempat_Tanda_Tangan: clampString(config.Tempat_Tanda_Tangan, 150, ""),
    Logo_Kiri: logoKiri,
    Logo_Kanan: logoKanan,
    userUid: uid,
    updatedAt: serverTimestamp()
  };

  if (config.username !== undefined) {
    payload.username = clampString(config.username, 100, "");
  }
  if (config.password !== undefined) {
    payload.password = clampString(config.password, 100, "");
  }
  if (config.isDatabaseCleared !== undefined) {
    payload.isDatabaseCleared = Boolean(config.isDatabaseCleared);
  }

  return payload;
}

/**
 * Get Current Active User UID from Firebase Auth (or fallback while auth state initializes)
 */
export function getCurrentUserUid(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  if (typeof window !== "undefined") {
    try {
      const storedUid = localStorage.getItem("edadmin_user_uid");
      if (storedUid) return storedUid;
      const stored = localStorage.getItem("edadmin_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.uid) return parsed.uid;
      }
    } catch {}
  }
  return "";
}

function syncUserLocalStorage(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("edadmin_user_uid", user.uid);
    localStorage.setItem(
      "edadmin_user",
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email || "Pengguna Google",
        photoURL: user.photoURL || "",
        provider: "google"
      })
    );
  } else {
    localStorage.removeItem("edadmin_auth_token");
    localStorage.removeItem("edadmin_user");
    localStorage.removeItem("edadmin_user_uid");
  }
  window.dispatchEvent(new Event("storage"));
}

/**
 * Sign in with Google Popup via Firebase Authentication
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();
    if (typeof window !== "undefined") {
      localStorage.setItem("edadmin_auth_token", token);
    }
    syncUserLocalStorage(user);
    return user;
  } catch (error: any) {
    console.error("Firebase Google Sign-In error:", error);
    throw error;
  }
}

/**
 * Sign out from Firebase Auth and clear local credentials
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("SignOut notice:", err);
  } finally {
    syncUserLocalStorage(null);
  }
}

/**
 * Listen to Firebase Auth state changes and keep local session synchronized
 */
export function onAuthUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        if (typeof window !== "undefined") {
          localStorage.setItem("edadmin_auth_token", token);
        }
      } catch {}
      syncUserLocalStorage(user);
    } else {
      syncUserLocalStorage(null);
    }
    callback(user);
  });
}

export function checkDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  if (!auth.currentUser) {
    return { authorized: false, reason: "Belum masuk dengan Akun Google." };
  }
  return { authorized: true };
}

export function checkPengaturanDatabaseAuthorization(): { authorized: boolean; reason?: string } {
  return checkDatabaseAuthorization();
}

// User-scoped Collection Reference
export function getUserCollectionRef(collectionName: string, uid?: string) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  return collection(firestore, "users", targetUid, collectionName);
}

// User-scoped Document Reference
export function getUserDocRef(collectionName: string, docId: string, uid?: string) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  return doc(firestore, "users", targetUid, collectionName, docId);
}

// Realtime Subscription to user-scoped Firestore collection
export function subscribeCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  uid?: string,
  onError?: (error: Error) => void
) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  if (!targetUid) {
    return () => {};
  }

  const path = `users/${targetUid}/${collectionName}`;
  const colRef = collection(firestore, "users", targetUid, collectionName);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      callback(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrappedErr: any) {
        onError?.(wrappedErr);
      }
    }
  );
}

// Single Document Save/Update with user isolation and defensive sanitization
export async function saveDocument(collectionName: string, id: string, data: Record<string, any>, uid?: string) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  if (!targetUid) {
    throw new Error("Sesi akun Google tidak aktif. Silakan masuk ulang.");
  }

  const safeId = resolveDocId(id);
  const path = `users/${targetUid}/${collectionName}/${safeId}`;
  const payload = sanitizeEntityPayload(collectionName, safeId, data, targetUid);

  try {
    const docRef = doc(firestore, "users", targetUid, collectionName, safeId);
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Single Document Delete with user isolation
export async function deleteDocument(collectionName: string, id: string, uid?: string) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  if (!targetUid) {
    throw new Error("Sesi akun Google tidak aktif. Silakan masuk ulang.");
  }

  const safeId = resolveDocId(id);
  const path = `users/${targetUid}/${collectionName}/${safeId}`;

  try {
    const docRef = doc(firestore, "users", targetUid, collectionName, safeId);
    await deleteDoc(docRef);
  } catch (err: any) {
    if (err?.code === "not-found" || err?.message?.includes("not found")) {
      return;
    }
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Batch Save Documents with user isolation and chunked commits
export async function batchSaveDocuments(
  collectionName: string,
  items: Array<{ id: string; [key: string]: any }>,
  uid?: string
) {
  if (!items || items.length === 0) return;
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  if (!targetUid) {
    throw new Error("Sesi akun Google tidak aktif. Silakan masuk ulang.");
  }

  const path = `users/${targetUid}/${collectionName}`;

  try {
    for (let i = 0; i < items.length; i += 400) {
      const chunk = items.slice(i, i + 400);
      const batch = writeBatch(firestore);
      chunk.forEach((item) => {
        const safeId = resolveDocId(item.id);
        const docRef = doc(firestore, "users", targetUid, collectionName, safeId);
        const payload = sanitizeEntityPayload(collectionName, safeId, item, targetUid);
        batch.set(docRef, payload, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Pengaturan special helper (Doc ID: "config") with user isolation
export async function savePengaturan(config: Pengaturan, uid?: string) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  if (!targetUid) {
    throw new Error("Sesi akun Google tidak aktif. Silakan masuk ulang.");
  }

  const path = `users/${targetUid}/${COLLECTIONS.PENGATURAN}/config`;
  const payload = sanitizePengaturanPayload(config, targetUid);

  try {
    const docRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribePengaturan(
  callback: (config: Pengaturan, exists: boolean) => void,
  uid?: string,
  onError?: (error: Error) => void
) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  if (!targetUid) {
    return () => {};
  }

  const path = `users/${targetUid}/${COLLECTIONS.PENGATURAN}/config`;
  const docRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Pengaturan, true);
      } else {
        callback({} as Pengaturan, false);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrappedErr: any) {
        onError?.(wrappedErr);
      }
    }
  );
}

// Clear / Wipe All Collections in Database for the logged-in User
export async function clearAllDatabaseCollections(uid?: string) {
  const targetUid = auth.currentUser?.uid || uid || getCurrentUserUid();
  if (!targetUid) {
    throw new Error("Sesi akun Google tidak aktif. Silakan masuk ulang.");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(`edadmin_database_cleared_${targetUid}`, "true");
  }

  const collectionsToClear = [
    COLLECTIONS.SISWA,
    COLLECTIONS.MAPEL,
    COLLECTIONS.JADWAL,
    COLLECTIONS.LOG_ABSENSI,
    COLLECTIONS.DATA_NILAI,
    COLLECTIONS.JURNAL_AGENDA,
    COLLECTIONS.SISWA_BIMBINGAN,
    COLLECTIONS.BIMBINGAN_WALI
  ];

  // Mark config as cleared without erasing profile/letterhead settings
  const configPath = `users/${targetUid}/${COLLECTIONS.PENGATURAN}/config`;
  const configDocRef = doc(firestore, "users", targetUid, COLLECTIONS.PENGATURAN, "config");
  try {
    const configSnap = await getDoc(configDocRef);
    if (configSnap.exists()) {
      await updateDoc(configDocRef, {
        isDatabaseCleared: true,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(configDocRef, sanitizePengaturanPayload({ isDatabaseCleared: true }, targetUid));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, configPath);
  }

  // Delete all documents in every operational collection under users/{targetUid}
  for (const colName of collectionsToClear) {
    const colPath = `users/${targetUid}/${colName}`;
    try {
      const colRef = collection(firestore, "users", targetUid, colName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 200) {
          const chunk = docs.slice(i, i + 200);
          const batch = writeBatch(firestore);
          chunk.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, colPath);
    }
  }
}
