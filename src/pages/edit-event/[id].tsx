import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import styles from '../../components/home/styles.module.scss';
import React from 'react';
import Notification from '../../components/ui/Notification';
import ImagePreview from '../../components/ui/ImagePreview';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import InvitePreview from '../../components/InvitePreview';
import { useNotification } from '../../hooks/useNotification';
import { fetchApi } from '../../helpers/generalHelper';
import { safeClickElement } from '../../utils/domUtils';

interface CustomImage {
  url: string;
  position: 'center-top' | 'center-bottom' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

interface EventData {
  id?: number;
  name: string;
  description: string;
  message: string;
  photos: string[];
  location: string;
  date: string;
  custom_images: CustomImage[];
}

export default function EditEvent() {
  const router = useRouter();
  const { id } = router.query;
  const [eventData, setEventData] = useState<EventData>({
    name: '',
    description: '',
    message: '',
    photos: [],
    location: '',
    date: '',
    custom_images: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'preview'>('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async (): Promise<void> => {
    try {
      const data = await fetchApi(`events/${id}`, { method: 'GET' });
      
      // Converter data MySQL para formato datetime-local do HTML
      let formattedDate = '';
      if (data.date) {
        const date = new Date(data.date);
        if (!isNaN(date.getTime())) {
          // Formato: YYYY-MM-DDTHH:mm
          formattedDate = date.toISOString().slice(0, 16);
        }
      }
      
      setEventData({
        ...data,
        date: formattedDate,
        custom_images: data.custom_images || []
      });
    } catch (err) {
      showError('Erro ao carregar evento');
      setTimeout(() => router.push('/dashboard'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvent = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!eventData.name.trim()) {
      showError('Nome do evento é obrigatório!');
      return;
    }

    if (!eventData.date) {
      showError('Data do evento é obrigatória!');
      return;
    }

    setIsUpdating(true);

    try {
      const updatedData = {
        ...eventData,
        photos: [...eventData.photos, ...uploadedImages]
      };

      await fetchApi(`events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      showSuccess('Evento atualizado com sucesso!');
      setTimeout(() => {
        router.push(`/manage-invites/${id}`);
      }, 2000);
    } catch (error) {
      showError('Erro ao atualizar evento');
    } finally {
      setIsUpdating(false);
    }
  };

  const removePhoto = (index: number): void => {
    setEventData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    showSuccess('Foto removida!');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalImages = eventData.photos.length + uploadedImages.length + files.length;
    if (totalImages > 20) {
      showWarning('Máximo de 20 imagens por evento!');
      return;
    }

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          showWarning(`Arquivo ${file.name} é muito grande (máx: 5MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetchApi('upload', {
          method: 'POST',
          body: formData,
        });

        newImages.push(response.url);
      }

      setUploadedImages(prev => [...prev, ...newImages]);
      showSuccess(`${newImages.length} imagem(ns) enviada(s)!`);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      showError('Erro ao enviar imagens');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = (index: number): void => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    showSuccess('Imagem removida!');
  };

  const addCustomImage = (): void => {
    setEventData(prev => ({
      ...prev,
      custom_images: [...prev.custom_images, { url: '', position: 'center-top' }]
    }));
  };

  const updateCustomImage = (index: number, field: 'url' | 'position', value: string): void => {
    setEventData(prev => ({
      ...prev,
      custom_images: prev.custom_images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  const removeCustomImage = (index: number): void => {
    setEventData(prev => ({
      ...prev,
      custom_images: prev.custom_images.filter((_, i) => i !== index)
    }));
    showSuccess('Imagem personalizada removida!');
  };

  const handleCustomImageUpload = async (e: ChangeEvent<HTMLInputElement>, index: number): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Arquivo muito grande! Máximo 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Apenas imagens são permitidas!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchApi('upload', {
        method: 'POST',
        body: formData,
      });

      updateCustomImage(index, 'url', response.url);
      showSuccess('Imagem personalizada enviada!');
    } catch (error) {
      showError('Erro ao enviar imagem personalizada');
    }
  };

  const goBack = () => {
    router.push(`/manage-invites/${id}`);
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando evento..." overlay />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={goBack} className={styles.backButton}>
              ← Voltar ao Gerenciamento
            </button>
          </div>
          <h1 className={styles.title}>
            ✏️ Editar Evento
          </h1>
          <div className={styles.headerRight}></div>
        </div>

        <div className={styles.createEventFormContainer}>
          <h3 className={styles.createEventForm}>Editar "{eventData.name}"</h3>
          
          {/* Sistema de Abas */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsHeader}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                📝 Informações Básicas
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'advanced' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('advanced')}
              >
                🎨 Configurações Avançadas
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'preview' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                👁️ Preview
              </button>
            </div>
          </div>

          <form onSubmit={updateEvent}>
            {/* Aba de Informações Básicas */}
            {activeTab === 'basic' && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    placeholder="Nome do Evento"
                    value={eventData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <textarea
                    placeholder="Descrição do Evento"
                    value={eventData.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={styles.formTextarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <textarea
                    placeholder="Mensagem Personalizada"
                    value={eventData.message}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEventData(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className={styles.formTextarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <input
                    type="text"
                    placeholder="Local do Evento"
                    value={eventData.location}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <input
                    type="datetime-local"
                    value={eventData.date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.uploadHeader}>
                    <label className={styles.uploadLabel}>
                      📷 Adicionar Fotos
                    </label>
                    <div className={styles.imageCounter}>
                      {uploadedImages.length + eventData.photos.length}/20 imagens
                    </div>
                  </div>

                  <div className={styles.uploadSection}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className={styles.fileInput}
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`${styles.button} ${styles.uploadButton}`}
                    >
                      {isUploading ? '📤 Enviando...' : '📁 Escolher Arquivos'}
                    </button>
                    <small className={styles.uploadInfo}>
                      Máx: 10 arquivos, 5MB cada, 20 total por evento
                    </small>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className={styles.uploadedSection}>
                      <h4>📤 Imagens Enviadas ({uploadedImages.length}):</h4>
                      <div className={styles.photoGrid}>
                        {uploadedImages.map((image, index) => (
                          <ImagePreview
                            key={`uploaded-${index}`}
                            src={image}
                            alt={`Upload ${index + 1}`}
                            onRemove={() => removeUploadedImage(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {eventData.photos.length > 0 && (
                    <div className={styles.urlPhotosSection}>
                      <h4>🔗 Fotos Existentes ({eventData.photos.length}):</h4>
                      <div className={styles.photoGrid}>
                        {eventData.photos.map((photo, index) => (
                          <ImagePreview
                            key={`existing-${index}`}
                            src={photo}
                            alt={`Existente ${index + 1}`}
                            onRemove={() => removePhoto(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aba de Configurações Avançadas */}
            {activeTab === 'advanced' && (
              <div className={styles.tabContent}>
                <div className={styles.advancedSettings}>
                  <h4 className={styles.sectionTitle}>🖼️ Imagens Personalizadas</h4>
                  <p className={styles.sectionDescription}>
                    Adicione imagens de personagens ou pessoas para personalizar o convite. 
                    <strong> As imagens devem ter fundo branco ou transparente.</strong>
                  </p>
                  
                  <div className={styles.customImagesContainer}>
                    {eventData.custom_images.map((customImg, index) => (
                      <div key={index} className={styles.customImageItem}>
                        <div className={styles.customImageInputs}>
                          <div className={styles.customImageUpload}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCustomImageUpload(e, index)}
                              className={styles.fileInput}
                              id={`custom-image-${index}`}
                            />
                            <button
                              type="button"
                              onClick={() => safeClickElement(`custom-image-${index}`)}
                              className={styles.uploadCustomButton}
                            >
                              📁 {customImg.url ? 'Trocar Imagem' : 'Escolher Imagem'}
                            </button>
                          </div>
                          <select
                            value={customImg.position}
                            onChange={(e) => updateCustomImage(index, 'position', e.target.value)}
                            className={styles.positionSelect}
                          >
                            <option value="center-top">Centro - Topo</option>
                            <option value="center-bottom">Centro - Embaixo</option>
                            <option value="left-top">Esquerda - Topo</option>
                            <option value="left-bottom">Esquerda - Embaixo</option>
                            <option value="right-top">Direita - Topo</option>
                            <option value="right-bottom">Direita - Embaixo</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeCustomImage(index)}
                            className={styles.removeButton}
                          >
                            🗑️
                          </button>
                        </div>
                        {customImg.url && (
                          <div className={styles.imagePreview}>
                            <img 
                              src={customImg.url} 
                              alt="Preview" 
                              className={styles.previewImage}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addCustomImage}
                      className={styles.addImageButton}
                    >
                      ➕ Adicionar Imagem Personalizada
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Aba de Preview */}
            {activeTab === 'preview' && (
              <div className={styles.tabContent}>
                <div className={styles.previewContainer}>
                  <h4 className={styles.sectionTitle}>👁️ Preview do Convite</h4>
                  <p className={styles.sectionDescription}>
                    Veja como seu convite ficará após as alterações.
                  </p>
                  
                  <div className={styles.invitePreview}>
                    <InvitePreview eventData={eventData} uploadedImages={uploadedImages} />
                  </div>
                </div>
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.createEventSubmitButton}
                disabled={isUpdating}
              >
                {isUpdating ? 'Atualizando Evento...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      {isUpdating && <LoadingSpinner message="Atualizando evento..." overlay />}
    </div>
  );
}
