
// ImageToTextService.ts
import axios from 'axios';
import { Buffer } from 'buffer';

const HUGGING_FACE_API_TOKEN = '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'; // Replace with your actual token

export interface ImageDescription {
  generated_text: string;
}

export async function getImageDescription(
  imageBase64: string
): Promise<ImageDescription[] | null> {
  const apiUrl =
    'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning';

  try {
    const response = await axios.post<ImageDescription[]>(
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
