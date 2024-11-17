// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Camera } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { getImageDescription } from '../../services/ImageToTextService';
import { generateMusic } from '../../services/MusicService';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [musicUri, setMusicUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync(); // Correct method
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle taking a picture
  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({ base64: true });
      setPhotoUri(photo.uri);

      // Get image description using Hugging Face API
      const imageBase64 = photo.base64;
      if (imageBase64) {
        const descriptionData = await getImageDescription(imageBase64);

        if (descriptionData && descriptionData.length > 0) {
          setDescription(descriptionData[0].generated_text);
        } else {
          setDescription('No description available.');
        }
      } else {
        console.error('Failed to get base64 of the image.');
      }
    }
  };

  // Generate music based on the description
  useEffect(() => {
    if (description) {
      (async () => {
        const musicData = await generateMusic(description);
        if (musicData && musicData.music_url) {
          setMusicUri(musicData.music_url);

          // Play the music
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: musicData.music_url },
            { shouldPlay: true }
          );
          setSound(newSound);
          setIsMusicPlaying(true);

          // Set up event listener for when the sound finishes
          newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              const playbackStatus = status as AVPlaybackStatusSuccess;
              if (playbackStatus.didJustFinish) {
                setIsMusicPlaying(false);
              }
            }
          });
        } else {
          console.error('Music generation failed.');
        }
      })();
    }
  }, [description]);

  // Cleanup the sound object when the component unmounts or when a new sound is played
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.preview}>
          <Text style={styles.description}>{description}</Text>
          <Image source={{ uri: photoUri }} style={styles.imagePreview} />
          {musicUri ? (
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={async () => {
                  if (sound) {
                    await sound.replayAsync();
                    setIsMusicPlaying(true);
                  }
                }}
              >
                <Text style={styles.controlText}>
                  {isMusicPlaying ? 'Playing Music...' : 'Play Music Again'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.loadingText}>Generating music...</Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              // Reset to take another picture
              setPhotoUri(null);
              setDescription('');
              setMusicUri(null);
              if (sound) {
                sound.unloadAsync();
                setSound(null);
              }
            }}
          >
            <Text style={styles.text}> Take Another Picture </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Camera style={styles.camera} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleTakePicture}>
              <Text style={styles.text}> Take Picture </Text>
            </TouchableOpacity>
          </View>
        </Camera>
      )}
    </View>
  );
}

interface Style {
  container: ViewStyle;
  camera: ViewStyle;
  buttonContainer: ViewStyle;
  button: ViewStyle;
  text: TextStyle;
  preview: ViewStyle;
  imagePreview: ImageStyle;
  description: TextStyle;
  controls: ViewStyle;
  playButton: ViewStyle;
  controlText: TextStyle;
  loadingText: TextStyle;
}

const styles = StyleSheet.create<Style>({
  container: { flex: 1, backgroundColor: '#121212' },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  button: {
    marginBottom: 30,
    backgroundColor: '#1e90ff',
    padding: 15,
    borderRadius: 50,
    width: 200,
    alignItems: 'center',
  },
  text: { fontSize: 18, color: '#fff' },
  preview: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePreview: {
    width: '80%',
    height: '50%',
    borderRadius: 20,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  description: {
    fontSize: 24,
    color: '#fff',
    margin: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  controls: { flexDirection: 'row', margin: 20 },
  playButton: {
    backgroundColor: '#1e90ff',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    width: 200,
  },
  controlText: { fontSize: 18, color: '#fff' },
  loadingText: { fontSize: 18, color: '#fff', marginTop: 20 },
});
