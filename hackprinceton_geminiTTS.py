import speech_recognition as sr
import pyttsx3

r = sr.Recognizer()



def SpeakText(command):
    engine = pyttsx3.init()
    engine.say(command)
    engine.runAndWait()

while True:
    try:
        with sr.Microphone() as source:
            # Adjust for ambient noise
            print("Adjusting for ambient noise... please wait.")
            r.adjust_for_ambient_noise(source, duration=0.2)
            r.energy_threshold = 1000
            audio = r.listen(source)
            text = r.recognize_google(audio)
            text = text.lower()
            print(f"You said: {text}")

    except sr.RequestError as e:
        print("Error connecting to the recognition service; {0}".format(e))

    except sr.UnknownValueError:
        print("")
