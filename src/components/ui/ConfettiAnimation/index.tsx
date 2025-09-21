import React, { useEffect, useState } from 'react';
import styles from './styles.module.scss';

interface ConfettiAnimationProps {
  show: boolean;
  duration?: number;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ 
  show, 
  duration = 4000 
}) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    emoji: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    delay: number;
    duration: number;
    rotation: number;
    scale: number;
  }>>([]);

  const emojis = ['🎉', '🎊', '✨', '🎈', '🌟'];

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 30 }, (_, i) => {
        const isLeftCorner = i < 15;
        const startX = isLeftCorner ? Math.random() * 20 : 80 + Math.random() * 20;
        const startY = 80 + Math.random() * 20;
        
        return {
          id: i,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          startX,
          startY,
          endX: 20 + Math.random() * 60,
          endY: -10 - Math.random() * 20,
          delay: Math.random() * 1000,
          duration: 3000 + Math.random() * 2000,
          rotation: Math.random() * 720,
          scale: 0.8 + Math.random() * 0.4
        };
      });
      
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!show) return null;

  return (
    <div className={styles.confettiContainer}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={styles.confettiParticle}
          style={{
            '--start-x': `${particle.startX}%`,
            '--start-y': `${particle.startY}%`,
            '--end-x': `${particle.endX}%`,
            '--end-y': `${particle.endY}%`,
            '--rotation': `${particle.rotation}deg`,
            '--scale': particle.scale,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          } as React.CSSProperties}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
};

export default ConfettiAnimation;