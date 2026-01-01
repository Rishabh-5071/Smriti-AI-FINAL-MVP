from fastapi import FastAPI, Request, HTTPException
from mongo import mongoDB
import os
import datetime
from bson.objectid import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

# CORS configuration for your frontend
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
    "https://recall-dashboard.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HELPER FUNCTION: Now requires an email to find the correct user
def get_user_by_email(email: str):
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = mongoDB.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/get-user")
def return_user(email: str):
    # This route now dynamically finds the user based on the email passed in the URL
    user = get_user_by_email(email)
    user["_id"] = str(user["_id"])  # Convert ObjectId to string for JSON
    return user

@app.post("/create-user")
async def create_user(request: Request):
    data = await request.json()
    name = data.get("name")
    email = data.get("email")
    broadcastList = data.get("broadcastList", [])

    try:
        # Check if user already exists
        if mongoDB.users.find_one({"email": email}):
            return {"message": "User already exists"}
            
        result = mongoDB.users.insert_one(
            {"name": name, "email": email, "broadcastList": broadcastList, "relations": [], "reminders": []}
        )
        return {
            "message": "User created successfully",
            "user_id": str(result.inserted_id)
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"error": "User not created"}

@app.post("/add-relation")
async def add_relation(request: Request):
    data = await request.json()
    email = data.get("email")  # Identify user by email
    new_relation = data.get("relation")

    user = get_user_by_email(email)
    relations = user.get("relations", [])
    
    # Update existing relation or add new one
    updated_relations = [r if r["id"] != new_relation["id"] else new_relation for r in relations]
    if new_relation not in updated_relations:
        updated_relations.append(new_relation)

    try:
        mongoDB.users.update_one(
            {"email": email},
            {"$set": {"relations": updated_relations}},
        )
        return {"message": "Relation added successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/message/add")
async def add_message(request: Request):
    data = await request.json()
    email = data.get("email")
    message = data.get("message", "")
    relation_id = data.get("relation_id")

    user = get_user_by_email(email)
    relations = user.get("relations", [])

    for relation in relations:
        if relation["id"] == relation_id:
            messages = relation.get("messages", [])
            messages.append(message)
            relation["messages"] = messages

    try:
        mongoDB.users.update_one(
            {"email": email}, {"$set": {"relations": relations}}
        )
        return {"message": "Message added successfully"}
    except Exception as e:
        return {"error": "Message not added"}

@app.post("/reminder/add")
async def add_user_reminder(request: Request):
    data = await request.json()
    email = data.get("email")
    reminder_time = data.get("time")
    message = data.get("message")

    try:
        # Validate time format
        datetime.datetime.strptime(reminder_time, "%H:%M")
        
        user = get_user_by_email(email)
        new_id = len(user.get("reminders", [])) + 1
        new_reminder = {"id": new_id, "time": reminder_time, "message": message}

        mongoDB.users.update_one(
            {"email": email}, {"$push": {"reminders": new_reminder}}
        )
        return {"message": f"Reminder set for {reminder_time}"}
    except ValueError:
        return {"error": "Invalid time format. Use HH:MM"}

@app.get("/reminder/get")
async def get_user_reminders(email: str):
    user = get_user_by_email(email)
    return {"reminders": user.get("reminders", [])}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)