// Cerrar alertas automáticamente después de 5 segundos
document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      const closeButton = alert.querySelector('.btn-close');
      if (closeButton) {
        closeButton.click();
      }
    }, 5000);
  });

  // Validación de formularios
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // Vista previa de imágenes al cargar
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const img = this.closest('.mb-3').querySelector('img');
        if (img) {
          img.src = URL.createObjectURL(this.files[0]);
        } else {
          const newImg = document.createElement('img');
          newImg.src = URL.createObjectURL(this.files[0]);
          newImg.alt = 'Vista previa';
          newImg.className = 'img-thumbnail mt-2';
          newImg.style.maxHeight = '150px';
          this.parentNode.appendChild(newImg);
        }
      }
    });
  });
});