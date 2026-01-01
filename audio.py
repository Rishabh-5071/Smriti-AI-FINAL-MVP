import torch
import pyaudio
import numpy as np
import soundfile as sf
from transformers import pipeline

print("ok")
# Load Whisper model from Hugging Face
transcriber = pipeline("automatic-speech-recognition", model="openai/whisper-large",
                       device=0 if torch.cuda.is_available() else -1)

# Audio stream settings
CHUNK = 512  # Number of frames per buffer
RATE = 4000  # Sampling rate for Whisper
FORMAT = pyaudio.paInt16
CHANNELS = 1

print("yes")
# Initialize PyAudio
p = pyaudio.PyAudio()
stream = p.open(format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK)

print("Recording... Press Ctrl+C to stop.")

buffer = []

try:
    while True:
        # Read data from audio stream
        data = stream.read(CHUNK)
        buffer.append(data)

        # Convert audio buffer to numpy array when buffer size reaches a threshold
        if len(buffer) >= 20:  # Adjust this based on desired response time
            audio_data = b''.join(buffer)
            buffer = []

            # Convert audio to floating point array for Whisper
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

            # Save audio as temporary WAV file
            sf.write("temp_audio.wav", audio_np, RATE)

            # Transcribe the audio file
            transcription = transcriber("temp_audio.wav")['text']
            print("Transcription:", transcription)

except KeyboardInterrupt:
    print("Stopped recording")

finally:
    # Close the stream
    stream.stop_stream()
    stream.close()
    p.terminate()