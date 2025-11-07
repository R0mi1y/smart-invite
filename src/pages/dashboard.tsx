import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.scss';
import { fetchApi } from '../helpers/generalHelper';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CustomAlert from '../components/ui/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface EventWithStats {
  id: number;
  name: string;
  description?: string;
  message?: string;
  photos: string[];
  location?: string;
  date?: string;
  created_at: string;
  total_guests: number;
  confirmed_guests: number;
  declined_guests: number;
  total_people: number;
  pending_guests: number;
}

interface Guest {
  id: number;
  name: string;
  confirmed: boolean;
  num_people: number;
  created_at: string;
}

interface CompleteEventData {
  event: EventWithStats;
  guests: Guest[];
  stats: {
    total_guests: number;
    confirmed_guests: number;
    declined_guests: number;
    total_people: number;
    pending_guests: number;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { alert, showError } = useCustomAlert();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [selectedEventData, setSelectedEventData] = useState<CompleteEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEventData, setLoadingEventData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await fetchApi('events/with-stats', { method: 'GET' });
      setEvents(data);
    } catch (err) {
      showError('Erro ao carregar', 'Não foi possível carregar os eventos');
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompleteEventData = async (eventId: number) => {
    setLoadingEventData(true);
    try {
      const data = await fetchApi(`events/${eventId}/complete`, { method: 'GET' });
      setSelectedEventData(data);
    } catch (err) {
      showError('Erro ao carregar', 'Não foi possível carregar os dados do evento');
    } finally {
      setLoadingEventData(false);
    }
  };

  const selectEvent = (event: EventWithStats) => {
    fetchCompleteEventData(event.id);
  };

  const goToInviteManagement = (eventId: number) => {
    router.push(`/manage-invites/${eventId}`);
  };

  const goToCreateEvent = () => {
    router.push('/');
  };

  if (loading) {
    return <LoadingSpinner message="Carregando eventos..." overlay />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard de Eventos</h1>
        <button onClick={goToCreateEvent} className={styles.createButton}>
          + Criar Novo Evento
        </button>
      </div>

      <div className={styles.content}>
        {/* Lista de Eventos */}
        <div className={styles.eventsSection}>
          <h2>Seus Eventos</h2>
          {events.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum evento criado ainda.</p>
              <button onClick={goToCreateEvent} className={styles.createFirstButton}>
                Criar Primeiro Evento
              </button>
            </div>
          ) : (
            <div className={styles.eventsList}>
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`${styles.eventCard} ${selectedEventData?.event.id === event.id ? styles.selected : ''}`}
                  onClick={() => selectEvent(event)}
                >
                  <h3>{event.name}</h3>
                  <p className={styles.eventDate}>
                    {event.date ? new Date(event.date).toLocaleDateString('pt-BR') : 'Data não definida'}
                  </p>
                  <p className={styles.eventLocation}>
                    📍 {event.location || 'Local não definido'}
                  </p>
                  <div className={styles.statsPreview}>
                    <span>👥 {event.total_guests} convidados</span>
                    <span>✅ {event.confirmed_guests} confirmados</span>
                  </div>
                  <div className={styles.eventActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToInviteManagement(event.id);
                      }}
                      className={styles.manageButton}
                    >
                      Gerenciar Convites
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes do Evento Selecionado */}
        {selectedEventData && (
          <div className={styles.eventDetails}>
            <h2>{selectedEventData.event.name}</h2>
            
            {/* Estatísticas */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{selectedEventData.stats.total_guests}</div>
                <div className={styles.statLabel}>Total de Convidados</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{selectedEventData.stats.confirmed_guests}</div>
                <div className={styles.statLabel}>Confirmaram Presença</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{selectedEventData.stats.declined_guests}</div>
                <div className={styles.statLabel}>Rejeitaram Convite</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{selectedEventData.stats.pending_guests}</div>
                <div className={styles.statLabel}>Aguardando Resposta</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{selectedEventData.stats.total_people}</div>
                <div className={styles.statLabel}>Total de Pessoas</div>
              </div>
            </div>

            {/* Lista de Convidados */}
            <div className={styles.guestsSection}>
              <h3>Convidados</h3>
              {loadingEventData ? (
                <LoadingSpinner message="Carregando dados..." />
              ) : selectedEventData.guests.length === 0 ? (
                <p className={styles.noGuests}>Nenhum convite enviado ainda.</p>
              ) : (
                <div className={styles.guestsList}>
                  {selectedEventData.guests.map((guest) => (
                    <div
                      key={guest.id}
                      className={`${styles.guestCard} ${
                        guest.confirmed 
                          ? styles.confirmed 
                          : guest.num_people === -1
                            ? styles.declined
                            : styles.pending
                      }`}
                    >
                      <div className={styles.guestInfo}>
                        <h4>{guest.name}</h4>
                        <p className={styles.guestStatus}>
                          {guest.confirmed 
                            ? `✅ Confirmado - ${guest.num_people} pessoa(s)`
                            : guest.num_people === -1
                              ? '❌ Rejeitado'
                              : '⏳ Aguardando resposta'
                          }
                        </p>
                      </div>
                      <div className={styles.guestDate}>
                        Convidado em {new Date(guest.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
      />
    </div>
  );
}
