document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('adminPassword');
    const authSection = document.getElementById('authSection');
    const tableSection = document.getElementById('tableSection');
    const authError = document.getElementById('authError');
    const responsesBody = document.getElementById('responsesBody');
    const emptyState = document.getElementById('emptyState');
    const totalCount = document.getElementById('totalCount');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');

    let currentPassword = '';
    let allData = [];

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
            allData = data;

            // Authentication successful
            authSection.style.display = 'none';
            tableSection.style.display = 'block';

            // Update total count
            if (totalCount) {
                totalCount.textContent = `Total Responses: ${data.length}`;
            }

            if (data.length === 0) {
                emptyState.style.display = 'block';
                responsesBody.innerHTML = '';
                return;
            }

            emptyState.style.display = 'none';
            responsesBody.innerHTML = '';
            data.forEach((item, index) => {
                const tr = document.createElement('tr');

                // Fix date parsing for cross-browser compatibility
                const dateStr = item.created_at ? item.created_at.replace(' ', 'T') : '';
                const date = dateStr ? new Date(dateStr).toLocaleString() : 'N/A';

                tr.innerHTML = `
                    <td>${index + 1}</td>
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
        currentPassword = password;
        authError.style.display = 'none';
        fetchResponses(password);
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (currentPassword) fetchResponses(currentPassword);
        });
    }

    // Export to CSV
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!allData.length) return;

            const headers = ['No', 'Date', 'Student Name', 'Department', 'Section', 'Student Contact', 'Father Contact', 'Mother Contact', 'Bloombyte'];
            const rows = allData.map((item, i) => {
                const dateStr = item.created_at ? item.created_at.replace(' ', 'T') : '';
                const date = dateStr ? new Date(dateStr).toLocaleString() : 'N/A';
                return [
                    i + 1,
                    date,
                    item.student_name || '',
                    item.department || '',
                    item.section || '',
                    item.student_contact || '',
                    item.father_contact || '',
                    item.mother_contact || '',
                    item.bloombyte_option || ''
                ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
            });

            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `student_responses_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Helper function to prevent XSS
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>'"]/g,
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
