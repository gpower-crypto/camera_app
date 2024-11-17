// MusicService.ts
import axios from "axios";

const API_KEY = "e9aThOGZ.X3Tse2ofuGHmLUf1qn1WcuOydafMzAwS"; // Replace with your actual API key

export interface MusicData {
  music_url: string;
}

export async function generateMusic(prompt: string): Promise<MusicData | null> {
  const apiUrl =
    "https://model-vq0l722q.api.baseten.co/environments/production/predict";

  try {
    const response = await axios.post<MusicData>(
      apiUrl,
      { prompt }, // Sending prompt as JSON
      {
        headers: {
          Authorization: `Api-Key ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error generating music:", error);
    return null;
  }
}
