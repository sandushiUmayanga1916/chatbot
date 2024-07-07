import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faFilePdf, faRedo } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const App = () => {
  const [userInput, setUserInput] = useState('');
  const [story, setStory] = useState('');
  const [summary, setSummary] = useState('');
  const [storyName, setStoryName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (userInput.trim() === '') return;
    setLoading(true);

    try {
      const response = await axios.post('https://vercel-deployment-server-virid.vercel.app/api/chat', { message: userInput });
      const { story, summary, imageUrl, storyName } = response.data;

      setStory(story);
      setSummary(summary);
      setImageUrl(imageUrl);
      setStoryName(storyName);
      setChatHistory([...chatHistory, { userInput, story, storyName, summary, imageUrl }]);
      setUserInput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!story) return;

    try {
      const response = await axios.post('https://vercel-deployment-server-virid.vercel.app/api/pdf', { story, imageUrl, storyName }, { responseType: 'blob' });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = 'story.pdf';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleRegenerateStory = async (originalStory, regeneratePrompt) => {
    try {
      const response = await axios.post('https://vercel-deployment-server-virid.vercel.app/api/regenerate-story', { story: originalStory, regeneratePrompt });
      const { newStory } = response.data;

      setStory(newStory);
      setChatHistory(chatHistory.map((entry) => 
        entry.story === originalStory ? { ...entry, story: newStory } : entry
      ));
    } catch (error) {
      console.error('Error regenerating story:', error);
    }
  };

  const handleRegenerateImage = async (originalSummary, regeneratePrompt) => {
    try {
      const response = await axios.post('https://vercel-deployment-server-virid.vercel.app/api/regenerate-image', { summary: originalSummary, regeneratePrompt });
      const { newImageUrl } = response.data;

      setImageUrl(newImageUrl);
      setChatHistory(chatHistory.map((entry) => 
        entry.summary === originalSummary ? { ...entry, imageUrl: newImageUrl } : entry
      ));
    } catch (error) {
      console.error('Error regenerating image:', error);
    }
  };

  const handleDeleteChat = (index) => {
    const newChatHistory = [...chatHistory];
    newChatHistory.splice(index, 1);
    setChatHistory(newChatHistory);
  };

  const handleDescribeImage = async (imageUrl) => {
    try {
      const response = await axios.post('https://vercel-deployment-server-virid.vercel.app/api/describe-image', { imageUrl });
      setDescription(response.data.description);
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError('Error fetching image description');
      setDescription('');
    }
  };

  useEffect(() => {
    console.log(chatHistory);
  }, [chatHistory]);

  return (
    <div className="App">
      <div className="chat-container">
        <h1>Open AI Story Generator</h1>
        {chatHistory.map((chat, index) => (
          <div className="chat-item" key={index}>
            <div className="user-input">
              <strong>Prompt:</strong> {chat.userInput}
            </div>
            <div className="story-name">
              <strong>Story Name:</strong> {chat.storyName}
            </div>
            <div className="story-output">
              <strong>Story:</strong> {chat.story}
            </div>
            {chat.imageUrl && (
              <div className="image-output">
                <img src={chat.imageUrl} alt="Generated" />
              </div>
            )}
            <div className="chat-actions">
              <button onClick={() => handleGeneratePDF(chat.story, chat.imageUrl, chat.storyName)}>
                <FontAwesomeIcon icon={faFilePdf} /> Download PDF
              </button>
              <button onClick={() => handleRegenerateStory(chat.story)}>
                <FontAwesomeIcon icon={faRedo} /> Regenerate Story
              </button>
              <button onClick={() => handleRegenerateImage(chat.summary)}>
                <FontAwesomeIcon icon={faRedo} /> Regenerate Image
              </button>
              <button onClick={() => handleDeleteChat(index)}>
                <FontAwesomeIcon icon={faTrash} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <p>**The prompt should start like this: 'Tell me a story,' 'Write a story,' or 'Create a story.......'</p> 
      <div className="input-container">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your story prompt..."
          disabled={loading}
        />
        <button onClick={handleSubmit} disabled={loading}>
          <FontAwesomeIcon icon={faPaperPlane} /> {loading ? 'Loading...' : 'Submit'}
        </button>
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="Enter image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button onClick={() => handleDescribeImage(imageUrl)}>Describe Image</button>
      </div>

      {description && (
        <div className="description-container">
          <p className="description-label">Generated Story base on Image:</p>
          <p className="description-text">{description}</p>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

    </div>
  );
};

export default App;
