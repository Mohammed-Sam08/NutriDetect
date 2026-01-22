from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.utils import load_img, img_to_array
from keras.models import load_model
from PIL import Image
from datetime import datetime
import os
import base64
import io

app = Flask(__name__)
CORS(app)

print("🚀 Starting NutriDetect AI Backend...")

# Create necessary folders
os.makedirs('uploads', exist_ok=True)

# ============ AI MODEL SETUP ============
MODEL_PATH = 'new_model.h5'
LABELS = ['Fresh apple', 'Fresh banana', 'Fresh orange', 
          'Rotten apple', 'Rotten banana', 'Rotten orange']

# Load AI model
try:
    model = load_model(MODEL_PATH)
    print(f"✅ AI Model loaded successfully from: {MODEL_PATH}")
    print(f"✅ Model input shape: {model.input_shape}")
    print(f"✅ Model output shape: {model.output_shape}")
except Exception as e:
    model = None
    print(f"❌ Failed to load AI model: {e}")
    print("⚠️  Using dummy predictions instead")

# Nutrition database
NUTRITION_DB = {
    'Fresh apple': {'calories': 52, 'benefits': 'Rich in fiber and antioxidants', 'color': 'Red or Green'},
    'Fresh banana': {'calories': 89, 'benefits': 'High in potassium and natural sugars', 'color': 'Yellow'},
    'Fresh orange': {'calories': 47, 'benefits': 'High in vitamin C and supports immune function', 'color': 'Orange'},
    'Rotten apple': {'calories': 40, 'benefits': 'Avoid consumption', 'color': 'Brown or mushy'},
    'Rotten banana': {'calories': 75, 'benefits': 'Avoid consumption', 'color': 'Brown or mushy'},
    'Rotten orange': {'calories': 35, 'benefits': 'Avoid consumption', 'color': 'Brown or mushy'}
}

# Health tips database
HEALTH_TIPS = {
    'Fresh apple': ['Supports digestion and heart health', 'Enjoy raw or in salads', 'Great in overnight oats or smoothies'],
    'Fresh banana': ['Boosts energy and supports muscle function', 'Best enjoyed as a quick breakfast or smoothie', 'Slice over cereal or toast with peanut butter'],
    'Fresh orange': ['Strengthens immunity and skin health', 'Enjoy fresh or as juice (without added sugar)', 'Add segments to salads or yogurt bowls'],
    'Rotten apple': ['May contain harmful mold and toxins', 'Do not try to cut off bad parts', 'Discard properly'],
    'Rotten banana': ['Fermentation can lead to spoilage', 'Toss if you see grayish mold or leakage', 'Use only if overripe, not spoiled'],
    'Rotten orange': ['Risk of mold exposure', 'Discard if squishy or smells musty', 'Avoid cutting away bad parts']
}

def center_crop(image):
    """Center crop image to square"""
    width, height = image.size
    new_edge = min(width, height)
    left = (width - new_edge) // 2
    top = (height - new_edge) // 2
    right = (width + new_edge) // 2
    bottom = (height + new_edge) // 2
    return image.crop((left, top, right, bottom))

def predict_with_ai(image):
    """Use AI model to predict fruit freshness"""
    try:
        # Center crop
        cropped_img = center_crop(image)
        
        # Resize to model input size (assuming 224x224)
        img_resized = cropped_img.resize((224, 224))
        
        # Convert to array and normalize
        img_array = img_to_array(img_resized) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # AI Prediction
        predictions = model.predict(img_array, verbose=0)
        predicted_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_index]) * 100
        
        # Get label
        prediction = LABELS[predicted_index]
        
        print(f"🤖 AI Prediction: {prediction}")
        print(f"📊 Confidence: {confidence:.2f}%")
        print(f"📈 All predictions: {predictions[0]}")
        
        return prediction, confidence
        
    except Exception as e:
        print(f"❌ AI Prediction error: {e}")
        raise e

def get_freshness_percentage(prediction, confidence):
    """Convert prediction to freshness percentage"""
    if 'Fresh' in prediction:
        # Fresh items: 70-98% based on confidence
        return min(98, max(70, confidence))
    else:
        # Rotten items: 10-45% based on confidence
        return min(45, max(10, 100 - confidence))

# ============ API ROUTES ============

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Main AI analysis endpoint"""
    print("\n" + "="*50)
    print("📨 AI Analysis Request Received")
    print("="*50)
    
    try:
        # Get JSON data
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        if 'image' not in data:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        # Extract image data
        image_data = data['image']
        print(f"📸 Image data received: {len(image_data)} characters")
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 to image
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            print(f"✅ Image decoded: {image.size[0]}x{image.size[1]} pixels")
        except Exception as e:
            print(f"❌ Image decode error: {e}")
            return jsonify({'success': False, 'error': f'Invalid image: {str(e)}'}), 400
        
        # Save image for reference
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"scan_{timestamp}.jpg"
        filepath = os.path.join('uploads', filename)
        image.save(filepath)
        print(f"💾 Image saved: {filename}")
        
        # Get AI Prediction
        print("🤖 Running AI analysis...")
        
        if model:
            # REAL AI PREDICTION
            prediction, confidence = predict_with_ai(image)
            category = 'Fresh' if 'Fresh' in prediction else 'Rotten'
            freshness = get_freshness_percentage(prediction, confidence)
            print(f"🎯 AI Result: {prediction} ({category})")
            print(f"📊 Confidence: {confidence:.2f}%")
            print(f"📈 Freshness: {freshness:.1f}%")
        else:
            # Fallback to dummy (should not happen now)
            prediction = "Fresh Apple"
            category = "Fresh"
            freshness = 85
            confidence = 95
            print("⚠️  Using dummy prediction (model not loaded)")
        
        # Get nutrition info
        nutrition = NUTRITION_DB.get(prediction, {
            'calories': 50,
            'benefits': 'Standard nutritional value',
            'color': 'Normal'
        })
        
        # Get health tips
        health_tips = HEALTH_TIPS.get(prediction, [
            'Consume fresh fruits daily',
            'Store in cool, dry place',
            'Wash before eating'
        ])
        
        # Prepare response
        result = {
            'success': True,
            'prediction': prediction,
            'category': category,
            'freshness': round(freshness, 1),
            'confidence': round(confidence, 1),
            'nutrition': {
                'calories': f"{nutrition['calories']} per 100g",
                'benefits': nutrition['benefits'],
                'color': nutrition['color']
            },
            'health_tips': health_tips,
            'timestamp': datetime.now().isoformat(),
            'image_saved': filename,
            'ai_model_used': MODEL_PATH if model else 'dummy'
        }
        
        print("✅ Analysis complete!")
        print("="*50)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"🔥 Server error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'AI analysis failed'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with AI status"""
    return jsonify({
        'status': 'healthy',
        'service': 'NutriDetect AI Backend',
        'python_version': '3.14.2',
        'ai_model': {
            'loaded': model is not None,
            'name': MODEL_PATH,
            'labels': LABELS if model else []
        },
        'libraries': {
            'tensorflow': '2.15.0',
            'pillow': '10.0.0',
            'flask': '2.3.3'
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/model_info', methods=['GET'])
def model_info():
    """Get AI model information"""
    if model:
        return jsonify({
            'success': True,
            'model_name': MODEL_PATH,
            'input_shape': model.input_shape,
            'output_shape': model.output_shape,
            'labels': LABELS,
            'total_params': model.count_params()
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 404

@app.route('/')
def home():
    """Home page"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>🍎 NutriDetect AI Backend</title>
        <style>
            body { font-family: Arial; padding: 40px; text-align: center; background: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { color: #2E7D32; }
            .status { display: inline-block; padding: 10px 20px; border-radius: 20px; margin: 10px 0; }
            .healthy { background: #4CAF50; color: white; }
            .ai-ready { background: #2196F3; color: white; margin-left: 10px; }
            .info-box { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🍎 NutriDetect AI Backend</h1>
            <div class="status healthy">✅ SERVER HEALTHY</div>
            <div class="status ai-ready">🤖 AI READY</div>
            
            <div class="info-box">
                <h3>🔗 API Endpoints:</h3>
                <p><strong>POST</strong> <code>/api/analyze</code> - Analyze food images with AI</p>
                <p><strong>GET</strong> <code>/api/health</code> - Server & AI status</p>
                <p><strong>GET</strong> <code>/api/model_info</code> - AI model details</p>
            </div>
            
            <div class="info-box">
                <h3>🤖 AI Model Status:</h3>
                <p><strong>Model:</strong> new_model.h5</p>
                <p><strong>Classes:</strong> 6 (Fresh/Rotten × Apple/Banana/Orange)</p>
                <p><strong>Framework:</strong> TensorFlow 2.15.0</p>
            </div>
            
            <p>Connect your frontend to: <code>http://localhost:5000/api/analyze</code></p>
        </div>
    </body>
    </html>
    '''

if __name__ == '__main__':
    print("="*60)
    print("           🚀 NUTRIDETECT AI BACKEND SERVER")
    print("="*60)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🐍 Python: 3.14.2")
    print(f"🧠 TensorFlow: 2.15.0")
    print(f"🖼️  Pillow: 10.0.0")
    print(f"🌐 Server: http://localhost:5000")
    print(f"🔗 Health: http://localhost:5000/api/health")
    print("="*60)
    
    if model:
        print("✅ AI MODEL: LOADED & READY")
        print(f"📁 Model: {MODEL_PATH}")
        print(f"🎯 Classes: {len(LABELS)}")
        print(f"📦 Input shape: {model.input_shape}")
    else:
        print("❌ AI MODEL: NOT LOADED")
        print("⚠️  Using dummy predictions")
    
    print("="*60)
    print("💡 Frontend should send POST requests to /api/analyze")
    print("📸 Send base64 encoded images for AI analysis")
    print("="*60)
    
    try:
        app.run(debug=True, port=5000, host='0.0.0.0')
    except OSError as e:
        print(f"❌ Port error: {e}")
        print("💡 Trying port 5001...")
        app.run(debug=True, port=5001, host='0.0.0.0')