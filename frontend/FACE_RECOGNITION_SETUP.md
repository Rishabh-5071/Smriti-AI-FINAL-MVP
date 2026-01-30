# Face Recognition Setup Guide

## Quick Setup for Hackathon Demo

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Download Face-API.js Models

The face recognition feature requires pre-trained models. Download them using one of these methods:

#### Option A: Manual Download (Recommended for Demo)

1. Go to: https://github.com/justadudewhohacks/face-api.js-models
2. Download the repository as ZIP
3. Extract and copy these files to `frontend/public/models/`:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`

#### Option B: Using Git (If you have git installed)

```bash
cd frontend/public
git clone https://github.com/justadudewhohacks/face-api.js-models.git models
```

#### Option C: Quick Script (PowerShell)

```powershell
cd frontend/public
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js-models/archive/refs/heads/master.zip" -OutFile "models.zip"
Expand-Archive -Path "models.zip" -DestinationPath "."
Move-Item -Path "face-api.js-models-master\*" -Destination "models\" -Force
Remove-Item "models.zip", "face-api.js-models-master" -Recurse
```

### 3. Start the Application

```bash
npm run dev
```

### 4. Test the Feature

1. Navigate to "Face Recognition" in the sidebar
2. Click "Start Camera"
3. Allow camera permissions
4. The system will detect faces and show:
   - **Green boxes** = Known faces (from your relations)
   - **Orange boxes** = Unknown faces (click to add)

## Features

- ✅ Real-time face detection
- ✅ Transparent overlay that follows faces
- ✅ Automatic relation matching
- ✅ Click to add new relations
- ✅ Smooth face tracking

## Troubleshooting

**Models not loading?**
- Make sure models are in `frontend/public/models/`
- Check browser console for errors
- Models should be accessible at `/models/` URL

**Camera not working?**
- Check browser permissions
- Try a different browser (Chrome/Edge recommended)
- Make sure no other app is using the camera

**Faces not detected?**
- Ensure good lighting
- Face the camera directly
- Remove glasses/masks if possible

## For Production

In production, you would:
1. Store face descriptors in the database
2. Compare new faces with stored descriptors
3. Upload face images to a proper image hosting service
4. Implement proper face matching algorithm

For the hackathon demo, the current implementation uses position-based tracking which works well for demonstrations!

