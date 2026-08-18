document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('studentForm');
    const clearBtn = document.getElementById('clearBtn');
    const fatherContact = document.getElementById('fatherContact');
    const motherContact = document.getElementById('motherContact');
    const parentContactError = document.getElementById('parentContactError');
    const successMessage = document.getElementById('successMessage');

    // Handle Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Custom validation: At least one parent's contact number is required
        const fatherVal = fatherContact.value.trim();
        const motherVal = motherContact.value.trim();

        if (fatherVal === '' && motherVal === '') {
            // Show error
            parentContactError.style.display = 'block';
            
            // Highlight the parent contact fields to draw attention
            fatherContact.parentElement.style.borderLeft = '4px solid var(--error-color)';
            motherContact.parentElement.style.borderLeft = '4px solid var(--error-color)';
            
            // Scroll to the error
            fatherContact.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return; // Prevent submission
        } else {
            // Hide error and reset styles
            parentContactError.style.display = 'none';
            fatherContact.parentElement.style.borderLeft = '';
            motherContact.parentElement.style.borderLeft = '';
        }

        // Prepare data to send
        const submitBtn = form.querySelector('.btn-submit');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        const formData = {
            studentName: document.getElementById('studentName').value.trim(),
            department: document.getElementById('department').value.trim(),
            section: document.getElementById('section').value.trim(),
            studentContact: document.getElementById('studentContact').value.trim(),
            fatherContact: fatherVal,
            motherContact: motherVal,
            bloombyteOption: document.querySelector('input[name="bloombyteOption"]:checked').value
        };

        fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // Show success message
            successMessage.style.display = 'block';
            successMessage.textContent = 'Registration submitted successfully!';
            successMessage.style.color = 'var(--success-color)';
            
            // Reset form
            setTimeout(() => {
                form.reset();
                successMessage.style.display = 'none';
            }, 3000);
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            successMessage.style.display = 'block';
            successMessage.style.color = 'var(--error-color)';
            successMessage.textContent = 'Error submitting registration. Please try again.';
        })
        .finally(() => {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    });

    // Remove error highlights when the user starts typing in parent contact fields
    const removeErrorHighlight = () => {
        parentContactError.style.display = 'none';
        fatherContact.parentElement.style.borderLeft = '';
        motherContact.parentElement.style.borderLeft = '';
    };

    fatherContact.addEventListener('input', removeErrorHighlight);
    motherContact.addEventListener('input', removeErrorHighlight);

    // Handle Clear Button
    clearBtn.addEventListener('click', () => {
        form.reset();
        removeErrorHighlight();
        successMessage.style.display = 'none';
        
        // Remove focus styling if any inputs were active
        document.activeElement.blur();
    });
});
