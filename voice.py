import speech_recognition as sr
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import wave
import pyaudio


def record_until_sentence():
    """
    Records audio and converts it to text, stopping at the end of a sentence.
    Returns the transcribed text.

    Requirements:
    pip install SpeechRecognition pyaudio pydub
    """

    # Audio recording parameters
    CHUNK = 1024
    FORMAT = pyaudio.paFloat32
    CHANNELS = 1
    RATE = 44100

    # Initialize recognizer
    recognizer = sr.Recognizer()

    # Initialize PyAudio
    audio = pyaudio.PyAudio()

    print("Listening... Speak your sentence.")

    # Start recording
    stream = audio.open(
        format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK
    )

    frames = []
    silence_threshold = 30  # 30 frames of silence (about 0.7 seconds)
    silence_count = 0

    try:
        # Record until we detect end of sentence (prolonged silence)
        while True:
            data = stream.read(CHUNK)
            frames.append(data)

            # Check for silence
            if max(abs(float(x)) for x in data) < 0.01:  # Adjust threshold as needed
                silence_count += 1
            else:
                silence_count = 0

            # If we detect enough silence, assume end of sentence
            if silence_count >= silence_threshold:
                break

    finally:
        # Clean up
        stream.stop_stream()
        stream.close()
        audio.terminate()

    # Save recording temporarily
    with wave.open("temp_recording.wav", "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(audio.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))

    # Convert speech to text
    try:
        with sr.AudioFile("temp_recording.wav") as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return text
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError:
        return "Could not request results from speech recognition service"


# Example usage
if __name__ == "__main__":
    try:
        result = record_until_sentence()
        print(f"Transcribed text: {result}")
    except Exception as e:
        print(f"An error occurred: {e}")
