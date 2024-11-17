import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";
import { getImageDescription } from "../../services/ImageToTextService";
import { generateMusic } from "../../services/MusicService";

export default function App() {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [description, setDescription] = useState("");
  const [musicUri, setMusicUri] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = React.useRef(null);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleCapture = async (camera) => {
    setLoading(true);
    try {
      const photo = await camera.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      setPhotoUri(photo.uri);

      if (photo.base64) {
        const descriptionData = await getImageDescription(photo.base64);
        setDescription(
          descriptionData[0]?.generated_text || "No description available."
        );
      }
    } catch (error) {
      console.error("Failed to generate description:", error);
      setDescription("Error generating description.");
    }
    setLoading(false);
  };

  const handleGenerateMusic = async () => {
    if (!description) return;

    setLoading(true);
    try {
      const musicData = await generateMusic(description);
      if (musicData && musicData.music_url) {
        setMusicUri(musicData.music_url);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: musicData.music_url },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsMusicPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsMusicPlaying(false);
          }
        });
      } else {
        console.error("Failed to generate music.");
      }
    } catch (error) {
      console.error("Music generation error:", error.message);
      console.log("Music generation error:", error);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                const camera = cameraRef.current;
                if (camera) {
                  handleCapture(camera);
                }
              }}
            >
              <Text style={styles.text}>Take Picture</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.preview}>
          {loading ? (
            <ActivityIndicator size="large" color="#1e90ff" />
          ) : (
            <>
              <Image source={{ uri: photoUri }} style={styles.imagePreview} />
              <Text style={styles.description}>{description}</Text>
              {musicUri ? (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => {
                    sound?.replayAsync();
                    setIsMusicPlaying(true);
                  }}
                >
                  <Text style={styles.text}>
                    {isMusicPlaying ? "Playing Music..." : "Play Music Again"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleGenerateMusic}
                >
                  <Text style={styles.text}>Generate Music</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setPhotoUri(null);
                  setDescription("");
                  setMusicUri(null);
                  sound?.unloadAsync();
                  setSound(null);
                }}
              >
                <Text style={styles.text}>Take Another Picture</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    margin: 20,
  },
  button: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 50,
  },
  text: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  preview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "80%",
    height: "50%",
    borderRadius: 20,
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: "#32cd32",
    padding: 15,
    borderRadius: 50,
    marginVertical: 10,
  },
});
