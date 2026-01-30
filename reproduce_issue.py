from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv
import ssl

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

print(f"Testing connection to MongoDB...")
# print(f"URL: {MONGODB_URL}") # Don't print secrets in logs if possible

try:
    # Try with certifi first (current code)
    print("Attempt 1: Using certifi")
    client = MongoClient(MONGODB_URL, tlsCAFile=certifi.where())
    client.admin.command('ping')
    print("SUCCESS: Connection with certifi worked!")
except Exception as e:
    print(f"FAILURE: Connection with certifi failed: {e}")

try:
    # Try with explicit tls=True and certifi
    print("\nAttempt 2: Explicit tls=True and certifi")
    client = MongoClient(MONGODB_URL, tls=True, tlsCAFile=certifi.where())
    client.admin.command('ping')
    print("SUCCESS: Connection with explicit tls=True worked!")
except Exception as e:
    print(f"FAILURE: Connection with explicit tls=True failed: {e}")

try:
    # Try ignoring SSL certs (unsafe, for testing only)
    print("\nAttempt 3: Verify=CERT_NONE (Unsafe)")
    client = MongoClient(MONGODB_URL, tls=True, tlsAllowInvalidCertificates=True)
    client.admin.command('ping')
    print("SUCCESS: Connection with tlsAllowInvalidCertificates=True worked!")
except Exception as e:
    print(f"FAILURE: Connection with tlsAllowInvalidCertificates=True failed: {e}")
