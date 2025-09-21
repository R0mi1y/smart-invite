import React from 'react';
import styles from './styles.module.scss';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Carregando...', 
  size = 'medium',
  overlay = false 
}) => {
  const containerClass = overlay ? styles.overlayContainer : styles.container;
  const spinnerClass = `${styles.spinner} ${styles[size]}`;

  return (
    <div className={containerClass}>
      <div className={styles.loadingContent}>
        <div className={spinnerClass}>
          <div className={styles.spinnerInner}></div>
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
