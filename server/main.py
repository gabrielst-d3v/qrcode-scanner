import platform
import subprocess
import time
import threading
from pathlib import Path
from flask import Flask, request

app = Flask(__name__)

# ajuste esse caminho pra onde o adb.exe estiver, relativo ao .exe
ADB_PATH = Path(__file__).parent / "platform-tools" / "adb.exe"

def adb_reverse_watch():
    """Mantém o adb reverse ativo, reaplicando sempre que o celular reconectar."""
    while True:
        subprocess.run([str(ADB_PATH), "wait-for-device"])
        time.sleep(1)
        subprocess.run([str(ADB_PATH), "reverse", "tcp:3000", "tcp:3000"])
        print("adb reverse aplicado")

        # fica checando até o celular sumir, pra então voltar a esperar
        while True:
            result = subprocess.run(
                [str(ADB_PATH), "get-state"],
                capture_output=True
            )
            if result.returncode != 0:
                break
            time.sleep(2)
        print("celular desconectado, aguardando reconexão")

def type_and_enter(code: str):
    if platform.system() == "Windows":
        import pyautogui
        pyautogui.typewrite(code, interval=0.01)
        pyautogui.press("enter")
    elif platform.system() == "Linux":
        subprocess.run(["ydotool", "type", code])
        subprocess.run(["ydotool", "key", "28:1", "28:0"])
    else:
        raise NotImplementedError("Sistema operacional não suportado")

@app.post("/scan")
def scan():
    code = request.json["code"]
    print(f"Recebido: {code}")
    type_and_enter(code)
    return {"ok": True}

if __name__ == "__main__":
    if ADB_PATH.exists():
        threading.Thread(target=adb_reverse_watch, daemon=True).start()
    else:
        print(f"Aviso: adb.exe não encontrado em {ADB_PATH}, reverse não será automático")

    app.run(host="127.0.0.1", port=3000)