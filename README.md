# Emotion Detection Models

This directory contains the machine learning models for face emotion detection.

## Directory Structure

```
models/
├── emotion_model/          # Main emotion detection model
│   ├── model.json         # Model architecture (if using TensorFlow.js)
│   └── weights.bin        # Model weights
├── face_detection/         # Optional: Face detection model
│   ├── model.json
│   └── weights.bin
├── emotionModel.js         # Main model loader utility
└── modelConfig.json        # Model configuration
```

## Setup Instructions

1. **Obtain the pre-trained model**
   - Download emotion detection model from:
     - TensorFlow.js Hub: https://github.com/tensorflow/tfjs-models
     - Or your custom trained model

2. **Place model files**
   - Extract model files into respective subdirectories
   - Ensure `model.json` and weight files are in the correct location

3. **Update Model Loader**
   - Modify `emotionModel.js` based on your framework:
     - TensorFlow.js
     - ONNX Runtime
     - PyTorch (via ONNX)

4. **Load in your application**
   ```javascript
   // In script.js
   const emotionModel = new EmotionModel();
   await emotionModel.loadModel('./models/emotion_model/model.json');
   ```

## Supported Emotions

- Happy
- Sad
- Angry
- Surprised
- Neutral
- Disgusted
- Fearful

## Model Requirements

- Input: Face image (typically 48x48 or 224x224 depending on model)
- Output: Emotion probabilities for each emotion class

## Framework Options

### TensorFlow.js
- Best for browser-based deployment
- Good performance on modern devices
- Edit: Update line 11 in emotionModel.js

### ONNX Runtime
- Cross-platform compatibility
- Optimized inference
- Install: `npm install onnxruntime-web`

## Troubleshooting

- Model not loading? Check file paths and CORS settings
- High memory usage? Consider model quantization
- Slow inference? Use GPU acceleration if available

For more information, see the main README.md in the project root.
