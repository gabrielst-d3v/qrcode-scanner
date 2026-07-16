import {
  Button,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

const { height, width } = Dimensions.get("screen");
const beepSource = require("./assets/beep.mp3");

export default function App() {
  const [permissions, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const scanLock = useRef(false);
  const player = useAudioPlayer(beepSource);

  async function handleBarcodeScanned({ data, type }: { data: string; type: string }) {
    if (scanLock.current) return;
    scanLock.current = true;

    const isValid =
      type === "code128"
        ? /^\d{44}$/.test(data)
        : type === "qr"
        ? /^BR\d{13}$/.test(data)
        : false;

    if (!isValid) {
      console.log(`Leitura inválida (${type}), tentar novamente:`, data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => (scanLock.current = false), 500);
      return;
    }

    player.seekTo(0);
    player.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await fetch("http://localhost:3000/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data, type }),
      });
    } catch (error) {
      console.log("Erro ao enviar:", error);
    }

    // fecha a câmera após uma leitura válida
    setIsScanning(false);
    setTimeout(() => (scanLock.current = false), 3000);
  }

  async function handleAllow() {
    await requestPermission();
  }

  async function handleStartScan() {
    if (!permissions?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    scanLock.current = false;
    setIsScanning(true);
  }

  if (isScanning) {
    return (
      <>
        <CameraView
          style={styles.camera}
          autofocus="on"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <Image style={styles.qrCodeImage} source={require("./assets/qrcode-scanner.png")} />
        <View style={styles.cancelButton}>
          <Button title="Cancelar" onPress={() => setIsScanning(false)} color="#FF3B30" />
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Leitor de código de acesso</Text>
      <Text style={styles.message}>
        Toque em "Escanear" para abrir a câmera e ler o QR Code ou código de barras.
      </Text>
      <Button title="Escanear" onPress={handleStartScan} />
      {!permissions?.granted && permissions?.canAskAgain === false && (
        <Text style={[styles.message, { marginTop: 16, color: "#FF3B30" }]}>
          Permissão de câmera negada. Habilite manualmente nas configurações do sistema.
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#20232A",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32
  },
  title: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center"
  },
  message: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 16,
    marginBottom: 32,
    textAlign: "center"
  },
  camera: { flex: 1 },
  qrCodeImage: {
    height: 256,
    width: 256,
    position: "absolute",
    left: width / 2 - 128,
    top: height / 2 - 128
  },
  cancelButton: {
    position: "absolute",
    bottom: 48,
    left: 32,
    right: 32
  }
});