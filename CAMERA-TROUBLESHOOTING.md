# 🎥 Camera Troubleshooting Guide

## ❌ Camera Not Opening?

Follow these steps to diagnose the issue:

### **STEP 1: Check Console Messages**
1. **Open Browser**: Click on the app in browser
2. **Login** with: `user` / `pass123`
3. **Press F12** to open Developer Console
4. **Look for messages** - What do you see?

---

## **ISSUES & SOLUTIONS**

### **Issue 1: "No Face - Move closer or show your face"**
✅ **GOOD NEWS!** Camera is working!
- The app is running but no face detected
- **Solutions:**
  - Move closer to camera
  - Ensure you're facing the camera
  - Check lighting (better lighting = better detection)
  - Make sure your face is fully visible
  
---

### **Issue 2: "PERMISSION DENIED - Allow camera in browser settings!"**
❌ **Camera Permission Blocked**
- **Solution:**
  1. Click 🔒 lock icon in browser address bar
  2. Find **Camera** setting
  3. Change to **Allow**
  4. Refresh page
  5. Try again

**For Chrome:**
- Address bar → Settings → Privacy → Camera → Site Settings

**For Firefox:**
- Address bar → ≡ menu → Preferences → Privacy → Permissions → Camera

**For Edge:**
- Address bar → Settings → Site permissions → Camera

---

### **Issue 3: "NO CAMERA FOUND - Check hardware connection!"**
❌ **No camera detected on computer**
- **Solutions:**
  - Check if camera is physically connected
  - Try different USB port (for external camera)
  - Restart computer
  - Check Device Manager for camera driver issues

---

### **Issue 4: "CAMERA IN USE - Close Zoom/Teams/Skype!"**
❌ **Camera is already in use by another app**
- **Solution:**
  - Close any video apps: Zoom, Teams, Skype, Discord, etc.
  - Try another browser tab if camera has exclusive access
  - Restart browser

---

### **Issue 5: "TIMEOUT" after Loading models**
❌ **Models loaded but camera stuck**
- **Solution:**
  1. Check console for error messages
  2. Refresh page (Ctrl+R)
  3. Clear browser cache (Ctrl+Shift+Delete)
  4. Try incognito/private window

---

### **Issue 6: Nothing Happens After Login**
❌ **App not launching after login**
- **Solution:**
  1. **Open Console (F12)**
  2. Look for red ❌ errors
  3. Type this in console: `initializeApp()`
  4. Check console for new messages
  5. If still stuck, refresh page

---

## **DEBUG COMMANDS** (Type in Console - F12)

After login and clicking "Try" buttons, run these:

```javascript
// Camera Status
testCamera()

// Model Status  
testModels()

// All Exact Values
debugExactValues()

// Age Breakdown
debugAge()

// Gender Breakdown
debugGender()

// Login Info
loginDebug()

// Force Initialize if stuck
initializeApp()
```

---

## **COMMON ERROR MESSAGES IN CONSOLE**

| Message | Meaning | Solution |
|---------|---------|----------|
| `❌ Video element not found!` | HTML broken | Refresh page |
| `Model loading FAILED` | CDN error | Check internet, refresh |
| `Video play failed` | Browser block | Check camera permission |
| `NotAllowedError` | Permission denied | Allow camera in settings |
| `NotFoundError` | No camera hardware | Check physical connection |
| `NotReadableError` | Camera in use | Close other apps |

---

## **STILL NOT WORKING?**

Try this **simplified debug page**:

1. Create new file: `test-camera-debug.html`
2. Copy this code:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Camera Debug</title>
    <style>
        body { background: #1e1e1e; color: white; font-family: Arial; padding: 20px; }
        video { border: 2px solid cyan; max-width: 500px; margin: 20px 0; }
        button { padding: 10px 20px; margin: 5px; background: #00BCD4; color: white; border: none; cursor: pointer; }
        #log { background: #222; border: 1px solid #00BCD4; padding: 15px; margin-top: 20px; max-height: 300px; overflow-y: auto; font-family: monospace; }
    </style>
</head>
<body>
    <h1>🎥 Direct Camera Test</h1>
    <button onclick="testCamera()">Test Camera</button>
    <button onclick="clearLog()">Clear Log</button>
    <video id="testVideo" muted playsinline></video>
    <div id="log"></div>

    <script>
        function log(msg) {
            const logDiv = document.getElementById('log');
            logDiv.innerHTML += msg + '<br>';
            logDiv.scrollTop = logDiv.scrollHeight;
            console.log(msg);
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '';
        }

        async function testCamera() {
            log('🟢 Starting camera test...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                log('✅ Camera permission granted!');
                log('📊 Stream active: ' + stream.active);
                log('📊 Video tracks: ' + stream.getVideoTracks().length);

                const video = document.getElementById('testVideo');
                video.srcObject = stream;
                
                await video.play();
                log('✅ Video playing!');
                log('📊 Resolution: ' + video.videoWidth + 'x' + video.videoHeight);
                
            } catch (err) {
                log('❌ ERROR: ' + err.name + ' - ' + err.message);
            }
        }
    </script>
</body>
</html>
```

3. **Click "Test Camera"** 
4. **Screenshot the console** and error message
5. Share with us

---

## **Need More Help?**

Check these files for additional info:
- Front-end logs: Browser Console (F12)
- Backend logs: Check `backend/app.py`
- Browser: Chrome/Firefox/Edge recommended
- Internet: Required for loading models from CDN

