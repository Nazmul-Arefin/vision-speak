# 👁️🗨️ Vision Speak - OCR + TTS System 


[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)


A web-based tool that converts images to speech using Optical Character Recognition (OCR) and Text-to-Speech (TTS) technology. Supports **English** and **Chinese**.

<div align="center">
  <!-- Replace with your demo GIF -->
  <img src="assets\page.png" alt="vision-speak Demo" width="800">
</div>

## ✨ Features

- 🖱️ **Drag & drop** image upload (JPG/PNG)
- 🌐 **Multi-language support** (English/中文)
- 🔍 **Text extraction** with bounding box visualization
- 🔊 **Text-to-speech** conversion
- 📥 **Downloadable results** (text, processed image, audio)

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Python Flask |
| OCR Engine | PaddleOCR |
| TTS Engine | pyttsx3 |
| Frontend | HTML5, CSS3, JavaScript |
| Hosting | Streamlit/Heroku |

## 🚀 Installation

### Basic Setup
```bash
# Clone repository
git clone https://github.com/Nazmul-Arefin/vision-speak
cd vision-speak

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt