document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles.js
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#ffffff"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": false,
                "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#ffffff",
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 2,
                "direction": "none",
                "random": false,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 1
                    }
                },
                "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                },
                "repulse": {
                    "distance": 200,
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        "retina_detect": true
    });

    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const resultsSection = document.getElementById('resultsSection');
    const extractedText = document.getElementById('extractedText');
    const originalImage = document.getElementById('originalImage');
    const processedImage = document.getElementById('processedImage');
    const audioPlayer = document.getElementById('audioPlayer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressFill = document.querySelector('.progress-fill');
    const languageSelect = document.getElementById('language');
    
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Browse button click event
    browseBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File input change event
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
        }
    });
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('highlight');
        dropZone.querySelector('.upload-icon-circle').style.transform = 'scale(1.1)';
    }
    
    function unhighlight() {
        dropZone.classList.remove('highlight');
        dropZone.querySelector('.upload-icon-circle').style.transform = 'scale(1)';
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Handle file processing
    function handleFiles(files) {
        const file = files[0];
        
        if (!file.type.match('image.*')) {
            showError('Please upload an image file (JPEG or PNG)');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showError('File size exceeds 5MB limit');
            return;
        }
        
        // Show loading overlay with animation
        loadingOverlay.classList.add('active');
        simulateProgress();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', languageSelect.value);
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Display results
                extractedText.textContent = data.text;
                originalImage.src = data.original_image;
                processedImage.src = data.processed_image;
                audioPlayer.src = data.audio;
                
                // Set download buttons
                document.querySelectorAll('.download-btn').forEach(btn => {
                    btn.onclick = function() {
                        const type = this.getAttribute('data-type');
                        let url;
                        
                        switch(type) {
                            case 'text':
                                downloadText(data.text, 'extracted_text.txt');
                                break;
                            case 'image':
                                url = data.processed_image.replace('/static/', '');
                                window.location.href = `/download/${url.split('/').pop()}`;
                                break;
                            case 'audio':
                                url = data.audio.replace('/static/', '');
                                window.location.href = `/download/${url.split('/').pop()}`;
                                break;
                        }
                    };
                });
                
                // Show results section with animation
                resultsSection.style.display = 'block';
                setTimeout(() => {
                    resultsSection.classList.add('show');
                }, 50);
                
                // Scroll to results
                setTimeout(() => {
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                showError(data.error || 'An error occurred during processing');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred while processing your file');
        })
        .finally(() => {
            // Complete progress and hide loading overlay
            progressFill.style.width = '100%';
            setTimeout(() => {
                loadingOverlay.classList.remove('active');
                progressFill.style.width = '0%';
            }, 500);
        });
    }
    
    // Simulate progress bar animation
    function simulateProgress() {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            } else {
                width += Math.random() * 10;
                progressFill.style.width = `${width}%`;
            }
        }, 300);
    }
    
    // Show error message
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.position = 'fixed';
        errorEl.style.bottom = '20px';
        errorEl.style.left = '50%';
        errorEl.style.transform = 'translateX(-50%)';
        errorEl.style.backgroundColor = '#ff4b2b';
        errorEl.style.color = 'white';
        errorEl.style.padding = '12px 24px';
        errorEl.style.borderRadius = '50px';
        errorEl.style.boxShadow = '0 4px 15px rgba(255, 75, 43, 0.4)';
        errorEl.style.zIndex = '1000';
        errorEl.style.animation = 'fadeIn 0.3s ease';
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            errorEl.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(errorEl);
            }, 300);
        }, 3000);
    }
    
    // Download text as file
    function downloadText(text, filename) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
    // Add animation to logo icons on hover
    const logoIcons = document.querySelectorAll('.logo-icon i');
    document.querySelector('.logo-container').addEventListener('mouseenter', () => {
        logoIcons[0].style.transform = 'translate(-8px, -8px)';
        logoIcons[1].style.transform = 'translate(8px, 8px)';
    });
    
    document.querySelector('.logo-container').addEventListener('mouseleave', () => {
        logoIcons[0].style.transform = 'translate(-5px, -5px)';
        logoIcons[1].style.transform = 'translate(5px, 5px)';
    });
});