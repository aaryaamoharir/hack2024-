import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import JSZip from 'jszip';

const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  //shouldnt need these 
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    try {
      const processedPreviews = [];
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('http://127.0.0.1:8000/colorize', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        processedPreviews.push(URL.createObjectURL(blob));
      }
      
      setPreviews(processedPreviews);
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setIsLoading(false);
    }
  };

 //send the email 
  const handleEmailSend = async () => {
    if (previews.length === 0 || !email) return;
    
    setIsSending(true);
    try {
      const zip = new JSZip();
      
      // Process all images
      for (let i = 0; i < previews.length; i++) {
        const response = await fetch(previews[i]);
        const originalBlob = await response.blob();
        const compressedBlob = await compressImage(originalBlob);
        
        // Add each compressed image to the zip with a unique name
        zip.file(`processed-image-${i + 1}.jpg`, compressedBlob);
      }
      
      const base64Content = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      const templateParams = {
        to_email: email,
        message: "Here are your processed images.",
        attachment_name: "processed-images.zip",
        attachment_data: base64Content
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

  const createAndDownloadZip = async () => {
    if (previews.length === 0) return;
    
    try {
      const zip = new JSZip();
      
      // Process all images
      for (let i = 0; i < previews.length; i++) {
        const response = await fetch(previews[i]);
        const originalBlob = await response.blob();
        const compressedBlob = await compressImage(originalBlob);
        
        console.log(`Image ${i + 1} - Original size:`, originalBlob.size / 1024, 'KB');
        console.log(`Image ${i + 1} - Compressed size:`, compressedBlob.size / 1024, 'KB');
        
        // Add each compressed image to the zip
        zip.file(`processed-image-${i + 1}.jpg`, compressedBlob);
      }
      
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
      link.download = "processed-images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip:', error);
      alert('Failed to create zip file');
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

  const scheduleEmail = async () => {
    if (previews.length === 0 || !email || !scheduledTime) return;
    
    const selectedTime = new Date(scheduledTime);
    if (selectedTime <= new Date()) {
      alert('Please select a future time');
      return;
    }
    
    setIsScheduling(true);
    try {
      const zip = new JSZip();
      
      // Process all images
      for (let i = 0; i < previews.length; i++) {
        const response = await fetch(previews[i]);
        const originalBlob = await response.blob();
        const compressedBlob = await compressImage(originalBlob);
        
        zip.file(`processed-image-${i + 1}.jpg`, compressedBlob);
      }
      
      const base64Content = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      const emailData = {
        email: email,
        message: "Here are your processed images.",
        attachment_name: "processed-images.zip",
        attachment_data: base64Content,
        scheduledTime: scheduledTime
      };

      console.log(emailData)

      console.log('Scheduling email with data:', {
        email: emailData.email,
        scheduledTime: emailData.scheduledTime,
        hasAttachment: !!emailData.attachment_data
      });

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

      alert(`Email scheduled for ${new Date(scheduledTime).toLocaleString()}`);
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
          multiple  // Add this to allow multiple file selection
        />
        <button type="submit" disabled={selectedFiles.length === 0 || isLoading}>
          {isLoading ? 'Processing...' : 'Process Images'}
        </button>
      </form>

      {previews.length > 0 && (
        <div>
          <h3>Image Previews:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {previews.map((preview, index) => (
              <img 
                key={index} 
                src={preview} 
                alt={`Preview ${index + 1}`} 
                style={{maxWidth: '300px'}} 
              />
            ))}
          </div>
          
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

            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={{marginRight: '10px'}}
              min={new Date().toISOString().slice(0, 16)} // Prevents selecting past times
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
              disabled={!email || isScheduling || !scheduledTime}
            >
              {isScheduling ? 'Scheduling...' : 'Schedule Email'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;