import { ApplicationConfig, provideZonelessChangeDetection, InjectionToken } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { environment } from '../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');

export const firebaseApp: FirebaseApp = initializeApp(environment.firebase);
export const firebaseAuth: Auth = getAuth(firebaseApp);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    { provide: FIREBASE_APP, useValue: firebaseApp },
    { provide: FIREBASE_AUTH, useValue: firebaseAuth },
  ]
};
