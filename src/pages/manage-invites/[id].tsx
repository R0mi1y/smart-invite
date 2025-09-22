import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/ManageInvites.module.scss';
import { fetchApi } from '../../helpers/generalHelper';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CustomAlert from '../../components/ui/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

interface Event {
  id: number;
  name: string;
  description?: string;
  message?: string;
  photos: string[];
  location?: string;
  date?: string;
}

interface Guest {
  id: number;
  name: string;
  token: string;
  confirmed: boolean;
  num_people: number;
  created_at: string;
}

export default function ManageInvites() {
  const router = useRouter();
  const { id } = router.query;
  const { alert, showSuccess, showError, showConfirm } = useCustomAlert();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    try {
      const completeData = await fetchApi(`events/${id}/complete`, { method: 'GET' });
      setEvent(completeData.event);
      setGuests(completeData.guests);
    } catch (err) {
      setError('Evento não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!newGuestName.trim()) {
      showError('Campo obrigatório', 'Digite o nome do convidado');
      return;
    }

    setIsCreatingInvite(true);
    setError('');
    setSuccess('');

    try {
      const data = await fetchApi('guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: Number(id),
          name: newGuestName.trim(),
        }),
      });

      await showSuccess('Convite criado!', `Link do convite: ${data.link}`);
      setNewGuestName('');
      
      fetchEventData();
    } catch (err: any) {
      showError('Erro ao criar convite', err.message || 'Ocorreu um erro inesperado');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const link = `${window.location.origin}${basePath}/convite/${token}`;
    
    try {
      await navigator.clipboard.writeText(link);
      showSuccess('Link copiado!', 'O link do convite foi copiado para a área de transferência');
    } catch {
      showError('Erro ao copiar', 'Não foi possível copiar o link automaticamente');
    }
  };

  const deleteGuest = async (guestId: number, guestName: string) => {
    const confirmed = await showConfirm(
      'Excluir convite',
      `Tem certeza que deseja excluir o convite de ${guestName}? Esta ação não pode ser desfeita.`,
      'Excluir',
      'Cancelar'
    );

    if (!confirmed) return;

    try {
      await fetchApi(`guests/${guestId}`, {
        method: 'DELETE',
      });
      
      showSuccess('Convite excluído!', 'O convite foi removido com sucesso');
      fetchEventData();
    } catch (err: any) {
      showError('Erro ao excluir', err.message || 'Não foi possível excluir o convite');
    }
  };

  const goBack = () => {
    router.push('/dashboard');
  };

  const editEvent = () => {
    router.push(`/edit-event/${id}`);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando evento..." overlay />;
  }

  if (error && !event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={goBack} className={styles.backButton}>
            ← Voltar ao Dashboard
          </button>
        </div>
        <h1>Gerenciar Convites</h1>
        <div className={styles.headerRight}>
          <button onClick={editEvent} className={styles.editButton}>
            ✏️ Editar Evento
          </button>
        </div>
      </div>

      {event && (
        <div className={styles.eventInfo}>
          <h2>{event.name}</h2>
          <div className={styles.eventDetails}>
            {event.date && (
              <p>📅 {new Date(event.date).toLocaleDateString('pt-BR')}</p>
            )}
            {event.location && (
              <p>📍 {event.location}</p>
            )}
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* Criar Novo Convite */}
        <div className={styles.createSection}>
          <h3>Criar Novo Convite</h3>
          <div className={styles.createForm}>
            <input
              type="text"
              placeholder="Nome do convidado"
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              className={styles.nameInput}
              onKeyPress={(e) => e.key === 'Enter' && createInvite()}
            />
            <button
              onClick={createInvite}
              disabled={isCreatingInvite || !newGuestName.trim()}
              className={styles.createButton}
            >
              {isCreatingInvite ? 'Criando...' : 'Criar Convite'}
            </button>
          </div>
        </div>

        {/* Mensagens */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Lista de Convidados */}
        <div className={styles.guestsSection}>
          <h3>Convites Enviados ({guests.length})</h3>
          
          {guests.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum convite enviado ainda.</p>
              <p>Use o formulário acima para criar o primeiro convite!</p>
            </div>
          ) : (
            <div className={styles.guestsList}>
              {guests.map((guest) => (
                <div key={guest.id} className={styles.guestCard}>
                  <div className={styles.guestInfo}>
                    <h4>{guest.name}</h4>
                    <p className={`${styles.guestStatus} ${guest.confirmed ? styles.confirmed : styles.pending}`}>
                      {guest.confirmed 
                        ? `✅ Confirmado - ${guest.num_people} pessoa(s)`
                        : '⏳ Aguardando resposta'
                      }
                    </p>
                    <p className={styles.guestDate}>
                      Criado em {new Date(guest.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className={styles.guestActions}>
                    <button
                      onClick={() => copyInviteLink(guest.token)}
                      className={styles.copyButton}
                      title="Copiar link do convite"
                    >
                      📋 Copiar Link
                    </button>
                    <button
                      onClick={() => deleteGuest(guest.id, guest.name)}
                      className={styles.deleteButton}
                      title="Excluir convite"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isCreatingInvite && <LoadingSpinner message="Criando convite..." overlay />}
      
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
