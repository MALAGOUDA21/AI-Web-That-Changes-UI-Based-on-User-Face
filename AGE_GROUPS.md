## 👥 Age Group Classification

The app now classifies detected faces into three age groups:

### Classification Rules:

| Group | Age Range | Emoji | Color |
|-------|-----------|-------|-------|
| **👶 Child** | 0 - 12 years | 👶 | Red (#FF6B6B) |
| **👨 Adult** | 13 - 59 years | 👨 | Teal (#4ECDC4) |
| **👴 Old Age** | 60+ years | 👴 | Yellow (#FFE66D) |

### How It Works:

1. **Face Detected** → AI estimates age
2. **Age Estimated** → App classifies into group
3. **Group Displayed** → Shows with emoji and color code

### Example Output:

```
Age: 28 years
Group: 👨 Adult         ← Colored in Teal
Gender: Female (89%)
Emotion: Happy (92%)
```

### Features:

✅ Real-time age group detection  
✅ Color-coded display  
✅ Easy to understand emojis  
✅ Works with all detected faces  

### Age Group Uses:

- **Child Protection**: Identify if content is appropriate
- **Demographics**: Analyze age distribution in videos
- **Accessibility**: Adjust UI based on user age group
- **Analytics**: Track age group trends

---

See main [README.md](README.md) for full documentation.
