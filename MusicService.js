// MusicService.js
import axios from 'axios';

const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key

export async function generateMusic(prompt) {
  const apiUrl =
    'https://model-vq0l722q.api.baseten.co/environments/production/predict';

  try {
    const response = await axios.post(
      apiUrl,
      { prompt },
      {
        headers: {
          Authorization: `Api-Key ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating music:', error);
    return null;
  }
}
