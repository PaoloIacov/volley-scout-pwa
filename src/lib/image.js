/**
 * Legge un file immagine e restituisce un data URL JPEG compressa e ridimensionata,
 * per non superare le ~5MB della localStorage.
 */
export function fileToDataUrl(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nessun file selezionato'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Il file selezionato non è un\'immagine'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere il file'));
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();

      image.onerror = () => reject(new Error('Immagine non valida'));
      image.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) {
            resolve(source);
            return;
          }
          context.drawImage(image, 0, 0, width, height);

          // PNG trasparenti: sfondo bianco, altrimenti il JPEG diventa nero.
          if (file.type === 'image/png' || file.type === 'image/webp') {
            context.globalCompositeOperation = 'destination-over';
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
          }

          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(source);
        }
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}
