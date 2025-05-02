'use client';
import React from 'react';
import styles from './ChatHeader.module.css';
import Image from 'next/image';

interface ChatHeaderProps {
  onProfileClick: () => void;
  profileImageUrl?: string;
  children?: React.ReactNode;
  title: string;
  onToggleShelfClick: () => void;
  isShelfOpen: boolean;
  avatarButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  children,
  // onProfileClick, // removed props related to removed buttons to clarify usage
  // profileImageUrl,
  // onToggleShelfClick,
  // isShelfOpen,
  // avatarButtonRef,
}) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.leftSection}>
        {/* Chatshelf toggle button removed */}
      </div>
      <h1 className={styles.headerTitle}>
        <span>{title}</span>
      </h1>
      <div className={styles.rightSection}>
        {children}
        {/* Profile button removed */}
      </div>
    </div>
  );
};

export default ChatHeader;