/* ══════════════════════════════════════════════════════
   UPLOAD LOGO MODAL - JavaScript
   Handles modal open/close, file upload preview, form submission
   ══════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // Elements
    const overlay = document.getElementById('uploadModalOverlay');
    const modal = document.getElementById('uploadModal');
    const openBtn = document.getElementById('openUploadModal');
    const closeBtn = document.getElementById('closeUploadModal');
    const form = document.getElementById('uploadLogoForm');
    const submitBtn = document.getElementById('uploadSubmitBtn');
    const successDiv = document.getElementById('uploadSuccess');
    
    // Upload zone elements
    const uploadZone = document.getElementById('uploadLogoZone');
    const fileInput = document.getElementById('logoFileInput');
    const previewImg = document.getElementById('logoPreviewImg');
    const fileNameEl = document.getElementById('logoFileName');

    if (!overlay || !modal || !openBtn) return;

    // State
    let selectedFile = null;

    // ─────────────────────────────────────────────────────
    // MODAL OPEN/CLOSE
    // ─────────────────────────────────────────────────────
    function openModal() {
        overlay.classList.add('is-active');
        modal.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('is-active');
        modal.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('is-active')) {
            closeModal();
        }
    });

    // ─────────────────────────────────────────────────────
    // FILE UPLOAD
    // ─────────────────────────────────────────────────────
    uploadZone.addEventListener('click', function() {
        fileInput.click();
    });

    // Drag & Drop
    uploadZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            handleFileSelect(fileInput.files[0]);
        }
    });

    function handleFileSelect(file) {
        selectedFile = file;
        fileNameEl.textContent = file.name;
        uploadZone.classList.add('has-file');

        // Show preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            // Non-image file (PDF, AI, etc.)
            previewImg.style.display = 'none';
        }
    }

    // ─────────────────────────────────────────────────────
    // FORM SUBMISSION
    // ─────────────────────────────────────────────────────
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('uploadName').value.trim();
        const surname = document.getElementById('uploadSurname').value.trim();
        const phone = document.getElementById('uploadPhone').value.trim();
        const email = document.getElementById('uploadEmail').value.trim();
        const notes = document.getElementById('uploadNotes').value.trim();

        // Basic validation
        if (!name || !surname || !phone || !email) {
            alert('Please fill in all required fields.');
            return;
        }

        // Show loading state
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="upload-spinner"></span> Sending...';

        try {
            // Prepare form data
            const formData = new FormData();
            formData.append('name', name);
            formData.append('surname', surname);
            formData.append('phone', phone);
            formData.append('email', email);
            formData.append('notes', notes);
            formData.append('source', 'Upload Logo Modal - Homepage');
            
            if (selectedFile) {
                formData.append('logo', selectedFile);
            }

            // Try to send to backend
            const apiUrl = window.BACKEND_URL || 'https://backend-brandeduk.onrender.com';
            
            const response = await fetch(`${apiUrl}/api/contact/upload-enquiry`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showSuccess();
            } else {
                // Fallback: Try mailto
                fallbackMailto(name, surname, phone, email, notes);
            }
        } catch (error) {
            console.error('Upload modal error:', error);
            // Fallback: Use mailto
            fallbackMailto(name, surname, phone, email, notes);
        }

        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
    });

    function fallbackMailto(name, surname, phone, email, notes) {
        const subject = encodeURIComponent('Logo Enquiry from ' + name + ' ' + surname);
        const body = encodeURIComponent(
            'New Logo Enquiry\n' +
            '================\n\n' +
            'Name: ' + name + ' ' + surname + '\n' +
            'Phone: ' + phone + '\n' +
            'Email: ' + email + '\n\n' +
            'Notes:\n' + (notes || 'No notes provided') + '\n\n' +
            '---\n' +
            'Logo file: ' + (selectedFile ? selectedFile.name + ' (please request via reply)' : 'Not uploaded')
        );
        
        window.location.href = 'mailto:info@brandeduk.com?subject=' + subject + '&body=' + body;
        showSuccess();
    }

    function showSuccess() {
        form.classList.add('is-hidden');
        successDiv.classList.add('is-visible');

        // Reset after 3 seconds and close modal
        setTimeout(function() {
            resetForm();
            closeModal();
        }, 3000);
    }

    function resetForm() {
        form.reset();
        form.classList.remove('is-hidden');
        successDiv.classList.remove('is-visible');
        uploadZone.classList.remove('has-file');
        previewImg.src = '';
        previewImg.style.display = 'none';
        fileNameEl.textContent = '';
        selectedFile = null;
    }

})();
