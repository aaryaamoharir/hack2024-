import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import JSZip from 'jszip';

const ImageUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    // Create preview URL
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/colorize', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      setPreview(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const compressImage = async (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxSize = 500; // Adjust this value to control compression
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with quality adjustment
        canvas.toBlob(
          (compressedBlob) => {
            resolve(compressedBlob);
          },
          'image/jpeg',
          0.5  // Adjust quality (0.1 to 1.0)
        );
        
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const createAndDownloadZip = async () => {
    if (!preview) return;
    
    try {
      const zip = new JSZip();
      
      // Fetch and compress the image
      const response = await fetch(preview);
      const originalBlob = await response.blob();
      const compressedBlob = await compressImage(originalBlob);
      
      console.log('Original size:', originalBlob.size / 1024, 'KB');
      console.log('Compressed size:', compressedBlob.size / 1024, 'KB');
      
      // Add the compressed image to the zip
      zip.file("processed-image.jpg", compressedBlob);
      
      // Generate zip with maximum compression
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "processed-image.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip:', error);
      alert('Failed to create zip file');
    }
  };

  const handleEmailSend = async () => {
    if (!preview || !email) return;
    
    setIsSending(true);
    try {
      const zip = new JSZip();
      
      // Fetch and compress the image
      const response = await fetch(preview);
      const originalBlob = await response.blob();
      const compressedBlob = await compressImage(originalBlob);
      
      // Add the compressed image to the zip
      zip.file("processed-image.jpg", compressedBlob);
      
      const base64Content = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      const templateParams = {
        to_email: email,
        message: "Here is your processed image.",
        attachment: {
          name: "processed-image.zip",
          data: base64Content,
          type: "application/zip"
        }
      };

      const result = await emailjs.send(
        'service_270q8fl',
        'template_kpkkahu',
        templateParams,
        'lhfP3lB03VJ6CTZUJ'
      );

      console.log('Email sent successfully:', result);
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const scheduleEmail = async () => {
    if (!preview || !email) return;
    
    setIsScheduling(true);
    try {
      const zip = new JSZip();
      
      const responseSchedule = await fetch(preview);
      const blob = await responseSchedule.blob();
      
      zip.file("processed-image.jpg", blob);
      
      const base64Content = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      const emailData = {
        email: email,
        message: "Here is your processed image.",
        attachment: {
          name: "processed-image.zip",
          data: base64Content,
          type: "application/zip"
        }
      };

      // Send to backend for scheduling
      const response = await fetch('http://localhost:3001/schedule-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error('Failed to schedule email');
      }

      alert('Email scheduled for 9 AM tomorrow!');
    } catch (error) {
      console.error('Error scheduling email:', error);
      alert('Failed to schedule email. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
        />
        <button type="submit" disabled={!selectedFile || isLoading}>
          {isLoading ? 'Processing...' : 'Process Image'}
        </button>
      </form>

      {preview && (
        <div>
          <h3>Image Preview:</h3>
          <img src={preview} alt="Preview" style={{maxWidth: '300px'}} />
          
          <div style={{marginTop: '20px'}}>
            <button 
              onClick={createAndDownloadZip}
              style={{marginRight: '10px'}}
            >
              Download ZIP
            </button>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              style={{marginRight: '10px'}}
            />
            <button 
              onClick={handleEmailSend}
              disabled={!email || isSending}
              style={{marginRight: '10px'}}
            >
              {isSending ? 'Sending...' : 'Send Now'}
            </button>
            <button 
              onClick={scheduleEmail}
              disabled={!email || isScheduling}
            >
              {isScheduling ? 'Scheduling...' : 'Schedule for 9 AM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;