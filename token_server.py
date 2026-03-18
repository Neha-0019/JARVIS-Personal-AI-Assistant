import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from livekit.api import AccessToken, VideoGrants

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/token")
def get_token(identity: str = "user"):
    api_key = os.environ.get("LIVEKIT_API_KEY")
    api_secret = os.environ.get("LIVEKIT_API_SECRET")
    livekit_url = os.environ.get("LIVEKIT_URL")
    
    if not api_key or not api_secret or not livekit_url:
        return {"error": "Missing LIVEKIT_API_KEY, LIVEKIT_API_SECRET, or LIVEKIT_URL in .env"}
        
    room_name = f"jarvis-room-{int(time.time())}"
    
    token = AccessToken(api_key, api_secret) \
        .with_identity(identity) \
        .with_name("User") \
        .with_grants(VideoGrants(room_join=True, room=room_name))
        
    return {
        "token": token.to_jwt(),
        "url": livekit_url
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
