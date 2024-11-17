import React from 'react';
import ImageUploader from './ImageUploader';
import { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState([{}]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/members")
      .then(res => res.json())
      .then(data => {
        setData(data);
        console.log(data); 
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <div className="App">
      <h1>Image Processor</h1>
      <ImageUploader />
    </div>
  );
}

export default App;