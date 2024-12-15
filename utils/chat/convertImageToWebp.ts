// utils/convertImageToWebp.ts
export const convertImageToWebp = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(file); // Not an image, return the file as is
        return;
      }
  
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp' });
                resolve(webpFile);
              } else {
                reject(new Error('Conversion to WebP failed'));
              }
            },
            'image/webp'
          );
        } else {
          reject(new Error('Canvas context is null'));
        }
      };
      img.onerror = () => {
        reject(new Error('Image load error'));
      };
      img.src = URL.createObjectURL(file);
    });
  };
  