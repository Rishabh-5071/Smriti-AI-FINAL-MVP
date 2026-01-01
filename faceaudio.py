import threading
from time import sleep
import time
import random
from video import video


# Global variables
face_id = "empty"
stop_flag = False  # Flag to signal threads to stop

# Lock to synchronize access to the global variable
lock = threading.Lock()


# Function to set the global variable from a thread
# def video():
#     import face_recognition
#     import cv2
#     import numpy as np

#     # Get a reference to webcam #0 (the default one)
#     video_capture = cv2.VideoCapture(0)

#     # Load a sample picture and learn how to recognize it.
#     obama_image = face_recognition.load_image_file("temp_frame.jpg")
#     obama_face_encoding = face_recognition.face_encodings(obama_image)[0]

#     # Create arrays of known face encodings and their names
#     known_face_encodings = [obama_face_encoding]
#     known_face_names = ["Vedanta"]

#     # Initialize variables
#     face_locations = []
#     face_encodings = []
#     face_names = []
#     process_this_frame = True
#     audioRecording = False
#     frame_c = 0
#     count = 0

#     # Function to handle video frame processing
#     def process_video_frame():
#         nonlocal face_locations, face_encodings, face_names, frame_c, process_this_frame
#         global face_id
#         while True:
#             # Grab a single frame of video
#             ret, frame = video_capture.read()
#             frame_c += 1

#             # Only process every other frame to save time
#             if process_this_frame:
#                 # Resize and convert frame for face_recognition
#                 small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
#                 rgb_small_frame = small_frame[:, :, ::-1]

#                 # Detect faces
#                 face_locations = face_recognition.face_locations(rgb_small_frame)
#                 face_encodings = face_recognition.face_encodings(
#                     rgb_small_frame, face_locations
#                 )
#                 face_id = "empty"
#                 face_names = []
#                 for face_encoding in face_encodings:
#                     matches = face_recognition.compare_faces(
#                         known_face_encodings, face_encoding
#                     )
#                     name = "Unknown"

#                     face_distances = face_recognition.face_distance(
#                         known_face_encodings, face_encoding
#                     )
#                     if len(face_distances):
#                         best_match_index = np.argmin(face_distances)
#                         if matches[best_match_index]:
#                             name = known_face_names[best_match_index]
#                     face_id = name
#                     face_names.append(name)

#             process_this_frame = frame_c % 5 == 0

#             # Display results
#             for (top, right, bottom, left), name in zip(face_locations, face_names):
#                 top *= 4
#                 right *= 4
#                 bottom *= 4
#                 left *= 4

#                 # Draw a box and label
#                 cv2.rectangle(
#                     frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED
#                 )
#                 font = cv2.FONT_HERSHEY_DUPLEX
#                 cv2.putText(
#                     frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1
#                 )

#             cv2.imshow("Video", frame)

#             # Quit on 'q' key
#             if cv2.waitKey(1) & 0xFF == ord("q"):
#                 break

#     # Start the video processing in a separate thread

#     # Main thread can continue with other tasks (e.g., waiting for the user to quit)

#     # Continuously display the video feed without blocking the rest of the process
#     process_video_frame()

#     # Release resources
#     video_capture.release()
#     cv2.destroyAllWindows()


# Function to use the global variable from another thread
def audio():
    global face_id
    prompt = """Analyze the following conversation between two persons, 
    Identify the relationship between them (e.g., friends, 
    coworkers, family members, client-professional) based on the tone, topics 
    discussed, and interaction style. Then, provide a concise summary of the 
    conversation, highlighting the main topics, sentiments expressed, and any
    key decisions or conclusions reached by the persons.

    return json object with keys:
    - relationship: string
    - summary: string

    example1: 

    Hey! My weekend was fantastic I went to Paris with my family! 
    The city was as beautiful as ever, with its stunning architecture and lively atmosphere. 
    I invited our younger brother to join us, but unfortunately, he was caught 
    up with work and couldn’t make it. My wife and kids were thrilled, 
    though we explored so many iconic spots, from the Eiffel Tower to cozy 
    little cafés along the Seine. Watching their excitement as they took in the 
    sights was priceless. It was truly a memorable trip! How was your weekend?

    now, the following is what you need to analyse and return a response for:"""
    transcript = ""
    import speech_recognition as sr
    from collections import deque

    r = sr.Recognizer()
    is_recording = False
    ini_person = 0
    queue = deque(maxlen=3)
    try:
        while not stop_flag:  # Check if stop_flag is set
            print("Face ID", face_id)
            queue.append(face_id)
            if face_id != "empty":
                if not is_recording:
                    print("Recording Started.")
                    is_recording = True
                    ini_person = face_id
                    transcript = ""
                else:
                    try:
                        with sr.Microphone() as source:
                            r.energy_threshold = 300
                            audio = r.listen(source)
                            text = r.recognize_google(audio)
                            text = text.lower()
                            transcript += text
                            print(f"You said: {text}")
                    except sr.RequestError as e:
                        print(
                            "Error connecting to the recognition service; {0}".format(e)
                        )
                    except sr.UnknownValueError:
                        pass
            else:
                if len(queue) == 3 and all(value == "empty" for value in queue):
                    if is_recording:
                        is_recording = False
                        print("Recording Stopped.")
                        added_prompt = prompt + transcript
                        thread = threading.Thread(
                            target=summarize, args=(added_prompt,)
                        )
                        thread.start()
            sleep(1)
    except KeyboardInterrupt:
        print("Audio thread interrupted and stopped.")


def summarize(transcript):
    print("Starting summarizer.")
    api_time = random.randint(1, 5)
    print(f"Calling GPT with {transcript}. Going to take {api_time}.")
    sleep(api_time)
    print("GPT Responded.")
    mongo_time = random.randint(1, 5)
    print(f"Updating MongoDB with GPT Response. Going to take {mongo_time}.")
    sleep(mongo_time)
    print("MongoDB Updated")
    print("Summarized ended.")


def main():
    global stop_flag
    # Create threads
    thread1 = threading.Thread(target=video)
    thread2 = threading.Thread(target=audio)

    # Start both threads
    thread1.start()
    thread2.start()

    # Wait for user to interrupt with Ctrl + C
    try:
        while True:
            sleep(1)  # Keep the main thread alive
    except KeyboardInterrupt:
        stop_flag = True  # Set stop_flag to true to stop the threads
        print("\nProgram interrupted by user with Ctrl + C")

    # Wait for both threads to finish
    thread1.join()
    thread2.join()

    print("Both threads have finished execution.")


if __name__ == "__main__":
    main()
