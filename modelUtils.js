// Model utilities for preprocessing and post-processing

class ModelUtils {
  // Preprocess image for model input
  static preprocessImage(imageData, targetSize = 48) {
    try {
      // Convert to grayscale if needed
      // Resize to target size
      // Normalize pixel values to [-1, 1] or [0, 1]
      
      console.log(`Preprocessing image to ${targetSize}x${targetSize}`);
      
      // Return preprocessed tensor/array
      return imageData;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      throw error;
    }
  }

  // Post-process model output
  static postprocessPredictions(predictions, emotions) {
    try {
      if (!Array.isArray(predictions)) {
        console.error('Invalid predictions format');
        return null;
      }

      const results = {};
      emotions.forEach((emotion, index) => {
        results[emotion] = parseFloat((predictions[index] * 100).toFixed(2));
      });

      // Sort by confidence
      const sorted = Object.entries(results)
        .sort((a, b) => b[1] - a[1])
        .reduce((obj, [key, val]) => {
          obj[key] = val;
          return obj;
        }, {});

      return sorted;
    } catch (error) {
      console.error('Post-processing failed:', error);
      throw error;
    }
  }

  // Get dominant emotion
  static getDominantEmotion(predictions) {
    const entries = Object.entries(predictions);
    if (entries.length === 0) return null;
    
    return entries.reduce((prev, current) => 
      current[1] > prev[1] ? current : prev
    )[0];
  }

  // Validate image input
  static validateImageInput(image) {
    if (!image) {
      console.error('Image input is null or undefined');
      return false;
    }

    if (image.width <= 0 || image.height <= 0) {
      console.error('Invalid image dimensions');
      return false;
    }

    return true;
  }

  // Normalize pixel values
  static normalizePixels(pixels, minValue = -1, maxValue = 1) {
    return pixels.map(value => {
      // Assuming 0-255 range input
      const normalized = (value / 255.0) * 2 - 1; // Convert to [-1, 1]
      return Math.max(minValue, Math.min(maxValue, normalized));
    });
  }

  // Load configuration
  static async loadModelConfig(configPath = './models/modelConfig.json') {
    try {
      const response = await fetch(configPath);
      return await response.json();
    } catch (error) {
      console.error('Failed to load model configuration:', error);
      throw error;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModelUtils;
}
