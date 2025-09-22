import React, { useState, useEffect } from 'react';
import styles from './styles.module.scss';
import { safeWindow } from '../../utils/domUtils';

interface CustomImage {
  url: string;
  position: 'center-top' | 'center-bottom' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

interface EventData {
  name: string;
  description: string;
  message: string;
  photos: string[];
  location: string;
  date: string;
  custom_images: CustomImage[];
}

interface InvitePreviewProps {
  eventData: EventData;
  uploadedImages: string[];
}

export default function InvitePreview({ eventData, uploadedImages }: InvitePreviewProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const allPhotos = [...eventData.photos, ...uploadedImages];
  const currentDate = eventData.date ? new Date(eventData.date) : null;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(safeWindow.innerWidth() <= 768);
    };
    
    checkMobile();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  return (
    <div className={styles.previewContainer}>
      <div className={`${styles.inviteCard} ${isMobile ? styles.mobileCard : ''}`}>
        {/* Círculos animados no fundo - desabilitados em mobile */}
        {!isMobile && (
          <div className={styles.backgroundCircles}>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
          </div>
        )}

        {/* Imagens personalizadas como papel de parede */}
        {Array.isArray(eventData.custom_images) && eventData.custom_images.map((customImg, index) => (
          customImg?.url && (
            <div 
              key={index}
              className={styles.customImage}
            >
              <img 
                src={customImg.url} 
                alt={`Papel de parede ${index + 1}`}
                className={styles.customImageElement}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )
        ))}
        
        <div className={styles.inviteContent}>
          {/* Cabeçalho */}
          <div className={styles.inviteHeader}>
            <h1 className={styles.inviteTitle}>
              🎉 {eventData.name || 'Nome do Evento'}
            </h1>
            <h2 className={styles.guestName}>
              Olá, [Nome do Convidado]!
            </h2>
          </div>

          {/* Conteúdo */}
          <div className={styles.inviteBody}>
            {/* Descrição */}
            {eventData.description && (
              <div className={styles.descriptionSection}>
                <p className={styles.descriptionText}>
                  {eventData.description}
                </p>
              </div>
            )}

            {/* Mensagem personalizada */}
            {eventData.message && (
              <div className={styles.messageSection}>
                <p className={styles.messageText}>
                  {`"${eventData.message}"`}
                </p>
              </div>
            )}

            {/* Fotos do evento */}
            {allPhotos.length > 0 && (
              <div className={styles.photoSection}>
                <div className={styles.photoContainer}>
                  <img
                    src={allPhotos[0]}
                    alt="Foto do evento"
                    className={styles.photoImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                  {allPhotos.length > 1 && (
                    <div className={styles.photoCounter}>
                      +{allPhotos.length - 1} fotos
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detalhes do evento */}
            <div className={styles.eventDetailsContainer}>
              {currentDate && (
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>📅</div>
                  <div className={styles.detailContent}>
                    <div className={styles.detailLabel}>Data e Hora</div>
                    <div className={styles.detailValue}>
                      {currentDate.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              )}

              {eventData.location && (
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>📍</div>
                  <div className={styles.detailContent}>
                    <div className={styles.detailLabel}>Local</div>
                    <div className={styles.detailValue}>
                      {eventData.location}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Seção de confirmação (preview) */}
            <div className={styles.confirmationSection}>
              <h3 className={styles.confirmationTitle}>
                Confirme sua presença
              </h3>
              <div className={styles.previewButtons}>
                <button className={`${styles.confirmButton} ${styles.previewOnly}`} disabled>
                  Confirmar Presença 🎉
                </button>
                <button className={`${styles.declineButton} ${styles.previewOnly}`} disabled>
                  Não conseguirei ir 😔
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
