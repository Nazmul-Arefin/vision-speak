import os
import uuid
import time
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image, ImageDraw
import pyttsx3
from paddleocr import PaddleOCR
import atexit
import glob

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB limit
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Initialize OCR engine
ocr_engine = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    use_gpu=True,
    show_log=False
)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_image(image_path, language='en'):
    try:
        # Set language for OCR
        ocr_engine.lang = 'ch' if language == 'zh' else 'en'
        
        # Perform OCR
        result = ocr_engine.ocr(image_path, cls=True)
        
        extracted_text = []
        boxes = []
        
        # Handle different PaddleOCR response formats
        if result and isinstance(result, list):
            for item in result:
                if item and isinstance(item, list):
                    for line in item:
                        if line and len(line) >= 2:
                            text = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
                            box = line[0]
                            extracted_text.append(text)
                            boxes.append(box)
        
        full_text = '\n'.join(extracted_text)
        
        # Draw bounding boxes
        img = Image.open(image_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        
        for box in boxes:
            try:
                box_tuples = [(int(point[0]), int(point[1])) for point in box]
                draw.polygon(box_tuples, outline=(255, 0, 0), width=3)
            except (TypeError, IndexError):
                continue
        
        processed_image_path = f"{os.path.splitext(image_path)[0]}_processed.jpg"
        img.save(processed_image_path)
        
        return full_text, boxes, processed_image_path
    except Exception as e:
        raise Exception(f"Image processing error: {str(e)}")

def text_to_speech(text, language='en'):
    try:
        engine = pyttsx3.init()
        
        # Voice configuration
        if language == 'zh':
            voices = engine.getProperty('voices')
            for voice in voices:
                if 'chinese' in voice.name.lower() or 'zh' in voice.id.lower():
                    engine.setProperty('voice', voice.id)
                    break
        
        # Generate unique filename
        audio_filename = f"tts_{int(time.time())}.mp3"
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename)
        
        engine.save_to_file(text, audio_path)
        engine.runAndWait()
        
        return audio_path
    except Exception as e:
        raise Exception(f"TTS generation error: {str(e)}")

# Cleanup function
def cleanup():
    try:
        files = glob.glob(os.path.join(app.config['UPLOAD_FOLDER'], '*'))
        for f in files:
            if not f.endswith('.gitkeep'):
                try:
                    os.remove(f)
                except:
                    pass
    except:
        pass

atexit.register(cleanup)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part', 'code': 400}), 400
    
    file = request.files['file']
    language = request.form.get('language', 'en')
    
    if file.filename == '':
        return jsonify({'error': 'No selected file', 'code': 400}), 400
    
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Allowed file types: PNG, JPG, JPEG', 'code': 400}), 400
    
    try:
        # Save original file
        filename = secure_filename(file.filename)
        unique_id = uuid.uuid4().hex[:8]
        basename, ext = os.path.splitext(filename)
        new_filename = f"{basename}_{unique_id}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        file.save(filepath)
        
        # Process image
        text, boxes, processed_image_path = process_image(filepath, language)
        
        # Generate TTS
        audio_path = text_to_speech(text, language)
        audio_url = f"/static/uploads/{os.path.basename(audio_path)}"
        
        return jsonify({
            'success': True,
            'text': text,
            'processed_image': f"/{processed_image_path}",
            'audio': audio_url,
            'original_image': f"/static/uploads/{new_filename}"
        })
    except Exception as e:
        # Cleanup on error
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e), 'code': 500}), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        return send_from_directory(
            app.config['UPLOAD_FOLDER'],
            filename,
            as_attachment=True
        )
    except FileNotFoundError:
        return jsonify({'error': 'File not found', 'code': 404}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)