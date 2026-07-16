import platform
import subprocess

def type_and_enter(code: str):
    if platform.system() == "Linux":
        subprocess.run(["ydotool", "type", code])
        subprocess.run(["ydotool", "key", "28:1", "28:0"])
    elif platform.system() == "Windows":
        import pyautogui
        pyautogui.typewrite(code, interval=0.01)
        pyautogui.press("enter")
    else:
        raise NotImplementedError("Sistema operacional não suportado")