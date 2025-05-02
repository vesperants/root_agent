//src/app/login/page.tsx

'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && user.emailVerified) {
      router.push('/chat');
    } else if (user && !user.emailVerified) {
      auth.signOut();
    }
  }, [user, loading, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    if (!email || !password) {
      setError('Please fill out both email and password.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setError('Your email is not verified. Please check your inbox.');
        await auth.signOut();
      }
    } catch (err) {
      const firebaseError = err as AuthError;
      if (
        firebaseError.code === 'auth/user-not-found' ||
        firebaseError.code === 'auth/wrong-password' ||
        firebaseError.code === 'auth/invalid-credential'
      ) {
        setError('Incorrect email or password.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div
        className="container container--narrow"
        style={{ position: 'relative', paddingTop: '60px', width: '50%' }}
      >
        <h1 className="page-title">Login</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" className="field-label">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="search-box"
              disabled={isLoggingIn}
              placeholder="your@email.com"
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label htmlFor="password" className="field-label">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="search-box"
              disabled={isLoggingIn}
              placeholder="********"
            />
          </div>
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
          <div className="button-container" style={{ marginTop: '0' }}>
            <button type="submit" className="button button-search" disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <p style={{ marginTop: '30px', textAlign: 'center' }}>
          Don&apos;t have an account? <Link href="/signup" className="link">Register here</Link>
        </p>
      </div>
    </div>
  );
}