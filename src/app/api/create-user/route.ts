
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Make sure to set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// or have the SDK find credentials another way.
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}


export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    return NextResponse.json({ uid: userRecord.uid });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'An internal server error occurred.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'This email is already in use by another account.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = 'The password must be a string with at least six characters.';
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
