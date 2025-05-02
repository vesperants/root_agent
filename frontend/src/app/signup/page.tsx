// Updated: Uses English, improved error handling, and inline styles from new codebase
'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const saveUserProfile = async (userId: string, profileData: object) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        ...profileData,
        uid: userId,
        createdAt: serverTimestamp(),
      });
    } catch {
      setError('Could not save your profile, but the account was created.');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setRegistrationSuccess(false);

    if (!email || !password || !confirmPassword || !name) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsRegistering(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const profileData = {
        email: user.email,
        name,
        companyName,
        address,
        phoneNumber,
      };

      await saveUserProfile(user.uid, profileData);

      await updateProfile(user, { displayName: name });

      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });

      setRegistrationSuccess(true);
    } catch (err) {
      const firebaseError = err as AuthError;
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        default:
          setError('Registration failed. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>Registration Successful!</h2>
          <p>Your account has been created. Please check your email and click the verification link.</p>
          <p style={{ marginTop: 20, textAlign: 'center' }}>
            <Link href="/login" style={styles.button}>
              Go to Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>Create a New Account</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="name" style={styles.label}>
            Full Name: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isRegistering}
            style={styles.input}
          />

          <label htmlFor="email" style={styles.label}>
            Email: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isRegistering}
            style={styles.input}
          />

          <label htmlFor="password" style={styles.label}>
            Password: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            disabled={isRegistering}
            style={styles.input}
          />

          <label htmlFor="confirmPassword" style={styles.label}>
            Confirm Password: <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retype your password"
            required
            disabled={isRegistering}
            style={styles.input}
          />

          <label htmlFor="companyName" style={styles.label}>
            Company Name (optional):
          </label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={isRegistering}
            style={styles.input}
          />

          <label htmlFor="address" style={styles.label}>
            Address (optional):
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isRegistering}
            style={styles.input}
          />

          <label htmlFor="phoneNumber" style={styles.label}>
            Phone Number (optional):
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isRegistering}
            style={styles.input}
          />

          {error && (
            <p style={{ color: 'red', textAlign: 'center', marginBottom: 15 }}>{error}</p>
          )}

          <button type="submit" style={styles.button} disabled={isRegistering}>
            {isRegistering ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 30, textAlign: 'center' }}>
          Already have an account? <Link href="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

// Inline styles for the form and container
const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
  },
  container: {
    background: '#fff',
    padding: 32,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    fontWeight: 500,
    marginBottom: 4,
  },
  input: {
    padding: 8,
    borderRadius: 4,
    border: '1px solid #ccc',
    marginBottom: 8,
  },
  button: {
    background: '#2e7d32',
    color: '#fff',
    padding: '10px 0',
    border: 'none',
    borderRadius: 4,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 12,
    textDecoration: 'none',
    display: 'inline-block',
  },
};