import React, { useState } from 'react';

const ImageUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [processedImageUrl, setProcessedImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);

    try {
      // Simulating ML processing with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Replace this with your actual ML processing logic
      // For demonstration, we're just using the preview URL
      setProcessedImageUrl(previewUrl);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleImageUpload}>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
        />
        <button type="submit" disabled={!selectedFile || isLoading}>
          {isLoading ? 'Processing...' : 'Upload and Process'}
        </button>
      </form>

      {previewUrl && (
        <div>
          <h3>Preview:</h3>
          <img src={previewUrl} alt="Preview" style={{maxWidth: '300px'}} />
        </div>
      )}

      {processedImageUrl && (
        <div>
          <h3>Processed Image:</h3>
          <img src={processedImageUrl} alt="Processed" style={{maxWidth: '300px'}} />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
