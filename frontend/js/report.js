const reportForm = document.getElementById('reportForm');
const submitBtn = document.getElementById('submitBtn');
const alertContainer = document.getElementById('alertContainer');
const locationInfo = document.getElementById('locationInfo');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');

function showAlert(message, type = 'danger') {
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        
        latitudeInput.value = lat;
        longitudeInput.value = lon;
        
        locationInfo.innerHTML = `<strong>📍 Location:</strong> Latitude: ${lat}, Longitude: ${lon}`;
      },
      (error) => {
        locationInfo.innerHTML = `<strong>⚠️ Location:</strong> Unable to detect location. Please enable location services.`;
        console.error('Geolocation error:', error);
      }
    );
  } else {
    locationInfo.innerHTML = `<strong>⚠️ Location:</strong> Geolocation is not supported by your browser.`;
  }
}

reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!latitudeInput.value || !longitudeInput.value) {
    showAlert('Location is required. Please enable location services and refresh the page.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  alertContainer.innerHTML = '';

  const formData = new FormData(reportForm);

  const result = await postForm('/reports', formData);

  if (result.success) {
    window.location.href = 'success.html';
  } else {
    showAlert(result.error || 'Failed to submit report. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Report';
  }
});

getLocation();
