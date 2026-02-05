'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from 'firebase/storage';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readFirebaseConfig(): FirebaseConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    throw new Error(
      'Firebase não configurado: defina NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID'
    );
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp();
  const firebaseConfig = readFirebaseConfig();
  return initializeApp(firebaseConfig);
}

export function getFirebaseStorage(): FirebaseStorage {
  const app = getFirebaseApp();
  return getStorage(app);
}

function safeName(name: string) {
  return String(name || 'file')
    .trim()
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 120);
}

export async function uploadToFirebaseStorage(params: {
  file: File;
  folder?: string; // ex.: "Postagem instagra"
  filenamePrefix?: string; // ex.: "1703123_abc"
}): Promise<{ downloadUrl: string; storagePath: string }> {
  const storage = getFirebaseStorage();
  const folder = (params.folder || 'Postagem instagra').replace(/^\/+|\/+$/g, '');
  const ts = Date.now();
  const prefix = params.filenamePrefix ? safeName(params.filenamePrefix) : `${ts}`;
  const objectName = `${prefix}_${Math.random().toString(36).slice(2, 8)}_${safeName(params.file.name)}`;
  const storagePath = `${folder}/${objectName}`;

  const storageRef = ref(storage, storagePath);
  const result = await uploadBytes(storageRef, params.file, {
    contentType: params.file.type || undefined,
    cacheControl: 'public, max-age=31536000, immutable',
  });
  const downloadUrl = await getDownloadURL(result.ref);
  return { downloadUrl, storagePath };
}



