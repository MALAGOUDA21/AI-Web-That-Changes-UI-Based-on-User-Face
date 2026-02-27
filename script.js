// Video elements - initialized when app starts
let video = null;
let detectionResult = null;
let faceStatus = null;
let ageText = null;
let genderText = null;
let emotionText = null;

let allModelsLoaded = false;
let lastDetectionData = null;
let outputLocked = false; // Lock output to prevent changes
let activeEmotionClass = "";
let activeAgeClass = "";

// Initialize DOM element references
function initializeDOMElements() {
  video = document.getElementById("video");
  detectionResult = document.getElementById("detection-result");
  faceStatus = document.getElementById("face-status");
  ageText = document.getElementById("age");
  genderText = document.getElementById("gender");
  emotionText = document.getElementById("emotion");
  
  if (!video) {
    console.error("âŒ Video element not found!");
    return false;
  }
  
  console.log("âœ“ DOM elements initialized successfully");
  return true;
}

console.log("=== APP SCRIPT LOADED ===");

// ==========================================
// AGE PREDICTION STABILIZATION
// ==========================================
let ageReadings = []; // Store recent age readings
let lastStableAge = null; // Keep previous stable age
const MAX_AGE_READINGS = 7; // Average of last 7 readings
const AGE_JUMP_LIMIT = 8; // Max allowed jump in age (in years)
const AGE_MIN = 1; // Minimum realistic age
const AGE_MAX = 100; // Maximum realistic age

function getStableAge(rawAge) {
  // Clamp to realistic range
  const clampedAge = Math.max(AGE_MIN, Math.min(AGE_MAX, rawAge));
  
  // Check if this reading is too different from previous readings (outlier)
  if (lastStableAge !== null) {
    const ageDifference = Math.abs(clampedAge - lastStableAge);
    if (ageDifference > AGE_JUMP_LIMIT) {
      console.warn(`âš ï¸ Age jump detected: ${lastStableAge}â†’${clampedAge} (diff: ${ageDifference}), ignoring outlier`);
      return lastStableAge; // Ignore this outlier, return previous age
    }
  }
  
  // Add to readings
  ageReadings.push(clampedAge);
  
  // Keep only last N readings
  if (ageReadings.length > MAX_AGE_READINGS) {
    ageReadings.shift();
  }
  
  // Calculate average
  const averageAge = ageReadings.reduce((a, b) => a + b, 0) / ageReadings.length;
  const stableAge = Math.round(averageAge);
  
  lastStableAge = stableAge;
  
  if (ageReadings.length > 2) {
    console.log(`ðŸ“Š Age Stabilization: Raw=${rawAge.toFixed(1)} â†’ Stable=${stableAge} (avg of ${ageReadings.length} readings)`);
  }
  
  return stableAge;
}

// ==========================================
// GENDER PREDICTION STABILIZATION
// ==========================================
let genderReadings = []; // Store recent gender readings with confidence
let lastStableGender = null;
let lastStableGenderProb = 0;
const MAX_GENDER_READINGS = 5; // Average of last 5 readings
const GENDER_CONFIDENCE_THRESHOLD = 60; // Min confidence to register

function getStableGender(rawGender, confidence) {
  const confPercent = confidence * 100;
  
  // Only consider high confidence readings
  if (confPercent < GENDER_CONFIDENCE_THRESHOLD) {
    if (lastStableGender) {
      return { gender: lastStableGender, confidence: lastStableGenderProb };
    }
    return { gender: rawGender, confidence: confPercent };
  }
  
  genderReadings.push({ gender: rawGender, conf: confPercent });
  
  if (genderReadings.length > MAX_GENDER_READINGS) {
    genderReadings.shift();
  }
  
  // Find most common gender in recent readings
  const genderCounts = {};
  const confidenceSum = {};
  
  genderReadings.forEach(reading => {
    if (!genderCounts[reading.gender]) {
      genderCounts[reading.gender] = 0;
      confidenceSum[reading.gender] = 0;
    }
    genderCounts[reading.gender]++;
    confidenceSum[reading.gender] += reading.conf;
  });
  
  const mostCommonGender = Object.keys(genderCounts).reduce((a, b) => 
    genderCounts[a] > genderCounts[b] ? a : b
  );
  
  const avgConfidence = confidenceSum[mostCommonGender] / genderCounts[mostCommonGender];
  
  lastStableGender = mostCommonGender;
  lastStableGenderProb = avgConfidence;
  
  if (genderReadings.length > 1) {
    console.log(`ðŸ‘¥ Gender Stabilization: ${mostCommonGender} (${avgConfidence.toFixed(1)}% avg from ${genderReadings.length} readings)`);
  }
  
  return { gender: mostCommonGender, confidence: avgConfidence };
}

// ==========================================
// EMOTION PREDICTION STABILIZATION
// ==========================================
let emotionReadings = []; // Store recent emotion readings
let lastStableEmotion = null;
const MAX_EMOTION_READINGS = 5; // Average of last 5 readings

function getStableEmotion(rawEmotions) {
  // Find top emotion
  const emotionArray = Object.entries(rawEmotions)
    .sort((a, b) => b[1] - a[1]);
  const topEmotion = emotionArray[0][0];
  const confidence = emotionArray[0][1] * 100;
  
  emotionReadings.push({ emotion: topEmotion, conf: confidence });
  
  if (emotionReadings.length > MAX_EMOTION_READINGS) {
    emotionReadings.shift();
  }
  
  // Find most common emotion
  const emotionCounts = {};
  const confidenceSum = {};
  
  emotionReadings.forEach(reading => {
    if (!emotionCounts[reading.emotion]) {
      emotionCounts[reading.emotion] = 0;
      confidenceSum[reading.emotion] = 0;
    }
    emotionCounts[reading.emotion]++;
    confidenceSum[reading.emotion] += reading.conf;
  });
  
  const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
    emotionCounts[a] > emotionCounts[b] ? a : b
  );
  
  const avgConfidence = confidenceSum[mostCommonEmotion] / emotionCounts[mostCommonEmotion];
  
  lastStableEmotion = mostCommonEmotion;
  
  if (emotionReadings.length > 1) {
    console.log(`ðŸ˜Š Emotion Stabilization: ${mostCommonEmotion} (${avgConfidence.toFixed(1)}% avg from ${emotionReadings.length} readings)`);
  }
  
  return { emotion: mostCommonEmotion, confidence: avgConfidence };
}

// ==========================================
// DETECTION HISTORY & EXPORT
// ==========================================
let detectionHistory = []; // Store all detections
const MAX_HISTORY_RECORDS = 50;

function addToHistory(data) {
  detectionHistory.push({
    timestamp: new Date().toLocaleString(),
    age: data.age,
    gender: data.gender,
    emotion: data.emotionName,
    ageGroup: data.ageGroup,
    genderConfidence: data.genderProb,
    emotionConfidence: data.emotionProb
  });
  
  if (detectionHistory.length > MAX_HISTORY_RECORDS) {
    detectionHistory.shift();
  }

  const historyModal = document.getElementById("history-modal");
  if (historyModal && historyModal.style.display === "flex") {
    renderHistoryModal();
  }

}

// Export detection history as JSON
window.exportDetectionsJSON = function() {
  const dataStr = JSON.stringify(detectionHistory, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `face_detections_${new Date().getTime()}.json`;
  link.click();
  console.log("âœ“ Detections exported as JSON");
};

// Export detection history as CSV
window.exportDetectionsCSV = function() {
  if (detectionHistory.length === 0) {
    console.log("âŒ No detections to export");
    return;
  }
  
  const headers = Object.keys(detectionHistory[0]);
  const csvContent = [
    headers.join(','),
    ...detectionHistory.map(record => 
      headers.map(h => `"${record[h]}"`).join(',')
    )
  ].join('\n');
  
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `face_detections_${new Date().getTime()}.csv`;
  link.click();
  console.log("âœ“ Detections exported as CSV");
};

// ==========================================
// SCREENSHOT FUNCTIONALITY (ENHANCED)
// ==========================================
window.takeScreenshot = function() {
  if (!video || !video.srcObject) {
    console.log("âŒ Video not available");
    alert("Camera not available for screenshot");
    return;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Add timestamp and detection info to the image
    const timestamp = new Date().toLocaleString();
    const detectionText = lastDetectionData ? 
      `Age: ${lastDetectionData.age} | Gender: ${lastDetectionData.gender} | Emotion: ${lastDetectionData.emotionName}` : 
      "No detection";
    
    // Add text overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`Captured: ${timestamp}`, 10, canvas.height - 30);
    ctx.fillText(detectionText, 10, canvas.height - 10);
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `face_capture_${new Date().getTime()}.png`;
    link.click();
    
    console.log("âœ… Screenshot saved with detection info!");
    
    // Show visual feedback
    showNotification("Screenshot captured");
    
  } catch (error) {
    console.error("âŒ Screenshot error:", error);
    alert("Error capturing screenshot");
  }
};

// Show notification popup
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function renderHistoryModal() {
  const listElement = document.getElementById("history-list");
  const summaryElement = document.getElementById("history-summary");

  if (!listElement || !summaryElement) {
    return;
  }

  summaryElement.innerText = `Total records: ${detectionHistory.length}`;

  if (detectionHistory.length === 0) {
    listElement.innerHTML = '<p class="history-empty">No detections captured yet.</p>';
    return;
  }

  const rows = detectionHistory
    .slice()
    .reverse()
    .map(
      (record, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${record.timestamp}</td>
        <td>${record.age}</td>
        <td>${record.ageGroup}</td>
        <td>${record.gender}</td>
        <td>${record.emotion}</td>
        <td>${record.genderConfidence}%</td>
        <td>${record.emotionConfidence}%</td>
      </tr>`
    )
    .join("");

  listElement.innerHTML = `
    <table class="history-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Time</th>
          <th>Age</th>
          <th>Group</th>
          <th>Gender</th>
          <th>Emotion</th>
          <th>Gender Conf</th>
          <th>Emotion Conf</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

window.closeHistoryModal = function() {
  const modal = document.getElementById("history-modal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.addEventListener("click", (event) => {
  if (event.target && event.target.id === "history-modal") {
    window.closeHistoryModal();
  }
});

// Get detection history
window.getDetectionHistory = function() {
  const modal = document.getElementById("history-modal");
  if (!modal) {
    console.log(`Total Detections: ${detectionHistory.length}`);
    console.log(detectionHistory);
    return detectionHistory;
  }

  renderHistoryModal();
  modal.style.display = "flex";
  return detectionHistory;
};

// Clear detection history
window.clearDetectionHistory = function() {
  detectionHistory = [];
  ageReadings = [];
  genderReadings = [];
  emotionReadings = [];
  renderHistoryModal();
  showNotification("History cleared");
  console.log("All history cleared");
};

// Load models from CDN (not local ./models folder)
async function loadModels() {
  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    
    console.log("Loading TinyFaceDetector model...");
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    console.log("âœ“ TinyFaceDetector loaded");
    
    console.log("Loading FaceExpressionNet model...");
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    console.log("âœ“ FaceExpressionNet loaded");
    
    console.log("Loading AgeGenderNet model...");
    await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
    console.log("âœ“ AgeGenderNet loaded");
    
    console.log("âœ“âœ“âœ“ ALL MODELS LOADED SUCCESSFULLY âœ“âœ“âœ“");
    allModelsLoaded = true;
    updateStatus("Models ready - requesting camera", "#2196F3");
    requestCamera();
    
  } catch (error) {
    console.error("âŒ Model loading FAILED:", error);
    updateStatus("Model error: " + error.message, "#FF5252");
  }
}

// Request camera with simple constraints
function requestCamera() {
  console.log("Step 2: Requesting camera access...");
  
  // Make sure video element exists
  if (!video) {
    console.error("âŒ Video element not available");
    if (faceStatus) {
      updateStatus("Video element not found", "#FF5252");
    }
    return;
  }
  
  console.log("âœ“ Video element found");
  
  // Use very simple constraints - just video, let browser choose best settings
  const constraints = {
    video: true,
    audio: false
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      console.log("âœ“âœ“ CAMERA ACCESS GRANTED âœ“âœ“");
      console.log("Stream active:", stream.active);
      console.log("Video tracks:", stream.getVideoTracks().length);
      
      // Attach stream to video element
      video.srcObject = stream;
      
      // Set up handlers
      video.onloadedmetadata = () => {
        console.log("âœ“ Video metadata loaded");
        console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
        
        // Try to play
        video.play()
          .then(() => {
            console.log("âœ“ Video playing started");
            updateStatus("Camera open - detecting face", "#4CAF50");
            startDetection();
          })
          .catch(err => {
            console.error("âŒ Play failed:", err);
            updateStatus("Video play failed", "#FF5252");
          });
      };

    })
    .catch(err => {
      console.error("âŒ CAMERA DENIED - Name:", err.name);
      console.error("âŒ CAMERA DENIED - Message:", err.message);

      let errorMsg = "Camera Error";
      if (err.name === "NotAllowedError") {
        errorMsg = "Permission denied - allow camera in browser settings";
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera found - check hardware connection";
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera in use - close Zoom/Teams/Skype";
      } else if (err.name === "OverconstrainedError") {
        errorMsg = "Camera cannot meet video requirements";
      }
      
      updateStatus(errorMsg, "#FF5252");
    });
}

// Start face detection loop
function startDetection() {
  console.log("Step 3: Starting face detection...");
  let detectionCount = 0;
  let consecutiveDetections = 0;
  const CONFIDENCE_THRESHOLD = 2; // Need 2 consecutive detections to show

  const detectionInterval = setInterval(async () => {
    if (!allModelsLoaded || !video.srcObject) {
      return;
    }

    try {
      if (video.paused || video.ended) {
        video.play().catch(e => {
          console.error("Auto-play failed:", e);
        });
        return;
      }

      // DETECT FACE WITH ALL ATTRIBUTES
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
        .withAgeAndGender();

      detectionCount++;
      
      if (detections) {
        consecutiveDetections++;
        
        // Only update display after 2 consecutive detections (for stability)
        if (consecutiveDetections >= CONFIDENCE_THRESHOLD) {
          if (consecutiveDetections === CONFIDENCE_THRESHOLD) {
            console.log(`âœ“âœ“ CONFIRMED FACE DETECTED!`);
            console.log(`ðŸ”’ OUTPUT LOCKED on screen`);
          }

          updateStatus("Face detected (output locked)", "#4CAF50");
          if (detectionResult) {
            detectionResult.style.display = "block";
          }

          // Extract data - EXACT VALUES (NOT ROUNDED)
          const ageExact = detections.age; // Raw age value with decimals
          const ageRounded = getStableAge(detections.age); // Use stable age averaging!
          applyAgeUIMode(ageRounded);
          
          // Get STABLE gender with smoothing
          const rawGender = detections.gender; // "male" or "female"
          const stableGenderData = getStableGender(rawGender, detections.genderProbability);
          const gender = stableGenderData.gender.charAt(0).toUpperCase() + stableGenderData.gender.slice(1);
          const genderProb = parseFloat(stableGenderData.confidence.toFixed(2));
          const genderProbExact = genderProb;
          
          // Add gender confidence indicator
          let genderDisplay = gender;
          if (genderProb < 60) {
            genderDisplay = gender + ` (${genderProb.toFixed(2)}% - Low Confidence)`;
          } else if (genderProb >= 80) {
            genderDisplay = gender + ` (${genderProb.toFixed(2)}% - High Confidence)`;
          } else {
            genderDisplay = gender + ` (${genderProb.toFixed(2)}%)`;
          }

          // Get age group
          const ageGroup = getAgeGroup(ageRounded);
          const ageGroupColor = getAgeGroupColor(ageRounded);

          // Get STABLE emotions with smoothing
          const emotions = detections.expressions;
          const stableEmotionData = getStableEmotion(emotions);
          const emotionName = stableEmotionData.emotion
            .charAt(0).toUpperCase() + stableEmotionData.emotion.slice(1);
          const emotionProb = stableEmotionData.confidence.toFixed(1);

          // Store data
          lastDetectionData = {
            age: ageRounded,
            ageExact: ageExact.toFixed(2),
            gender: genderDisplay,
            genderProb,
            genderProbExact: genderProbExact.toFixed(2),
            ageGroup,
            ageGroupColor,
            emotionName,
            emotionProb,
            allEmotions: emotions
          };

          // Keep UI reactive to emotion even when output values are locked.
          applyEmotionTheme(emotionName);

          // Log exact raw values to console
          console.log("=== EXACT DETECTED VALUES ===");
          console.log(`ðŸ‘¤ Age (Exact): ${ageExact.toFixed(4)} years`);
          console.log(`ðŸ‘¤ Age (Rounded): ${ageRounded} years`);
          console.log(`âš§ Gender: ${gender}`);
          console.log(`âš§ Gender Confidence (Exact): ${genderProbExact.toFixed(4)}%`);
          console.log(`ðŸ˜„ Emotion: ${emotionName}`);
          console.log(`ðŸ˜„ Emotion Confidence: ${emotionProb}%`);
          console.log("=============================");

          // Update display ONLY once when first detected (then lock)
          if (!outputLocked) {
            updateDisplayOnce(lastDetectionData);
            addToHistory(lastDetectionData); // Save to history for export
            outputLocked = true; // LOCK OUTPUT NOW
            updateLockStatus(true);
            console.log("ðŸ“Œ Output is now LOCKED - will not change");
            console.log(`ðŸ“Š Detection saved to history (${detectionHistory.length} total)`);
          }
        }

      } else {
        // No face detected
        consecutiveDetections = 0;
        
        // Reset all readings for next face
        ageReadings = [];
        genderReadings = [];
        emotionReadings = [];
        lastStableAge = null;
        lastStableGender = null;
        lastStableEmotion = null;
        
        // UNLOCK output when face is lost
        if (outputLocked) {
          outputLocked = false;
          updateLockStatus(false);
          console.log("ðŸ”“ Face lost - Output UNLOCKED for next detection");
        }
        
        updateStatus("No face - move closer or show your face", "#FF9800");
        if (detectionResult) {
          detectionResult.style.display = "none";
        }
        applyAgeUIMode(null);
        applyEmotionTheme("");
        lastDetectionData = null;
      }

    } catch (error) {
      console.error("âŒ Detection error:", error.message);
      updateStatus("Detection error", "#FF5252");
    }
  }, 500); // Check every 500ms instead of 100ms (less updates)

  // Store interval ID for potential pause/resume
  window.detectionIntervalId = detectionInterval;
}

// Update display only when data actually changes
let lastDisplayedData = null;

function updateDisplayOnce(data) {
  // Only update if data is different from last display
  if (lastDisplayedData && 
      lastDisplayedData.age === data.age &&
      lastDisplayedData.emotionName === data.emotionName &&
      lastDisplayedData.genderProb === data.genderProb) {
    return; // No change, don't update
  }

  lastDisplayedData = data;

  // Display age with exact value shown
  if (ageText) {
    ageText.innerText = `Age: ${data.age} years (Exact: ${data.ageExact} years)`;
  }
  
  const groupElement = document.getElementById('age-group');
  if (groupElement) {
    groupElement.innerText = `Group: ${data.ageGroup}`;
    groupElement.style.color = data.ageGroupColor;
  }
  
  // Update gender with EXACT confidence percentage
  if (genderText) {
    genderText.innerText = `Gender: ${data.gender}`;
    
    // Apply confidence styling to gender
    genderText.className = 'value';
    if (data.genderProb < 60) {
      genderText.classList.add('gender-low-confidence');
    } else if (data.genderProb < 80) {
      genderText.classList.add('gender-medium-confidence');
    } else {
      genderText.classList.add('gender-high-confidence');
    }
  }
  
  if (emotionText) {
    emotionText.innerText = `Emotion: ${data.emotionName} (${data.emotionProb}%)`;
  }
  applyEmotionTheme(data.emotionName);

  // Update exact output box with all exact values
  const exactOutputElement = document.getElementById('exact-output');
  if (exactOutputElement) {
    exactOutputElement.innerText = 
      `Age (Exact): ${data.ageExact} years\n` +
      `Age (Rounded): ${data.age} years\n` +
      `Group: ${data.ageGroup}\n` +
      `Gender: ${data.gender}\n` +
      `Gender Confidence: ${data.genderProbExact}%\n` +
      `Emotion: ${data.emotionName} (${data.emotionProb}% confidence)`;
  }

  // Log exactly once per face
  let genderConfidenceIndicator = "âŒ LOW";
  if (data.genderProb >= 80) {
    genderConfidenceIndicator = "âœ“ HIGH";
  } else if (data.genderProb >= 60) {
    genderConfidenceIndicator = "âš ï¸ MEDIUM";
  }

  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log(`ðŸ“Š EXACT DETECTION OUTPUT:`);
  console.log(`   ðŸ‘¤ Age: ${data.age} years`);
  console.log(`   ðŸ‘¥ Group: ${data.ageGroup}`);
  console.log(`   âš§ Gender: ${data.gender} (${data.genderProb}% confidence) ${genderConfidenceIndicator}`);
  console.log(`   ðŸ˜„ Emotion: ${data.emotionName} (${data.emotionProb}% confidence)`);
  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
}

function updateStatus(message, color) {
  if (faceStatus) {
    faceStatus.innerText = message;
    faceStatus.style.color = color;
  }
  console.log("Status:", message);
}

function applyEmotionTheme(emotionName) {
  const normalizedEmotion = (emotionName || "").toLowerCase();
  const emotionClass = `emotion-${normalizedEmotion}`;
  const body = document.body;

  if (activeEmotionClass) {
    body.classList.remove(activeEmotionClass);
  }

  if (normalizedEmotion) {
    body.classList.add("detected");
    body.classList.add(emotionClass);
    activeEmotionClass = emotionClass;
  } else {
    body.classList.remove("detected");
    activeEmotionClass = "";
  }
}

function applyAgeUIMode(age) {
  const body = document.body;
  const nextAgeClass =
    age === null ? "" : age < 13 ? "ui-child" : age < 60 ? "ui-adult" : "ui-senior";

  if (activeAgeClass) {
    body.classList.remove(activeAgeClass);
  }

  if (nextAgeClass) {
    body.classList.add(nextAgeClass);
  }

  activeAgeClass = nextAgeClass;
}

// Update lock status indicator
function updateLockStatus(isLocked) {
  const lockElement = document.getElementById('lock-status');
  if (lockElement) {
    if (isLocked) {
      lockElement.innerText = "🔒 Output LOCKED";
      lockElement.style.color = "#4CAF50";
    } else {
      lockElement.innerText = "🔓 Output Unlocked - Ready for Detection";
      lockElement.style.color = "#FF9800";
    }
  }
}

// Get age group based on age
function getAgeGroup(age) {
  if (age < 13) {
    return "Child";
  } else if (age < 60) {
    return "Adult";
  } else {
    return "Old Age";
  }
}

// Get age group color
function getAgeGroupColor(age) {
  if (age < 13) {
    return "#FF6B6B"; // Red for child
  } else if (age < 60) {
    return "#4ECDC4"; // Teal for adult
  } else {
    return "#FFE66D"; // Yellow for oldage
  }
}

// Initialize on page load
window.addEventListener("load", () => {
  console.log("=== PAGE LOADED ===");
  console.log("Initializing app...");
  initializeApp();
});

// Function to initialize app
window.initializeApp = function() {
  console.log("=== INITIALIZING APP ===");
  
  // First, initialize DOM elements (they're now visible)
  if (!initializeDOMElements()) {
    console.error("âŒ Failed to initialize DOM elements");
    return;
  }

  // Check if Face-API is available
  if (typeof faceapi === 'undefined') {
    console.error("âŒ Face-API library not loaded!");
    if (faceStatus) {
      updateStatus("Face-API library failed to load", "#FF5252");
    }
    return;
  }
  
  console.log("âœ“ Face-API library loaded");
  console.log("Step 1: Loading Face-API models from CDN...");
  
  // Wait a moment then load models
  setTimeout(() => {
    loadModels();
  }, 800);
};
;

// Helper functions for debugging
window.testCamera = () => {
  console.log("=== CAMERA DEBUG ===");
  console.log("Video element:", !!video);
  console.log("Has stream:", !!video.srcObject);
  console.log("Is playing:", !video.paused);
  console.log("Dimensions:", video.videoWidth, "x", video.videoHeight);
  console.log("Ready state:", video.readyState, "(4=ready)");
};

window.testModels = () => {
  console.log("=== MODELS DEBUG ===");
  console.log("Face-API loaded:", typeof faceapi !== 'undefined');
  if (faceapi) {
    console.log("All models loaded:", allModelsLoaded);
    console.log("TinyFaceDetector ready:", !!faceapi.nets.tinyFaceDetector?.getModelName?.());
    console.log("FaceExpressionNet ready:", !!faceapi.nets.faceExpressionNet?.getModelName?.());
    console.log("AgeGenderNet ready:", !!faceapi.nets.ageGenderNet?.getModelName?.());
  }
};

// Debug gender detection accuracy
window.debugGender = function() {
  if (!lastDetectionData) {
    console.log("âŒ No face detected yet");
    return;
  }
  console.log("");
  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log("ðŸ” GENDER DETECTION DEBUG (EXACT VALUES):");
  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log(`Raw Gender Value: ${lastDetectionData.gender}`);
  console.log(`Confidence (Exact): ${lastDetectionData.genderProbExact}%`);
  console.log(`Confidence (Rounded): ${lastDetectionData.genderProb}%`);
  if (lastDetectionData.genderProb < 60) {
    console.log("âš ï¸ LOW CONFIDENCE - Gender may not be accurate");
    console.log("ðŸ’¡ Try: Move closer, better lighting, different angle");
  } else if (lastDetectionData.genderProb >= 80) {
    console.log("âœ“ HIGH CONFIDENCE - Gender likely accurate");
  } else {
    console.log("âš ï¸ MEDIUM CONFIDENCE - Gender probable but verify");
  }
  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log("");
};

// Debug age detection with exact values
window.debugAge = function() {
  if (!lastDetectionData) {
    console.log("âŒ No face detected yet");
    return;
  }
  console.log("");
  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log("ðŸ” AGE DETECTION DEBUG (WITH STABILIZATION):");
  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log(`Age (Raw - Decimal): ${lastDetectionData.ageExact} years`);
  console.log(`Age (Stabilized): ${lastDetectionData.age} years`);
  console.log(`Age Group: ${lastDetectionData.ageGroup}`);
  console.log(`Recent readings: ${ageReadings.length} readings`);
  console.log(`Readings: ${ageReadings.map(a => a.toFixed(1)).join(", ")}`);
  console.log("ðŸ’¡ Age is averaged from last 7 readings for stability");
  console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log("");
};

// New function: Show all exact detection values
window.debugExactValues = function() {
  if (!lastDetectionData) {
    console.log("âŒ No face detected yet");
    return;
  }
  console.log("");
  console.log("â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
  console.log("â•‘  EXACT DETECTION VALUES (RAW)         â•‘");
  console.log("â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£");
  console.log(`â•‘ ðŸ‘¤ AGE:                               â•‘`);
  console.log(`â•‘    Exact:   ${lastDetectionData.ageExact} years              â•‘`);
  console.log(`â•‘    Rounded: ${lastDetectionData.age} years                â•‘`);
  console.log(`â•‘                                       â•‘`);
  console.log(`â•‘ âš§ GENDER:                             â•‘`);
  console.log(`â•‘    Value:       ${lastDetectionData.gender}            â•‘`);
  console.log(`â•‘    Exact Conf:  ${lastDetectionData.genderProbExact}%       â•‘`);
  console.log(`â•‘    Rounded Conf:${lastDetectionData.genderProb}%          â•‘`);
  console.log(`â•‘                                       â•‘`);
  console.log(`â•‘ ðŸ˜„ EMOTION:                            â•‘`);
  console.log(`â•‘    ${lastDetectionData.emotionName} (${lastDetectionData.emotionProb}% confidence)        â•‘`);
  console.log(`â•‘                                       â•‘`);
  console.log(`â•‘ ðŸ‘¥ AGE GROUP: ${lastDetectionData.ageGroup}               â•‘`);
  console.log("â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
  console.log("");
};

// Unlock output (allow re-detection)
window.unlockOutput = function() {
  outputLocked = false;
  console.log("ðŸ”“ Output UNLOCKED - Ready for new detection");
};

// Lock output (freeze current values)
window.lockOutput = function() {
  outputLocked = true;
  console.log("ðŸ”’ Output LOCKED");
};

// Check lock status
window.checkLockStatus = function() {
  if (outputLocked) {
    console.log("ðŸ”’ Output is currently LOCKED");
  } else {
    console.log("ðŸ”“ Output is UNLOCKED (will update on new detection)");
  }
};

// Print available debug commands
console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
console.log("ðŸ“‹ AVAILABLE DEBUG & UTILITY COMMANDS:");
console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
console.log("");
console.log("ðŸ” DEBUGGING:");
console.log("  ðŸ’¡ testCamera()         - Test camera status");
console.log("  ðŸ’¡ testModels()         - Test model status");
console.log("  ðŸ’¡ debugExactValues()   - Show ALL detection values");
console.log("  ðŸ’¡ debugAge()           - Show age with stabilization");
console.log("  ðŸ’¡ debugGender()        - Show gender detection");
console.log("  ðŸ’¡ checkLockStatus()    - Check output lock status");
console.log("");
console.log("ðŸ“¸ CAPTURE & VIEW:");
console.log("  ðŸ“¸ takeScreenshot()     - Capture current video frame");
console.log("  ðŸ“Š getDetectionHistory()  - Show all detections");
console.log("  ðŸ—‘ï¸  clearDetectionHistory() - Clear all saved detections");
console.log("");
console.log("âœ¨ SMART FEATURES:");
console.log("  ðŸ”’ Age Stabilization - Average of 7 readings (prevents jumps)");
console.log("  ðŸ‘¥ Gender Smoothing - Most common gender from 5 readings");
console.log("  ðŸ˜Š Emotion Smoothing - Most common emotion from 5 readings");
console.log("  ðŸ“Š Auto-History - Every detection saved automatically");
console.log("");
console.log("â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");



