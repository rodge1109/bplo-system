// Cloudinary Upload Service for ARTA Documentary Requirements
// Supports Direct Client-Side Unsigned Uploads to Cloudinary

const STORAGE_KEY = 'bplo_cloudinary_config';

/**
 * Retrieve active Cloudinary configuration from .env or localStorage
 */
export function getCloudinaryConfig() {
  const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const envPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        cloudName: parsed.cloudName || envCloudName || 'demo',
        uploadPreset: parsed.uploadPreset || envPreset || '',
        folder: parsed.folder || 'bplo_arta_documents',
        isCustom: Boolean(parsed.cloudName && parsed.uploadPreset)
      };
    }
  } catch (e) {
    console.warn('Error reading stored Cloudinary config:', e);
  }

  return {
    cloudName: envCloudName || 'demo',
    uploadPreset: envPreset || '',
    folder: 'bplo_arta_documents',
    isCustom: Boolean(envCloudName && envPreset)
  };
}

/**
 * Persist custom Cloudinary configuration in localStorage
 */
export function saveCloudinaryConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save Cloudinary configuration:', e);
    return false;
  }
}

/**
 * Upload a document/image to Cloudinary with real progress tracking
 * @param {File} file 
 * @param {Object} options - { docType, tenantCode, onProgress }
 */
export function uploadToCloudinary(file, options = {}) {
  const { onProgress, docType = 'general', tenantCode = 'BOGO' } = options;
  const config = getCloudinaryConfig();

  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured with valid preset
    if (!config.cloudName || !config.uploadPreset) {
      // Fallback preview mode when user hasn't set custom credentials yet
      console.info('Cloudinary preset not configured. Generating local preview payload for testing.');
      const reader = new FileReader();
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(Math.min(progress, 95));
        if (progress >= 100) {
          clearInterval(interval);
          reader.onload = () => {
            if (onProgress) onProgress(100);
            resolve({
              url: reader.result,
              secure_url: reader.result,
              public_id: `local_preview_${Date.now()}_${file.name}`,
              format: file.name.split('.').pop() || 'pdf',
              bytes: file.size,
              original_filename: file.name,
              created_at: new Date().toISOString(),
              isLocalPreview: true,
              message: 'Local Preview (Configure Cloudinary preset in settings to upload live to cloud)'
            });
          };
          reader.onerror = (err) => reject(new Error('Failed to read file: ' + err.message));
          reader.readAsDataURL(file);
        }
      }, 100);
      return;
    }

    // Direct Cloudinary API Call
    const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', `${config.folder}/${tenantCode.toLowerCase()}`);
    formData.append('tags', `bplo,${tenantCode},${docType}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // Track upload progress
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url || response.url,
            secure_url: response.secure_url || response.url,
            public_id: response.public_id,
            format: response.format,
            bytes: response.bytes,
            original_filename: response.original_filename || file.name,
            created_at: response.created_at,
            isLocalPreview: false
          });
        } catch (e) {
          reject(new Error('Failed to parse Cloudinary response: ' + e.message));
        }
      } else {
        try {
          const errorResp = JSON.parse(xhr.responseText);
          const errorMsg = errorResp.error?.message || `Cloudinary upload failed (Status: ${xhr.status})`;
          reject(new Error(errorMsg));
        } catch {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during Cloudinary upload. Please check your connection.'));
    };

    xhr.send(formData);
  });
}
