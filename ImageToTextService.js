// ImageToTextService.js
import axios from 'axios';
import { Buffer } from 'buffer';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

const HUGGING_FACE_API_TOKEN = 'YOUR_HUGGING_FACE_API_TOKEN'; // Replace with your actual token

export async function getImageDescription(imageBase64) {
  const apiUrl =
    'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning';

  try {
    const response = await axios.post(
      apiUrl,
      Buffer.from(imageBase64, 'base64'),
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_API_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        responseType: 'json',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in getImageDescription:', error);
    return null;
  }
}
