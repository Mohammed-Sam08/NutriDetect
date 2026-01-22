// script.js - COMPLETE FIXED VERSION (NO AUTO-CLOSE)

document.addEventListener("DOMContentLoaded", () => {
  // User dropdown functionality
  const userIcon = document.getElementById("userIcon");
  const dropdown = document.getElementById("dropdownMenu");

  if (userIcon && dropdown) {
    userIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (!userIcon.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove("show");
      }
    });
  }

  // Upload area drag and drop functionality
  const uploadArea = document.getElementById("uploadArea");
  const uploadBtn = document.getElementById("uploadBtn");

  if (uploadArea) {
    // Highlight drop area when dragging files over it
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
      uploadArea.classList.add('drag-over');
    }

    function unhighlight() {
      uploadArea.classList.remove('drag-over');
    }

    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    }

    function handleFiles(files) {
      if (files.length > 0) {
        // In a real app, you would upload files to server here
        // For demo, we'll just show a success message
        uploadArea.innerHTML = `
          <div class="upload-icon" style="color: #4CAF50;">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>Upload Successful!</h3>
          <p>${files.length} file(s) uploaded. Analyzing your food items...</p>
          <div class="loading-bar" style="width: 100%; height: 6px; background: #E0E0E0; border-radius: 3px; margin: 20px 0; overflow: hidden;">
            <div class="loading-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 3px; animation: load 2s forwards;"></div>
          </div>
          <p class="file-types">Analysis in progress...</p>
        `;
        
        // Simulate analysis completion - AB AUTO-CLOSE NAHI HOGI
        setTimeout(() => {
          // Call backend API instead of dummy function
          handleFileUploadToBackend(files[0]);
        }, 2000);
      }
    }

    // Upload button click
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        // Create a file input element and trigger it
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*';
        fileInput.multiple = true;
        
        fileInput.onchange = (e) => {
          const files = e.target.files;
          handleFiles(files);
        };
        
        fileInput.click();
      });
    }
  }

  // Handle file upload to backend
  async function handleFileUploadToBackend(file) {
    // prevent multiple uploads/analyses at once
    if (window.isProcessing) return;
    window.isProcessing = true;

    const localUploadBtn = document.getElementById('uploadBtn') || uploadBtn;
    if (localUploadBtn) localUploadBtn.disabled = true;

    try {
      const reader = new FileReader();

      reader.onload = async function(e) {
        const imageData = e.target.result;

        showLoadingMessage('Analyzing with AI...');

        try {
          const result = await analyzeWithBackend(imageData);
          hideLoadingMessage();
          displayBackendResults(result);

          // Reset upload area after successful analysis
          resetUploadArea();
        } catch (error) {
          hideLoadingMessage();
          alert('Analysis failed: ' + error.message);
          resetUploadArea();
        }

        // release processing lock and re-enable upload button
        window.isProcessing = false;
        if (localUploadBtn) localUploadBtn.disabled = false;
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      resetUploadArea();
      window.isProcessing = false;
      if (localUploadBtn) localUploadBtn.disabled = false;
    }
  }

  // Function to show analysis results
  function showAnalysisResults() {
    // Create a modal with analysis results
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 40px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <button id="closeModal" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
        <h2 style="color: #2E7D32; margin-bottom: 20px;">🍎 Apple Analysis Results</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #F8FDF9; padding: 20px; border-radius: 12px;">
            <h3 style="margin-bottom: 10px; color: #2E7D32;">Freshness</h3>
            <div style="height: 10px; background: #E0E0E0; border-radius: 5px; margin: 15px 0; overflow: hidden;">
              <div style="width: 85%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 5px;"></div>
            </div>
            <p style="font-weight: bold; color: #4CAF50;">85% - Fresh</p>
          </div>
          
          <div style="background: #F8FDF9; padding: 20px; border-radius: 12px;">
            <h3 style="margin-bottom: 10px; color: #2E7D32;">Nutrition Grade</h3>
            <div style="font-size: 48px; color: #4CAF50; text-align: center;">A</div>
            <p style="text-align: center; font-weight: bold;">Excellent</p>
          </div>
        </div>
        
        <div style="background: #F8FDF9; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 15px; color: #2E7D32;">Key Nutrients</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <span style="background: white; padding: 8px 15px; border-radius: 20px; font-size: 14px;">Vitamin C: 14% DV</span>
            <span style="background: white; padding: 8px 15px; border-radius: 20px; font-size: 14px;">Fiber: 17% DV</span>
            <span style="background: white; padding: 8px 15px; border-radius: 20px; font-size: 14px;">Potassium: 6% DV</span>
            <span style="background: white; padding: 8px 15px; border-radius: 20px; font-size: 14px;">Vitamin K: 5% DV</span>
          </div>
        </div>
        
        <div style="background: #FFF3E0; padding: 20px; border-radius: 12px;">
          <h3 style="margin-bottom: 10px; color: #FF9800;"><i class="fas fa-lightbulb"></i> Health Tip</h3>
          <p>This apple is at peak freshness! Best consumed within 3-4 days. Store in a cool, dry place away from direct sunlight.</p>
        </div>
        
        <button id="closeModalBtn" style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; border: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; margin-top: 25px; width: 100%; cursor: pointer;">Close Results</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    document.getElementById('closeModal').addEventListener('click', () => {
      document.body.removeChild(modal);
      resetUploadArea();
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      resetUploadArea();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resetUploadArea();
      }
    });
  }

  // Reset upload area after analysis
  function resetUploadArea() {
    if (uploadArea) {
      uploadArea.innerHTML = `
        <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
        <h3>Upload Media</h3>
        <p>Drag & drop images or videos of fruits/vegetables here, or click to browse files</p>
        <button class="upload-btn" id="uploadBtn"><i class="fas fa-upload"></i> Upload Now</button>
        <p class="file-types">Supported: JPG, PNG, MP4, MOV (Max 100MB)</p>
      `;
      
      // Reattach event listeners
      document.getElementById('uploadBtn').addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,video/*';
        fileInput.multiple = true;
        
        fileInput.onchange = (e) => {
          const files = e.target.files;
          handleFiles(files);
        };
        
        fileInput.click();
      });
    }
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Only process internal links
      if (href !== '#') {
        e.preventDefault();
        
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Add hover effects to category cards
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });

  // Animate elements on scroll
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.fade-in');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;
      
      if (elementPosition < screenPosition) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
    });
  };

  // Set initial state for fade-in elements
  document.querySelectorAll('.fade-in').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  });

  // Listen for scroll events
  window.addEventListener('scroll', animateOnScroll);
  
  // Initial check on page load
  animateOnScroll();

  // Sign in button functionality
  const signinBtn = document.querySelector('.signin-btn');
  if (signinBtn && !signinBtn.innerHTML.includes('Profile')) {
    signinBtn.addEventListener('click', () => {
      // In a real app, this would open a sign in modal
      alert('Sign In feature would open here. For demo purposes, this is a placeholder.');
    });
  }

  // Language selector change
  const languageSelect = document.querySelector('.language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const selectedLanguage = e.target.value;
      alert(`Language changed to ${selectedLanguage}. In a real app, the site would translate.`);
    });
  }

  // Initialize freshness meters with random values for demo
  const freshnessMeters = document.querySelectorAll('.freshness-level');
  freshnessMeters.forEach(meter => {
    const randomFreshness = Math.floor(Math.random() * 30) + 70; // 70-100%
    meter.style.width = `${randomFreshness}%`;
    
    // Update text if present
    const parentText = meter.closest('.scan-method')?.querySelector('.freshness-text');
    if (parentText) {
      parentText.innerHTML = `Estimated Freshness: <strong>${randomFreshness}%</strong>`;
    }
  });

  // Add CSS for loading animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes load {
      0% { width: 0%; }
      100% { width: 100%; }
    }
  `;
  document.head.appendChild(style);

  // =============== CAMERA FUNCTIONALITY CODE START ===============
  
  // "Open Camera" button functionality
  const cameraBtn = document.querySelector('.scan-method .upload-btn');
  
  if (cameraBtn) {
    cameraBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openCameraModal();
    });
  }
  
  function openCameraModal() {
    // Check for browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera access or you are not on HTTPS/localhost.');
      return;
    }
     
  // Check if mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Create camera modal
     const modal = document.createElement('div');
  modal.id = 'cameraModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    overflow: hidden;
  `;
  
  // Mobile adjustments
  const modalWidth = isMobile ? '95%' : '600px';
  const overlaySize = isMobile ? '200px' : '250px';
  const buttonLayout = isMobile ? 'column' : 'row';
    modal.innerHTML = `
    <div style="background: #1a1a1a; border-radius: ${isMobile ? '10px' : '15px'}; padding: ${isMobile ? '15px' : '25px'}; max-width: 95%; width: ${modalWidth}; position: relative;">
      <button id="closeCameraBtn" style="position: absolute; top: 10px; right: 10px; background: #ff4444; color: white; border: none; width: ${isMobile ? '30px' : '35px'}; height: ${isMobile ? '30px' : '35px'}; border-radius: 50%; font-size: ${isMobile ? '18px' : '20px'}; cursor: pointer; z-index: 10000;">×</button>
      
      <h3 style="color: white; margin-bottom: 15px; text-align: center; font-size: ${isMobile ? '16px' : '18px'}">
        <i class="fas fa-camera"></i> Camera Scanner
      </h3>
      
      <div style="position: relative; width: 100%;">
        <video id="cameraVideo" autoplay playsinline 
          style="width: 100%; border-radius: 8px; background: #000; transform: scaleX(-1); max-height: ${isMobile ? '50vh' : 'auto'}"></video>
        
        <div id="cameraOverlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: ${overlaySize}; height: ${overlaySize}; border: 3px dashed #4CAF50; border-radius: 8px; pointer-events: none;"></div>
      </div>
      
      <div style="display: flex; flex-direction: ${buttonLayout}; gap: ${isMobile ? '10px' : '15px'}; margin-top: 15px; justify-content: center;">
        <button id="captureBtn" style="flex: 1; background: linear-gradient(135deg, #4CAF50, #2E7D32); 
          color: white; border: none; padding: ${isMobile ? '12px' : '15px'}; border-radius: 8px; font-weight: bold; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px; font-size: ${isMobile ? '14px' : '16px'};">
          <i class="fas fa-camera"></i> Capture & Analyze
        </button>
        
        <button id="switchCameraBtn" style="background: #2196F3; color: white; border: none; 
          padding: ${isMobile ? '12px 15px' : '15px 20px'}; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: ${isMobile ? '14px' : '16px'};">
          <i class="fas fa-sync-alt"></i> Switch
        </button>
      </div>
      
      <p style="color: #aaa; text-align: center; margin-top: 10px; font-size: ${isMobile ? '11px' : '13px'}">
        Place fruit/vegetable inside the green frame
      </p>
      
      <div id="cameraStatus" style="color: #4CAF50; text-align: center; margin-top: 8px; font-size: ${isMobile ? '12px' : '14px'}">
        Camera initializing...
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  initializeCamera();
  
  // Close button event
  document.getElementById('closeCameraBtn').addEventListener('click', closeCamera);
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCamera();
  });
  }
  
  function initializeCamera() {
    const video = document.getElementById('cameraVideo');
    const status = document.getElementById('cameraStatus');
    
    // Try to get camera access
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })
    .then(stream => {
      video.srcObject = stream;
      status.textContent = 'Camera active - Ready to scan';
      status.style.color = '#4CAF50';
      
      // Setup capture button
      document.getElementById('captureBtn').addEventListener('click', () => captureImage(video, stream));
      
      // Setup switch camera button
      document.getElementById('switchCameraBtn').addEventListener('click', () => switchCamera(stream));
      
      // Store stream for cleanup
      window.currentCameraStream = stream;
    })
    .catch(err => {
      console.error('Camera error:', err);
      status.textContent = 'Camera error: ' + err.message;
      status.style.color = '#ff4444';
      
      if (err.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access in browser settings.');
      } else if (err.name === 'NotFoundError') {
        alert('No camera found on your device.');
      }
    });
  }
  
  async function captureImage(videoElement, stream) {
    // prevent multiple captures while processing
    if (window.isProcessing) return;
    window.isProcessing = true;

    const status = document.getElementById('cameraStatus');
    const captureBtnEl = document.getElementById('captureBtn');
    const switchBtnEl = document.getElementById('switchCameraBtn');
    if (captureBtnEl) captureBtnEl.disabled = true;
    if (switchBtnEl) switchBtnEl.disabled = true;
    status.textContent = 'Capturing image...';
    status.style.color = '#FF9800';
    
    // Create canvas to capture image
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Flip horizontally for front camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    // Draw video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Close camera
    closeCamera();

    try {
      // Show loading
      showLoadingMessage('Sending to AI for analysis...');
      
      // Call Python backend
      const result = await analyzeWithBackend(imageData);
      
      // Hide loading
      hideLoadingMessage();
      
      // Show results - PERMANENT MODAL (NO AUTO-CLOSE)
      displayBackendResults(result);
      
    } catch (error) {
      hideLoadingMessage();
      alert('Analysis failed. Please try again.');
      console.error('Error:', error);
    }
    finally {
      // release lock and re-enable buttons if still present
      window.isProcessing = false;
      if (captureBtnEl) captureBtnEl.disabled = false;
      if (switchBtnEl) switchBtnEl.disabled = false;
    }
  }
  
  function switchCamera(currentStream) {
    const video = document.getElementById('cameraVideo');
    const status = document.getElementById('cameraStatus');
    
    // Stop current stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    
    // Determine which camera to switch to
    const currentFacingMode = currentStream 
      ? currentStream.getVideoTracks()[0].getSettings().facingMode 
      : 'environment';
    
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    status.textContent = 'Switching camera...';
    
    // Get new camera
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacingMode },
      audio: false
    })
    .then(newStream => {
      video.srcObject = newStream;
      status.textContent = `Camera switched (${newFacingMode === 'environment' ? 'Back' : 'Front'})`;
      window.currentCameraStream = newStream;
      
      // Update event listeners
      document.getElementById('captureBtn').onclick = () => captureImage(video, newStream);
      document.getElementById('switchCameraBtn').onclick = () => switchCamera(newStream);
    })
    .catch(err => {
      status.textContent = 'Failed to switch camera';
      console.error('Switch error:', err);
    });
  }
  
  function closeCamera() {
    // Stop camera stream
    if (window.currentCameraStream) {
      window.currentCameraStream.getTracks().forEach(track => track.stop());
      window.currentCameraStream = null;
    }
    
    // Remove modal
    const modal = document.getElementById('cameraModal');
    if (modal) {
      document.body.removeChild(modal);
    }
  }
  
  // =============== CAMERA FUNCTIONALITY CODE END ===============
});

// ================== PYTHON BACKEND INTEGRATION ==================
// (Ye code DOMContentLoaded ke bahar hai - global functions)

async function analyzeWithBackend(imageData) {
  try {
    console.log('Sending image to backend...');
    
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Backend response:', result);
    return result;
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

function displayBackendResults(data) {
  // Remove any existing modal
  const existingModal = document.querySelector('.result-modal');
  if (existingModal) existingModal.remove();
  
  // Create results modal - PERMANENT (NO AUTO-CLOSE)
  const modal = document.createElement('div');
  modal.className = 'result-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
  `;
  
  // Determine color based on category
  const isFresh = data.category === 'Fresh';
  const freshnessColor = isFresh ? '#4CAF50' : '#FF9800';
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
      <button id="closeResultBtn" style="position: absolute; top: 15px; right: 15px; background: #ff4444; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; font-size: 20px; cursor: pointer;">×</button>
      
      <h2 style="color: ${isFresh ? '#2E7D32' : '#D32F2F'}; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
        ${isFresh ? '✅' : '⚠️'} ${data.prediction}
      </h2>
      
      <div style="background: ${isFresh ? '#E8F5E9' : '#FFEBEE'}; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px;">Freshness Level</h3>
        <div style="height: 10px; background: #E0E0E0; border-radius: 5px; margin: 10px 0; overflow: hidden;">
          <div style="width: ${data.freshness}%; height: 100%; background: ${freshnessColor}; border-radius: 5px; transition: width 1s ease;"></div>
        </div>
        <p style="font-weight: bold; color: ${freshnessColor}; text-align: center;">${data.freshness}% Fresh</p>
      </div>
      
      <div style="background: #FFF8E1; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px;">🍽️ Nutritional Information</h3>
        <p><strong>Calories:</strong> ${data.nutrition.calories || 'N/A'} per 100g</p>
        <p><strong>Benefits:</strong> ${data.nutrition.benefits || 'No information'}</p>
        <p><strong>Color:</strong> ${data.nutrition.color || 'N/A'}</p>
      </div>
      
      <div style="background: ${isFresh ? '#E3F2FD' : '#FCE4EC'}; padding: 15px; border-radius: 10px;">
        <h3 style="margin-bottom: 10px;">${isFresh ? '💡 Health Tips' : '🚫 Safety Warning'}</h3>
        ${data.health_tips.map(tip => `<p style="margin: 8px 0; padding-left: 10px; border-left: 3px solid ${isFresh ? '#2196F3' : '#F44336'};">${tip}</p>`).join('')}
      </div>
      
      <p style="text-align: center; color: #666; margin-top: 20px; font-size: 12px;">
        Analyzed at ${new Date(data.timestamp).toLocaleTimeString()}
      </p>
      
      <button id="closeResultBtnBottom" style="background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; border: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; margin-top: 25px; width: 100%; cursor: pointer;">Close Results</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add close functionality
  document.getElementById('closeResultBtn').addEventListener('click', () => {
    modal.remove();
  });
  
  document.getElementById('closeResultBtnBottom').addEventListener('click', () => {
    modal.remove();
  });
  
  // Close when clicking outside the modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function showLoadingMessage(text = 'Analyzing...') {
  // Remove existing loader
  hideLoadingMessage();
  
  const loader = document.createElement('div');
  loader.id = 'apiLoader';
  loader.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 25px 30px;
    border-radius: 12px;
    text-align: center;
    z-index: 9998;
    min-width: 200px;
  `;
  
  loader.innerHTML = `
    <div style="font-size: 40px; margin-bottom: 10px;">🔍</div>
    <h3 style="margin-bottom: 10px; color: #4CAF50;">${text}</h3>
    <div style="width: 100px; height: 4px; background: #333; border-radius: 2px; margin: 15px auto; overflow: hidden;">
      <div style="width: 100%; height: 100%; background: #4CAF50; border-radius: 2px; animation: pulse 1.5s infinite;"></div>
    </div>
    <p style="font-size: 12px; color: #aaa;">Connecting to AI server...</p>
  `;
  
  document.body.appendChild(loader);
}

function hideLoadingMessage() {
  const loader = document.getElementById('apiLoader');
  if (loader) loader.remove();
}

// Add animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);

// ================== END BACKEND INTEGRATION ==================
