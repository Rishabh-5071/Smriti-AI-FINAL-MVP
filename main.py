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


# ============== NEW ENDPOINTS FOR FACE RECOGNITION & CONVERSATIONS ==============

@app.post("/register-face")
async def register_face(request: Request):
    """Store face descriptor (128-dimensional embedding) for a relation"""
    data = await request.json()
    email = data.get("email")
    relation_id = data.get("relation_id")
    face_descriptor = data.get("face_descriptor")  # Array of 128 floats
    
    if not face_descriptor or len(face_descriptor) != 128:
        raise HTTPException(status_code=400, detail="Invalid face descriptor. Must be 128-dimensional array.")
    
    user = get_user_by_email(email)
    relations = user.get("relations", [])
    
    relation_found = False
    for relation in relations:
        if relation["id"] == relation_id:
            relation["faceDescriptor"] = face_descriptor
            relation["isRegistered"] = True
            relation_found = True
            break
    
    if not relation_found:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    try:
        mongoDB.users.update_one(
            {"email": email}, 
            {"$set": {"relations": relations}}
        )
        return {"message": "Face registered successfully", "relation_id": relation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get-face-descriptors")
def get_face_descriptors(email: str):
    """Get all registered face descriptors for matching during face recognition"""
    user = get_user_by_email(email)
    relations = user.get("relations", [])
    
    descriptors = []
    for rel in relations:
        if rel.get("isRegistered") and rel.get("faceDescriptor"):
            descriptors.append({
                "id": rel["id"],
                "name": rel["name"],
                "relationship": rel.get("relationship", "Unknown"),
                "photo": rel.get("photo"),
                "faceDescriptor": rel["faceDescriptor"],
                "lastSummary": rel.get("lastSummary", "First time meeting"),
                "count": rel.get("count", {"value": 0})
            })
    
    # Also return unregistered relations for the UI to show "register face" option
    unregistered = []
    for rel in relations:
        if not rel.get("isRegistered"):
            unregistered.append({
                "id": rel["id"],
                "name": rel["name"],
                "relationship": rel.get("relationship", "Unknown"),
                "photo": rel.get("photo")
            })
    
    return {"descriptors": descriptors, "unregistered": unregistered}


@app.post("/conversation/add")
async def add_conversation(request: Request):
    """Add a conversation session with transcript and AI-generated summary"""
    data = await request.json()
    email = data.get("email")
    relation_id = data.get("relation_id")
    transcript = data.get("transcript", "")
    summary = data.get("summary", "")
    
    if not transcript and not summary:
        raise HTTPException(status_code=400, detail="Transcript or summary required")
    
    conversation = {
        "id": str(datetime.datetime.now().timestamp()),
        "timestamp": datetime.datetime.now().isoformat(),
        "transcript": transcript,
        "summary": summary
    }
    
    user = get_user_by_email(email)
    relations = user.get("relations", [])
    
    relation_found = False
    for relation in relations:
        if relation["id"] == relation_id:
            conversations = relation.get("conversations", [])
            conversations.append(conversation)
            relation["conversations"] = conversations
            relation["lastSummary"] = summary  # Quick access field for display
            
            # Update interaction count
            count = relation.get("count", {"value": 0})
            count["value"] = count.get("value", 0) + 1
            count["last"] = datetime.datetime.now().isoformat()
            if "first" not in count:
                count["first"] = datetime.datetime.now().isoformat()
            relation["count"] = count
            
            relation_found = True
            break
    
    if not relation_found:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    try:
        mongoDB.users.update_one(
            {"email": email}, 
            {"$set": {"relations": relations}}
        )
        return {"message": "Conversation added", "summary": summary, "conversation_id": conversation["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversation/latest")
def get_latest_conversation(email: str, relation_id: str):
    """Get the latest conversation summary for a specific relation"""
    user = get_user_by_email(email)
    relations = user.get("relations", [])
    
    for relation in relations:
        if relation["id"] == relation_id:
            conversations = relation.get("conversations", [])
            if conversations:
                latest = conversations[-1]
                return {
                    "summary": latest.get("summary", ""),
                    "timestamp": latest.get("timestamp", ""),
                    "isFirstMeeting": False
                }
            else:
                return {
                    "summary": "First time meeting",
                    "timestamp": None,
                    "isFirstMeeting": True
                }
    
    raise HTTPException(status_code=404, detail="Relation not found")


@app.get("/conversations/all")
def get_all_conversations(email: str, relation_id: str = None):
    """Get all conversations, optionally filtered by relation"""
    user = get_user_by_email(email)
    relations = user.get("relations", [])
    
    all_conversations = []
    for relation in relations:
        if relation_id and relation["id"] != relation_id:
            continue
        
        conversations = relation.get("conversations", [])
        for conv in conversations:
            all_conversations.append({
                "relation_id": relation["id"],
                "relation_name": relation["name"],
                "relationship": relation.get("relationship", "Unknown"),
                **conv
            })
    
    # Sort by timestamp descending
    all_conversations.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"conversations": all_conversations}


@app.delete("/relation/delete")
async def delete_relation(request: Request):
    """Delete a relation by ID"""
    data = await request.json()
    email = data.get("email")
    relation_id = data.get("relation_id")
    
    if not relation_id:
        raise HTTPException(status_code=400, detail="relation_id required")
    
    user = get_user_by_email(email)
    original_count = len(user.get("relations", []))
    relations = [r for r in user.get("relations", []) if r["id"] != relation_id]
    
    if len(relations) == original_count:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    try:
        mongoDB.users.update_one(
            {"email": email}, 
            {"$set": {"relations": relations}}
        )
        return {"message": "Relation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/reminder/delete")
async def delete_reminder(request: Request):
    """Delete a reminder by ID"""
    data = await request.json()
    email = data.get("email")
    reminder_id = data.get("reminder_id")
    
    if reminder_id is None:
        raise HTTPException(status_code=400, detail="reminder_id required")
    
    user = get_user_by_email(email)
    original_count = len(user.get("reminders", []))
    reminders = [r for r in user.get("reminders", []) if r["id"] != reminder_id]
    
    if len(reminders) == original_count:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    try:
        mongoDB.users.update_one(
            {"email": email}, 
            {"$set": {"reminders": reminders}}
        )
        return {"message": "Reminder deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/relation/update")
async def update_relation(request: Request):
    """Update a relation's details (name, relationship, photo)"""
    data = await request.json()
    email = data.get("email")
    relation_id = data.get("relation_id")
    updates = data.get("updates", {})
    
    if not relation_id:
        raise HTTPException(status_code=400, detail="relation_id required")
    
    user = get_user_by_email(email)
    relations = user.get("relations", [])
    
    relation_found = False
    for relation in relations:
        if relation["id"] == relation_id:
            # Only update allowed fields
            if "name" in updates:
                relation["name"] = updates["name"]
            if "relationship" in updates:
                relation["relationship"] = updates["relationship"]
            if "photo" in updates:
                relation["photo"] = updates["photo"]
            relation_found = True
            break
    
    if not relation_found:
        raise HTTPException(status_code=404, detail="Relation not found")
    
    try:
        mongoDB.users.update_one(
            {"email": email}, 
            {"$set": {"relations": relations}}
        )
        return {"message": "Relation updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)