# Troubleshooting Guide - Camera Issues

## Problem: Camera Does Not Open

### Step 1: Check Browser Console
1. Open **Developer Tools** (F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Look for error messages
4. Take a screenshot of any errors

### Common Error Messages & Solutions:

#### ❌ "NotAllowedError: Permission denied"
**Cause:** Browser camera permission not granted
**Solution:**
- Click the 🔒 lock icon next to the URL
- Click "Reset permissions"
- Reload the page (F5)
- Click "Allow" when prompted for camera access
- If asked for "Allow/Block", select "Allow"

#### ❌ "NotFoundError: No camera found"
**Cause:** Computer has no camera or it's disconnected
**Solution:**
- Check if your laptop has a built-in camera
- For external cameras, check USB connection
- Restart the camera device
- Try: Settings → Privacy & Security → Camera

#### ❌ "NotReadableError: Camera already in use"
**Cause:** Another application is using the camera
**Solution:**
- Close other apps using camera (Zoom, Teams, Skype, etc.)
- Kill camera processes:
  ```powershell
  taskkill /F /IM camera.exe
  ```
- Restart browser
- Reload the page

#### ❌ Models fail to load
**Cause:** Models folder is missing or files not in correct location
**Solution:**
- Ensure `frontend/models/` directory exists
- Models should be auto-downloaded from CDN by face-api.js
- Check Network tab in Developer Tools for failed requests

### Step 2: Browser Compatibility
- ✅ Chrome/Edge: Best support
- ✅ Firefox: Good support
- ⚠️ Safari: Limited support (iOS may block camera)
- ❌ Internet Explorer: Not supported

### Step 3: Check Browser Settings
1. **Windows 10/11:**
   - Settings → Privacy & Security → Camera
   - Make sure camera is enabled
   - Allow this browser to access camera

2. **Chrome Specific:**
   - Go to `chrome://settings/content/camera`
   - Add your website to allowed list
   - Reload page

### Step 4: HTTPS/Local Testing
- Local testing (file://) may encounter permission issues
- Solutions:
  - Use `localhost:3000` with a local server
  - Or run with HTTPS (Chrome blocks cameras on HTTP)

### Step 5: System-Level Troubleshooting

1. **Check Camera is Enabled (Windows):**
   ```powershell
   # List all cameras
   Get-PnpDevice -Class Camera -PresentOnly
   ```

2. **Restart Camera Driver:**
   - Device Manager → Cameras
   - Right-click camera → Disable → Enable

3. **Test Camera Works:**
   - Open Windows Camera app
   - If it works there, issue is with website
   - If it doesn't work, camera is disabled

### Step 6: Run Local Server (Recommended)

If having issues with direct file access:

```powershell
# Install Python (if needed)
# Then run:
cd frontend
python -m http.server 8000
# Visit: http://localhost:8000
```

Or with Node.js:
```powershell
# Install http-server
npm install -g http-server
# Run:
http-server frontend -p 8000
# Visit: http://localhost:8000
```

## Debug Checklist

- [ ] Browser console shows no errors
- [ ] Camera permission is granted
- [ ] No other app is using the camera
- [ ] Video element shows in DevTools
- [ ] Face-API.js loaded successfully
- [ ] Page shows "Status: Models Loaded"
- [ ] Page shows "Status: Camera Ready"
- [ ] Browser is Chrome, Edge, or Firefox

## Advanced Debugging

### Check in Browser Console:
```javascript
// Check if camera is available
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    devices.forEach(device => {
      console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
    });
  });

// Check Face-API
console.log('Face API Loaded:', typeof faceapi !== 'undefined');

// Check video element
const video = document.getElementById('video');
console.log('Video Element:', video);
console.log('Video State:', video.readyState); // Should be 4 when ready
```

### Expected Console Output:
```
Script loaded, initializing...
All models loaded successfully
Status: Models Loaded - Requesting Camera
Requesting camera access...
Camera access granted
Video metadata loaded
Video playing, starting detection...
```

## Still Not Working?

1. **Try Different Browser:** Chrome/Edge work best
2. **Restart Computer:** Clear any stuck processes
3. **Update Drivers:** Download latest camera drivers
4. **Check Firewall:** Some firewalls block camera access
5. **Test on Different Website:** Omegle.com or Google Meet to confirm camera works globally

## Contact Support

If issues persist:
1. Take screenshot of console errors
2. Note your browser version
3. Check if camera works in other apps
4. Describe exact error message
