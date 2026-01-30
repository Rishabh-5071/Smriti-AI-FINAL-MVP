from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv

load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL")

print("Testing Unsafe Connection...")
try:
    client = MongoClient(MONGODB_URL, tls=True, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("SUCCESS: Unsafe connection worked!")
except Exception as e:
    print(f"FAILURE: Unsafe connection failed: {e}")
