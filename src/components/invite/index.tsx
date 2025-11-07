import { useState, useEffect, ChangeEvent } from 'react';
import styles from './styles.module.scss';
import React from 'react';
import { fetchApi } from '../../helpers/generalHelper';
import ConfettiAnimation from '../ui/ConfettiAnimation';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useInviteCache } from '../../hooks/useInviteCache';
import { safeWindow } from '../../utils/domUtils';

interface CustomImage {
  url: string;
  position: 'center-top' | 'center-bottom' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

interface InviteData {
  id: number;
  event_id: number;
  name: string;
  token: string;
  confirmed: boolean;
  num_people: number;
  created_at: string;
  event_name: string;
  description?: string;
  message?: string;
  photos: string[];
  location?: string;
  date?: string;
  custom_images?: CustomImage[];
}

interface InviteComponentProps {
  token: string | string[] | undefined;
}

export default function InviteComponent({ token }: InviteComponentProps) {
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [declined, setDeclined] = useState<boolean>(false);
  const [numPeople, setNumPeople] = useState<number>(1);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { cachedData, saveToCache } = useInviteCache(token as string);

  useEffect(() => {
    if (token) {
      fetchInvite();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchInvite = async (): Promise<void> => {
    try {
      const data = await fetchApi(`invite/${token}`, {
        method: 'GET'
      });

      console.log(data);

      setInvite(data as InviteData);
      
      // Usar dados do cache se disponível
      if (cachedData) {
        setConfirmed(cachedData.confirmed);
        setDeclined(cachedData.declined);
        setNumPeople(cachedData.numPeople);
      } else {
        setConfirmed(data.confirmed);
        setDeclined(data.confirmed === false && data.num_people === -1);
        setNumPeople(data.num_people || 1);
      }

      setTimeout(() => {
        setIsVisible(true);
        const isConfirmed = cachedData?.confirmed || data.confirmed;
        if (!isMobile) {
          if (isConfirmed) {
            setTimeout(() => setShowConfetti(true), 800);
          } else {
            setTimeout(() => setShowConfetti(true), 1200);
          }
        }
      }, 500);
    } catch (err) {
      setError('Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

  const confirmPresence = async (): Promise<void> => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await fetchApi('guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          confirmed: true,
          numPeople: numPeople || 1,
        }),
      });

      setConfirmed(true);
      setDeclined(false);
      saveToCache(numPeople, true, false);
      if (invite) {
        setInvite({ ...invite, confirmed: true, num_people: numPeople });
      }
    } catch (err) {
      setError('Erro ao confirmar presença');
    } finally {
      setIsSubmitting(false);
    }
  };

  const declinePresence = async (): Promise<void> => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await fetchApi('guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          confirmed: false,
          numPeople: -1,
        }),
      });

      setConfirmed(false);
      setDeclined(true);
      setNumPeople(-1);
      saveToCache(-1, false, true);
      if (invite) {
        setInvite({ ...invite, confirmed: false, num_people: -1 });
      }
    } catch (err) {
      setError('Erro ao recusar convite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePeopleCount = async (newCount: number): Promise<void> => {
    if (confirmed) {
      try {
        await fetchApi('guests', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            confirmed: true,
            numPeople: newCount,
          }),
        });
        saveToCache(newCount, true, false);
      } catch (err) {
        console.error('Erro ao atualizar número de pessoas:', err);
      }
    }
  };

  const incrementPeople = (): void => {
    if (numPeople < 10) {
      const newCount = numPeople + 1;
      setNumPeople(newCount);
      if (confirmed) {
        updatePeopleCount(newCount);
      } else {
        saveToCache(newCount, confirmed, declined);
      }
    }
  };

  const decrementPeople = (): void => {
    if (numPeople > 1) {
      const newCount = numPeople - 1;
      setNumPeople(newCount);
      if (confirmed) {
        updatePeopleCount(newCount);
      } else {
        saveToCache(newCount, confirmed, declined);
      }
    }
  };

  const nextPhoto = (): void => {
    if (invite && invite.photos.length > 1) {
      setCurrentPhotoIndex((prev) =>
        prev === invite.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = (): void => {
    if (invite && invite.photos.length > 1) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? invite.photos.length - 1 : prev - 1
      );
    }
  };

  if (loading || !isVisible) {
    return <LoadingSpinner message="Carregando convite..." overlay />;
  }

  if (error) {
    return (
      <div className={styles.errorMessage}>
        {error}
      </div>
    );
  }

  if (!invite) {
    return (
      <div className={styles.errorMessage}>
        Convite não encontrado
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isMobile ? styles.mobileContainer : ''}`}>
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
      
      <div className={styles.inviteCard}>
        {/* Imagens personalizadas como papel de parede */}
        {Array.isArray(invite?.custom_images) && invite.custom_images.map((customImg, index) => (
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
        
        {/* Cabeçalho */}
        <div className={styles.inviteHeader}>
          <h1 className={styles.inviteTitle}>
            🎉 {invite?.event_name}
          </h1>
          <h2 className={styles.guestName}>
            Olá, {invite?.name}!
          </h2>
        </div>

        {/* Conteúdo */}
        <div className={styles.inviteContent}>
          {/* Descrição */}
          {invite?.description && (
            <div className={styles.descriptionSection}>
              <p className={styles.descriptionText}>
                {invite.description}
              </p>
            </div>
          )}

          {/* Mensagem personalizada */}
          {invite?.message && (
            <div className={styles.messageSection}>
              <p className={styles.messageText}>
                {`"${invite.message}"`}
              </p>
            </div>
          )}

          {/* Fotos do evento */}
          {invite?.photos && invite.photos.length > 0 && (
            <div className={styles.photoSection}>
              <div className={styles.photoContainer}>
                <img
                  src={invite.photos[currentPhotoIndex]}
                  alt={`Foto do evento ${currentPhotoIndex + 1}`}
                  className={styles.photoImage}
                />

                {invite.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className={`${styles.photoControls} ${styles.prevButton}`}
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextPhoto}
                      className={`${styles.photoControls} ${styles.nextButton}`}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {invite.photos.length > 1 && (
                <div className={styles.photoNavigation}>
                  {invite.photos.map((_, index) => (
                    <div
                      key={index}
                      className={`${styles.photoDot} ${index === currentPhotoIndex ? styles.active : ''}`}
                      onClick={() => setCurrentPhotoIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Detalhes do evento */}
          <div className={styles.eventDetailsContainer}>
            {invite?.date && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>📅</div>
                <div className={`${styles.detailLabel} ${styles.dateLabel}`}>Data e Hora</div>
                <div className={styles.detailValue}>
                  {new Date(invite.date).toLocaleString('pt-BR')}
                </div>
              </div>
            )}

            {invite?.location && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>📍</div>
                <div className={`${styles.detailLabel} ${styles.locationLabel}`}>Local</div>
                <div className={styles.detailValue}>
                  {invite.location}
                </div>
              </div>
            )}
          </div>

          {/* Confirmação de presença */}
          {!confirmed && !declined ? (
            <div className={styles.confirmationSection}>
              <h3 className={styles.confirmationTitle}>
                Confirme sua presença
              </h3>

              <div className={styles.confirmationForm}>
                <div className={styles.peopleCountSection}>
                  <label className={styles.peopleCountLabel}>
                    Quantas pessoas irão?
                  </label>
                  <div className={styles.peopleCountControls}>
                    <button
                      type="button"
                      onClick={decrementPeople}
                      className={styles.peopleCountButton}
                      disabled={numPeople <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={numPeople}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNumPeople(parseInt(e.target.value) || 1)}
                      className={styles.peopleCountInput}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={incrementPeople}
                      className={styles.peopleCountButton}
                      disabled={numPeople >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  onClick={confirmPresence}
                  className={styles.confirmButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Confirmando...' : 'Confirmar Presença 🎉'}
                </button>

                <button
                  onClick={declinePresence}
                  className={styles.declineButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processando...' : 'Não conseguirei ir 😔'}
                </button>
              </div>
            </div>
          ) : confirmed ? (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>🎉</div>
              <h3 className={styles.successTitle}>
                Presença Confirmada!
              </h3>
              <p>Obrigado por confirmar! Esperamos você no evento.</p>
              <p>Número de pessoas: {invite.num_people}</p>
            </div>
          ) : declined ? (
            <div className={styles.declinedMessage}>
              <div className={styles.declinedIcon}>😔</div>
              <h3 className={styles.declinedTitle}>
                Que pena que você não poderá vir!
              </h3>
              <p>Sentiremos sua falta. Esperamos te ver em uma próxima oportunidade!</p>
              <button
                onClick={() => {
                  setDeclined(false);
                  setNumPeople(1);
                }}
                className={styles.changeResponseButton}
              >
                Mudei de ideia, quero confirmar presença
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Animação de confetes - desabilitada em mobile */}
      {!isMobile && <ConfettiAnimation show={showConfetti} duration={4000} />}

      {/* Loading overlay quando enviando */}
      {isSubmitting && <LoadingSpinner message="Processando..." overlay />}
    </div>
  );
}
