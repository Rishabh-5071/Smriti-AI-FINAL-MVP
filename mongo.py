from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

mongoClient = MongoClient(MONGODB_URL, tlsCAFile=certifi.where())
mongoDB = mongoClient["recall"]


"""
users = [
    {
        "name": "John Doe",
        "email": "johndoe@example.com",
        "relations": [
            {
                "id": <consecutive_numerals>,
                "name": "Jane Doe",
                "relationship": "mother",
                "picture": "https://example.com/jane.jpg",
                "messages": [
                    { ... },
                    { ... },
                ],
                count: {
                    value: number,
                    first: datetime,
                    last: datetime,
                }
            }
        ],
        reminders: [
            {
                "id": <consecutive_numerals>,
                "title": "Buy milk",
                "description": "Buy milk for the baby",
                "due_date": "2022-01-01",
            }
        ],
        broadcastList: ["the@gmail.com", "coding@gmail.com"],
        "reminders": [
            {
                "id": <consecutive_numerals>,
                time: "",
                message: ""
            }
        ]
    }
]
"""
