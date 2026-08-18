document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('adminPassword');
    const authSection = document.getElementById('authSection');
    const tableSection = document.getElementById('tableSection');
    const authError = document.getElementById('authError');
    const responsesBody = document.getElementById('responsesBody');
    const emptyState = document.getElementById('emptyState');

    const fetchResponses = async (password) => {
        try {
            const response = await fetch('/api/responses', {
                headers: {
                    'Authorization': password
                }
            });

            if (response.status === 401) {
                authError.textContent = 'Incorrect password.';
                authError.style.display = 'block';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            
            // Authentication successful
            authSection.style.display = 'none';
            tableSection.style.display = 'block';

            if (data.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            responsesBody.innerHTML = '';
            data.forEach(item => {
                const tr = document.createElement('tr');
                const date = new Date(item.created_at).toLocaleString();
                
                tr.innerHTML = `
                    <td>${date}</td>
                    <td><strong>${escapeHTML(item.student_name)}</strong></td>
                    <td>${escapeHTML(item.department)}</td>
                    <td>${escapeHTML(item.section)}</td>
                    <td>${escapeHTML(item.student_contact)}</td>
                    <td>${escapeHTML(item.father_contact || '-')}</td>
                    <td>${escapeHTML(item.mother_contact || '-')}</td>
                    <td>${escapeHTML(item.bloombyte_option)}</td>
                `;
                responsesBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error:', error);
            authError.textContent = 'Error fetching data. Ensure server is running.';
            authError.style.display = 'block';
        }
    };

    loginBtn.addEventListener('click', () => {
        const password = passwordInput.value.trim();
        if (!password) return;
        authError.style.display = 'none';
        fetchResponses(password);
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    // Helper function to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }
});
