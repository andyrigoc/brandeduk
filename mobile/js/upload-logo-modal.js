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
            await submitLogoQuoteEnquiry(name, surname, phone, email, notes);
            showSuccess();
        } catch (error) {
            console.error('Upload modal error:', error);
            // Fallback: Use mailto
            fallbackMailto(name, surname, phone, email, notes);
        }

        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
    });

    async function submitLogoQuoteEnquiry(name, surname, phone, email, notes) {
        const quoteData = buildLogoQuoteData(name, surname, phone, email, notes);

        if (selectedFile) {
            quoteData.logoFiles = {
                'left-breast': selectedFile
            };
        }

        if (window.BrandedAPI && typeof window.BrandedAPI.submitQuote === 'function') {
            return window.BrandedAPI.submitQuote(quoteData);
        }

        const apiBase = (typeof window.resolveBrandedApiBase === 'function')
            ? window.resolveBrandedApiBase()
            : ((window.API_BASE_URL || 'https://api.brandeduk.com').replace(/\/+$/, ''));

        if (selectedFile) {
            const formData = new FormData();
            const dataWithoutFiles = Object.assign({}, quoteData);
            delete dataWithoutFiles.logoFiles;
            formData.append('quoteData', JSON.stringify(dataWithoutFiles));
            formData.append('logo_left-breast', selectedFile, selectedFile.name || 'homepage-logo-upload');

            const response = await fetch(`${apiBase}/api/quotes`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Quote API error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        }

        const response = await fetch(`${apiBase}/api/quotes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quoteData)
        });

        if (!response.ok) {
            throw new Error(`Quote API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    function buildLogoQuoteData(name, surname, phone, email, notes) {
        const fullName = `${name} ${surname}`.trim();
        const message = notes || 'Customer uploaded a logo from the homepage quick action and requested pricing.';

        return {
            customer: {
                fullName: fullName,
                firstName: name,
                surname: surname,
                phone: phone,
                email: email,
                company: '',
                address: '',
                message: message
            },
            summary: {
                totalQuantity: 0,
                totalItems: 1,
                garmentCost: 0,
                customizationCost: 0,
                digitizingFee: 0,
                subtotal: 0,
                vatRate: 0.2,
                vatAmount: 0,
                totalExVat: 0,
                totalIncVat: 0,
                vatMode: 'ex',
                displayTotal: 0,
                hasPoa: true
            },
            basket: [
                {
                    name: 'Homepage Logo Upload Enquiry',
                    code: 'LOGO-UPLOAD',
                    color: '',
                    quantity: 1,
                    sizes: {},
                    sizesSummary: '',
                    unitPrice: 0,
                    itemTotal: 0,
                    image: ''
                }
            ],
            customizations: [
                {
                    position: 'Left Breast',
                    method: 'TBC',
                    type: 'logo',
                    hasLogo: !!selectedFile,
                    text: message,
                    unitPrice: 0,
                    lineTotal: 0,
                    quantity: 1
                }
            ],
            notes: message,
            source: 'Upload Logo Modal - Homepage',
            timestamp: new Date().toISOString()
        };
    }

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
