import geopy.distance
import geocoder
import time
import random
import time
from datetime import datetime, time as datetime_time
from typing import List
import threading


def is_in_zone(center_lat, center_lon, radius_km, current_lat, current_lon):
    """Checks if a point is within a given radius from the center."""
    center = (center_lat, center_lon)
    current = (current_lat, current_lon)
    distance = geopy.distance.distance(center, current).km
    return distance <= radius_km

def get_current_location():
    """Gets the current location using geocoder."""
    g = geocoder.ip('me')  # Use IP-based geolocation, you can replace this with GPS if available
    return g.latlng  # Returns [latitude, longitude]


# def get_current_location(center_lat, center_lon, variation=0.05):
#     """Simulate changing location within a range of the initial location."""
#     # Generate random lat, lon within the variation range
#     lat = center_lat + random.uniform(-variation, variation)
#     lon = center_lon + random.uniform(-variation, variation)
#     return [lat, lon]


def track_zone_exit(radius_km, update_interval_seconds=5):
    """Tracks when the user leaves a specified zone, with center as current location."""
    
    # Get current location and set it as the center of the zone
    location = get_current_location()
    
    if location is None:
        print("Could not retrieve location. Please try again.")
        return
    
    center_lat, center_lon = location
    print(f"Setting zone center to current location: {center_lat}, {center_lon}")

    # Keep track of whether the user has exited the zone
    in_zone = True
    
    while True:
        # Get current location again to check if the user has moved
        location = get_current_location()

        
        
        if location is None:
            print("Could not retrieve location. Please try again.")
            break
        
        current_lat, current_lon = location
        print(f"Current location: {current_lat}, {current_lon}")

        if is_in_zone(center_lat, center_lon, radius_km, current_lat, current_lon):
            if not in_zone:
                print("You have re-entered the zone!")
                in_zone = True
            else:
                print("Still inside the zone.")
        else:
            if in_zone:
                print("You have left the zone!")
                in_zone = False
                return "Exited zone"  # Return when the user leaves the zone
        
        time.sleep(update_interval_seconds)


# Reminder class
class Reminder:
    def __init__(self, reminder_time: datetime_time, message: str):
        self.time = reminder_time
        self.message = message

    def __repr__(self):
        return f"Reminder at {self.time}: {self.message}"

# In-memory storage for reminders
reminders: List[Reminder] = []

def add_reminder(reminder_time: str, message: str) -> str:
    """
    Adds a new reminder.
    
    Parameters:
        reminder_time (str): Reminder time in 'HH:MM' format.
        message (str): Reminder message.
    
    Returns:
        str: Confirmation message.
    """
    try:
        reminder_time_obj = datetime.strptime(reminder_time, "%H:%M").time()
        reminder = Reminder(reminder_time_obj, message)
        reminders.append(reminder)
        return f"Reminder set for {reminder_time} - '{message}'"
    except ValueError:
        return "Invalid time format. Please use HH:MM in 24-hour format."

def get_reminders() -> List[str]:
    """
    Retrieves all reminders.
    
    Returns:
        List[str]: List of all reminders in string format.
    """
    return [str(reminder) for reminder in reminders]

def delete_reminder(reminder_time: str) -> str:
    """
    Deletes a reminder by its time.
    
    Parameters:
        reminder_time (str): Time of the reminder to delete in 'HH:MM' format.
    
    Returns:
        str: Confirmation message or error message.
    """
    try:
        reminder_time_obj = datetime.strptime(reminder_time, "%H:%M").time()
        for i, reminder in enumerate(reminders):
            if reminder.time == reminder_time_obj:
                removed_reminder = reminders.pop(i)
                return f"Deleted reminder: {removed_reminder}"
        return "Reminder not found."
    except ValueError:
        return "Invalid time format. Please use HH:MM in 24-hour format."

def check_reminders() -> List[str]:
    """
    Checks for reminders due at the current time and returns notifications.
    Removes the reminders once they are due.
    
    Returns:
        List[str]: List of reminder notifications due at the current time.
    """
    notifications = []
    now = datetime.now().time().replace(second=0, microsecond=0)  # Current time without seconds and microseconds
    # Find and remove reminders that match the current time
    due_reminders = [reminder for reminder in reminders if reminder.time == now]
    for reminder in due_reminders:
        notifications.append(f"Reminder: {reminder.message} at {reminder.time}")
        reminders.remove(reminder)  # Remove the reminder once notified
    return notifications

def reminder_loop():
    """
    Runs a loop that checks reminders every minute.
    This will continuously check for reminders due at the current time and notify the user.
    """
    while True:
        notifications = check_reminders()
        if notifications:
            for notification in notifications:
                print(notification)  # This can be replaced with a different notification mechanism (e.g., email, pop-up)
        time.sleep(60)  # Wait for 60 seconds (1 minute) before checking again

# Start the reminder loop in a separate thread so it runs continuously
def start_reminder_service():
    reminder_thread = threading.Thread(target=reminder_loop, daemon=True)
    reminder_thread.start()



if __name__ == "__main__":
    # Define radius in km
    radius_km = 5
    # Example usage
    start_reminder_service()

    # Adding reminders (This will be done dynamically by the user)
    print(add_reminder("09:00", "Take morning medication"))
    print(add_reminder("22:39", "Attend online meeting"))

    result = track_zone_exit(radius_km)
    print(result)  # This will print "Exited zone" once the user leaves the zone