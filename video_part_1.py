import face_recognition
import cv2
import numpy as np
import requests
import threading

# Get a reference to webcam #0 (the default one)
video_capture = cv2.VideoCapture(0)

# Load a sample picture and learn how to recognize it.
obama_image = face_recognition.load_image_file("chanakya.jpg")
obama_face_encoding = face_recognition.face_encodings(obama_image)[0]

# Create arrays of known face encodings and their names
known_face_encodings = [obama_face_encoding]
known_face_names = ["Chanakya"]

# Initialize variables
face_locations = []
face_encodings = []
face_names = []
process_this_frame = True
frame_c = 0

recordings = {}

# Function to handle video frame processing
def process_video_frame():
    global face_locations, face_encodings, face_names, frame_c, process_this_frame
    while True:
        # Grab a single frame of video
        ret, frame = video_capture.read()
        frame_c += 1

        # Only process every other frame to save time
        if process_this_frame:
            # Resize and convert frame for face_recognition
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = small_frame[:, :, ::-1]

            # Detect faces
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            face_names = []

            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
                name = "Unknown"

                face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                if len(face_distances):
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = known_face_names[best_match_index]

                face_names.append(name)

                # Make the API call when "Chanakya" is detected, in a separate thread
                if name not in recordings:
                    # Start a new thread to make the API call asynchronously
                    threading.Thread(target=trigger_recording_api, args=(name,)).start()
                    recordings[name] = 1

            for rec in list(recordings.keys()):
                if rec not in face_names:
                    # print("HERE")
                    recordings[rec] += 1
                    # print(recordings[rec])
                    if recordings[rec] == 10:
                        recordings.pop(rec);
                        threading.Thread(target=trigger_stop_recording_api, args=(name,)).start()
                        

        process_this_frame = frame_c % 5 == 0

        # Display results
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4

            # Draw a box and label
            cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)

        cv2.imshow('Video', frame)

        # Quit on 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

# Function to trigger the API call asynchronously
def trigger_recording_api(id):
    payload = {"Task": "start_recording", "id": id}
    try:
        response = requests.post("https://98f4-66-180-180-2.ngrok-free.app/trigger-recording", json=payload)
        if response.status_code == 200:
            print(f"Started recording for id: {id}.")
        else:
            print(f"Failed to start recording: {response.status_code}")
    except Exception as e:
        print(f"Error making API call: {e}")

def trigger_stop_recording_api(id):
    payload = {"Task": "stop_recording", "id": id}
    try:
        response = requests.post("https://98f4-66-180-180-2.ngrok-free.app/trigger-recording", json=payload)
        try:
            data = response.json()
        except requests.JSONDecodeError:
            data = None
        print(data)
        if response.status_code == 200:
            print(f"Stopping recording for id: {id}.")
        else:
            print(f"Failed to stop recording: {response.status_code}")
    except Exception as e:
        print(f"Error making API call: {e}")

# Start the video processing in a separate thread (This will run continuously until 'q' is pressed)
process_video_frame()

# Release resources
video_capture.release()
cv2.destroyAllWindows()
