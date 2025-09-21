import React, { useState } from 'react';
import styles from './styles.module.scss';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onRemove?: () => void;
  showRemove?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  src, 
  alt, 
  onRemove, 
  showRemove = true 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleImageClick = () => {
    setShowFullSize(true);
  };

  const closeFullSize = () => {
    setShowFullSize(false);
  };

  return (
    <>
      <div className={styles.imagePreview}>
        {isLoading && (
          <div className={styles.loadingPlaceholder}>
            <div className={styles.spinner}></div>
            <span>Carregando...</span>
          </div>
        )}
        
        {hasError && (
          <div className={styles.errorPlaceholder}>
            <span>❌</span>
            <span>Erro ao carregar</span>
          </div>
        )}
        
        {!hasError && (
          <img
            src={src}
            alt={alt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={handleImageClick}
            className={`${styles.image} ${isLoading ? styles.hidden : ''}`}
          />
        )}
        
        {showRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={styles.removeButton}
            title="Remover imagem"
          >
            ×
          </button>
        )}
        
        <button
          type="button"
          onClick={handleImageClick}
          className={styles.previewButton}
          title="Ver em tamanho completo"
        >
          🔍
        </button>
      </div>

      {/* Modal de visualização em tamanho completo */}
      {showFullSize && (
        <div className={styles.fullSizeModal} onClick={closeFullSize}>
          <div className={styles.fullSizeContent}>
            <img src={src} alt={alt} className={styles.fullSizeImage} />
            <button
              className={styles.closeFullSize}
              onClick={closeFullSize}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;
