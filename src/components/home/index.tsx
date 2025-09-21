import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from './styles.module.scss';
import React from 'react';
import Notification from '../ui/Notification';
import ImagePreview from '../ui/ImagePreview';
import LoadingSpinner from '../ui/LoadingSpinner';
import InvitePreview from '../InvitePreview';
import { useNotification } from '../../hooks/useNotification';
import { fetchApi } from '../../helpers/generalHelper';

interface Event {
  id: number;
  name: string;
  description?: string;
  message?: string;
  photos: string[];
  location?: string;
  date?: string;
}

interface CustomImage {
  url: string;
  position: 'center-top' | 'center-bottom' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

interface NewEvent {
  name: string;
  description: string;
  message: string;
  photos: string[];
  location: string;
  date: string;
  custom_images: CustomImage[];
}

export default function HomeComponent() {
  const router = useRouter();
  const [newEvent, setNewEvent] = useState<NewEvent>({
    name: '',
    description: '',
    message: '',
    photos: [],
    location: '',
    date: '',
    custom_images: []
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'preview'>('basic');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  const createEvent = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!newEvent.name.trim()) {
      showError('Nome do evento é obrigatório!');
      return;
    }

    if (!newEvent.date) {
      showError('Data do evento é obrigatória!');
      return;
    }

    setIsCreatingEvent(true);

    try {
      const eventData = {
        ...newEvent,
        photos: [...newEvent.photos, ...uploadedImages]
      };

      const data = await fetchApi('events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      showSuccess(data.message || 'Evento criado com sucesso!');
      setNewEvent({
        name: '',
        description: '',
        message: '',
        photos: [],
        location: '',
        date: '',
        custom_images: []
      });
      setUploadedImages([]);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      showError('Erro ao criar evento');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const removePhoto = (index: number): void => {
    setNewEvent(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    showSuccess('Foto removida!');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalImages = uploadedImages.length + newEvent.photos.length + files.length;
    if (totalImages > 20) {
      showError('Máximo de 20 imagens por evento!');
      return;
    }

    if (files.length > 10) {
      showError('Máximo de 10 imagens por vez!');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    const validFiles: File[] = [];

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showError(`Arquivo ${file.name} é muito grande (máximo 5MB)`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError(`Arquivo ${file.name} não é uma imagem válida`);
        return;
      }

      validFiles.push(file);
      formData.append('images', file);
    });

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    try {
      const data = await fetchApi('upload', {
        method: 'POST',
        body: formData,
      });

      setUploadedImages(prev => [...prev, ...data.images]);
      showSuccess(data.message);
    } catch (error) {
      showError('Erro no upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedImage = (index: number): void => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    showSuccess('Imagem removida!');
  };

  const addCustomImage = (): void => {
    setNewEvent(prev => ({
      ...prev,
      custom_images: [...prev.custom_images, { url: '', position: 'center-top' }]
    }));
  };

  const updateCustomImage = (index: number, field: 'url' | 'position', value: string): void => {
    setNewEvent(prev => ({
      ...prev,
      custom_images: prev.custom_images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  const removeCustomImage = (index: number): void => {
    setNewEvent(prev => ({
      ...prev,
      custom_images: prev.custom_images.filter((_, i) => i !== index)
    }));
    showSuccess('Imagem personalizada removida!');
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            🎉 Gerador de Convites
          </h1>

          <div className={styles.headerButtons}>
            <button
              onClick={() => router.push('/dashboard')}
              className={`${styles.button} ${styles.dashboardButton}`}
            >
              📊 Dashboard
            </button>
          </div>
        </div>

        <div className={styles.createEventFormContainer}>
          <h3 className={styles.createEventForm}>Criar Novo Evento</h3>
          
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

          <form onSubmit={createEvent}>
            {/* Aba de Informações Básicas */}
            {activeTab === 'basic' && (
              <div className={styles.tabContent}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    placeholder="Nome do Evento"
                    value={newEvent.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>

            <div className={styles.formGroup}>
              <textarea
                placeholder="Descrição do Evento"
                value={newEvent.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formGroup}>
              <textarea
                placeholder="Mensagem Personalizada"
                value={newEvent.message}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewEvent(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="text"
                placeholder="Local do Evento"
                value={newEvent.location}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="datetime-local"
                value={newEvent.date}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.uploadHeader}>
                <label className={styles.uploadLabel}>
                  📷 Adicionar Fotos
                </label>
                <div className={styles.imageCounter}>
                  {uploadedImages.length + newEvent.photos.length}/20 imagens
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

              {newEvent.photos.length > 0 && (
                <div className={styles.urlPhotosSection}>
                  <h4>🔗 Fotos por URL ({newEvent.photos.length}):</h4>
                  <div className={styles.photoGrid}>
                    {newEvent.photos.map((photo, index) => (
                      <ImagePreview
                        key={`url-${index}`}
                        src={photo}
                        alt={`URL ${index + 1}`}
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
                    {newEvent.custom_images.map((customImg, index) => (
                      <div key={index} className={styles.customImageItem}>
                        <div className={styles.customImageInputs}>
                          <input
                            type="url"
                            placeholder="URL da imagem (fundo branco/transparente)"
                            value={customImg.url}
                            onChange={(e) => updateCustomImage(index, 'url', e.target.value)}
                            className={styles.formInput}
                          />
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
                    Veja como seu convite ficará antes de criar o evento.
                  </p>
                  
                  <div className={styles.invitePreview}>
                    <InvitePreview eventData={newEvent} uploadedImages={uploadedImages} />
                  </div>
                </div>
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.createEventSubmitButton}
                disabled={isCreatingEvent}
              >
                {isCreatingEvent ? 'Criando Evento...' : 'Criar Evento'}
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

      {isCreatingEvent && <LoadingSpinner message="Criando evento..." overlay />}
    </div>
  );
}
