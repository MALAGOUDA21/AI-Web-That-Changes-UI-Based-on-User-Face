import os
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS

# Create the Flask app
# 'static_folder' tells Flask where your CSS/JS/Images are
app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)

@app.route('/')
def index():
    # This will now serve your index.html file to the browser
    return send_from_directory('.', 'index.html')

# Keep your existing prediction logic below this...
@app.route('/predict', methods=['POST'])
def predict():
    return {"status": "success", "message": "Data received"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)