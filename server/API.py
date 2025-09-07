from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI is running on port 5000!"}

@app.get("/status")
def get_status():
    return {"status": "OK", "port": 5000}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
