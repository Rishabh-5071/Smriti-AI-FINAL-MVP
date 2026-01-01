from video import video
from voice import record_until_sentence
import threading
from time import sleep

# Global variables
face_id = "empty"
stop_flag = False  # Flag to signal threads to stop

# Lock to synchronize access to the global variable
lock = threading.Lock()

# Wrapper function for voice recognition
def voice():
    while not stop_flag:
        record_until_sentence()

def main():
    global stop_flag
    # Create threads
    thread1 = threading.Thread(target=video)
    thread2 = threading.Thread(target=voice)

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