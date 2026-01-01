import sys
import face_recognition
import cv2
import numpy as np
import requests
import threading
import time
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QLabel
from PyQt5.QtCore import QTimer
from PyQt5.QtGui import QPixmap
from uuid import uuid4


# Get a reference to the webcam
video_capture = cv2.VideoCapture(0)

# Load known face
obama_image = face_recognition.load_image_file("chanakya.jpg")
obama_face_encoding = face_recognition.face_encodings(obama_image)[0]

# Initialize known faces
known_face_encodings = [obama_face_encoding]
known_face_uuid = [str(uuid4())]
uuid_to_name = {known_face_uuid[0]: "Chanakya", "no_face": "no_name"}

# Initialize variables
face_locations = []
face_encodings = []
face_names = []
process_this_frame = True
frame_c = 0
recordings = {}
display_names = True
display_remainder_modal = False
button_pressed_time = None
remainder_modal_start_time = None
relationship_info = {known_face_uuid[0]: "Friend", "no_face" : "no_relationship"}
latest_summary = {known_face_uuid[0]: "Sample chanakya summary", "no_face" : "no_summary"}
uuid_url = {known_face_uuid[0]: "Ignore this url", "no_face" : "no_url"}
once = 0
count = 0
current_uuid = None


# Video Processing
def process_video_frame():
    global face_locations, current_uuid, face_encodings, face_names, frame_c, process_this_frame, display_remainder_modal, count
    
    while True:
        ret, frame = video_capture.read()
        frame_c += 1

        if process_this_frame:
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = small_frame[:, :, ::-1]

            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            face_uuids = []
            name = "no_face"
            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
                uuid = None;
                face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                if len(face_distances):
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        uuid = known_face_uuid[best_match_index]

                if not uuid:
                    count += 1
                    new_uuid = str(uuid4());
                    name = f"New Person {count}"
                    known_face_encodings.append(face_encoding)
                    known_face_uuid.append(new_uuid)
                    uuid_to_name[new_uuid] = name;
                    relationship_info[str(new_uuid)] = "Unknown"
                    latest_summary[str(new_uuid)] = "Unknown"
                    uuid = new_uuid
                    save_unknown_face(frame, uuid)
                    display_unknown_face(frame)
                
                current_uuid = uuid;
                face_uuids.append(str(uuid))
                if len(recordings) == 0:
                    threading.Thread(target=trigger_recording_api, args=(uuid,)).start()
                    recordings[str(uuid)] = 1
                    break;

            for rec in list(recordings.keys()):
                if rec not in face_uuids:
                    recordings[rec] += 1
                    print(rec, recordings[rec]);
                    if recordings[rec] == 2:
                        recordings.pop(rec)
                        threading.Thread(target=trigger_stop_recording_api, args=(rec,)).start()
                else:
                    recordings[rec] = 1

        process_this_frame = frame_c % 50 == 0

        if display_names:
            add_name_modal(frame, face_uuids)

        if display_remainder_modal:
            add_remainder_modal(frame)

        cv2.namedWindow('Video', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Video', frame.shape[1] * 2, frame.shape[0] * 2)
        cv2.imshow('Video', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

# Functions for face display, modal overlays, and API calls
def add_name_modal(frame, face_uuids):
    height, width, _ = frame.shape
    modal_width, modal_height = 300, 100
    x1, y1 = width - modal_width - 10, height - modal_height - 10
    x2, y2 = x1 + modal_width, y1 + modal_height
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 255), 2)
    uuid = face_uuids[0] if face_uuids else "no_face"
    cv2.putText(frame, uuid_to_name[uuid], (x1 + 10, y1 + 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(frame, f"{relationship_info[uuid]}", (x1 + 10, y1 + 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 1)

def add_remainder_modal(frame):
    modal_width, modal_height = 500, 50
    x1, y1 = 10, 10
    x2, y2 = x1 + modal_width, y1 + modal_height
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 255), 2)
    cv2.putText(frame, "Reminder: Take Medicines", (x1 + 10, y1 + 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

def save_unknown_face(frame, uuid):
    # Generate a unique filename using the current timestamp
    unknown_image_path = f"unknown_faces/face_{uuid}.jpg"
    
    # Save the frame as an image
    cv2.imwrite(unknown_image_path, frame)
    uuid_url[uuid] = upload_to_imgur(unknown_image_path);
    print(f"Saved unknown face image: {uuid_url[uuid]}")

# def display_unknown_face(frame):
#     unknown_image_path = "unknown_faces/unknown_face.jpg"
#     cv2.imwrite(unknown_image_path, frame)  # Save the frame as an image
#     print("Saved and displayed unknown face image.")

def trigger_recording_api(id):
    print("Starting recording for", id);
    payload = {"Task": "start_recording", "id": str(id)}
    requests.post("https://62e5-66-180-180-18.ngrok-free.app/trigger-recording", json=payload)

def trigger_stop_recording_api(id):
    global name, relationship_info, latest_summary
    print("Stopping recording for", id);
    payload = {"Task": "stop_recording", "id": str(id)}
    response = requests.post("https://62e5-66-180-180-18.ngrok-free.app/trigger-recording", json=payload)
    json_response = response.json()
    print(json_response);
    try:
        resp_relationship = json_response['ai_response']['Relationship']
        resp_summary = json_response['ai_response']['convo_summary']
        resp_name = json_response['ai_response']['name']
        if resp_name != "no_name":
            uuid_to_name[id] = resp_name
        latest_summary[id] = resp_summary
        relationship_info[id] = resp_relationship
        data = {
            "relation" : {
                "id": id,
                "name": uuid_to_name[id],
                "relationship": relationship_info[id],
                "photo": uuid_url[id],
            }
        }
        response = requests.post("https://recall-backend-5rw5.onrender.com/add-relation", json=data)
        print("Add Relation:",str(response.json()))

        data = {
            "relation_id": id,
            "message": latest_summary[id],
        }
        response = requests.post("https://recall-backend-5rw5.onrender.com/message/add", json=data)
        print("Message Add:", str(response.json()));
    except:
        print("No message")
        pass

def upload_to_imgur(img_path):
    import base64
    import os
    try:
        url = "https://api.imgur.com/3/image"
        headers = {"Authorization": "Client-ID 1846dba0b1de312"}

        # Read image file and encode as base64
        with open(img_path, "rb") as file:
            data = file.read()
            base64_data = base64.b64encode(data)

        # Upload image to Imgur and get URL
        response = requests.post(url, headers=headers, data={"image": base64_data})
        url = response.json()["data"]["link"]

        return url
    except Exception as e:
        print(f"Error uploading to Imgur: {e}")
        return None

def toggle_modal_visibility():
    global display_names, button_pressed_time, remainder_modal_start_time, once, current_uuid
    threading.Thread(target=trigger_count_api, args=(current_uuid,)).start()
    display_names = not display_names
    button_pressed_time = time.time()
    remainder_modal_start_time = button_pressed_time + 3
    once += 1

def trigger_count_api(current):
    data = {
        "relation_id": current,
    }
    response = requests.post("https://recall-backend-5rw5.onrender.com/count", json=data)
    print("Count: ", str(response.json()));


def check_modal_timers():
    global display_remainder_modal, remainder_modal_start_time, once
    if once == 1 and remainder_modal_start_time and time.time() >= remainder_modal_start_time:
        display_remainder_modal = True
        QTimer.singleShot(5000, hide_remainder_modal)

def hide_remainder_modal():
    global display_remainder_modal
    display_remainder_modal = False

# PyQt Setup
app = QApplication(sys.argv)
window = QWidget()
window.setWindowTitle("Video Feed")
layout = QVBoxLayout()

# Toggle button for visibility
toggle_button = QPushButton("Toggle Modal Visibility")
toggle_button.clicked.connect(toggle_modal_visibility)
layout.addWidget(toggle_button)

# Container for unknown face images
unknown_faces_layout = QVBoxLayout()  # Layout to hold all unknown face images
layout.addLayout(unknown_faces_layout)  # Add this layout to the main layout

window.setLayout(layout)

# Timer to check modal visibility periodically
timer = QTimer()
timer.timeout.connect(check_modal_timers)
timer.start(1000)

window.show()

# Function to display each unknown face as a new QLabel in the GUI
def display_unknown_face(frame):
    # Generate a unique filename for each unknown face
    unknown_image_path = f"unknown_faces/unknown_face_{int(time.time())}.jpg"
    cv2.imwrite(unknown_image_path, frame)  # Save the frame as an image

    # Create a QLabel to display the new unknown face image
    image_label = QLabel()
    pixmap = QPixmap(unknown_image_path)  # Load the saved image into QPixmap
    image_label.setPixmap(pixmap)  # Set QPixmap on QLabel to display the image
    image_label.setScaledContents(True)  # Make the image fit QLabel dimensions if needed
    
    # Add QLabel to the unknown faces layout
    unknown_faces_layout.addWidget(image_label)
    
    print(f"Saved and displayed unknown face image: {unknown_image_path}")

# Start processing video frames
process_video_frame()
sys.exit(app.exec_())

