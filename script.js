// Replace this with your published Google Sheet URL
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTdCEITkfwzIcw2kbwqymTWq6bmVqdTRQWtTOHxaPqn8k1vPngwp1J3Ek29_5iIVoVZuWAzynjyH2he/pub?output=csv';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Function to show loading spinner
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
}

// Function to hide loading spinner
function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('d-none');
}

// Function to fetch data from Google Sheet
async function fetchSheetData() {
    showLoading();
    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(SHEET_URL));
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const csvData = await response.text();
        processData(csvData);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.querySelector('#completedProjects').innerHTML = `
            <div class="list-group-item text-center text-danger">
                Error loading data. Please check the console for details.
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Function to update statistics
function updateStats(rows) {
    const totalTasks = rows.length;
    const completedTasks = rows.filter(row => row[1].toLowerCase() === 'completed').length;
    const inProgressTasks = rows.filter(row => row[1].toLowerCase() === 'in progress').length;
    const pendingTasks = rows.filter(row => row[1].toLowerCase() === 'pending').length;

    // Update stats in the new order: In Progress, Pending, Completed
    document.getElementById('inProgressTasks').textContent = inProgressTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('totalTasks').textContent = totalTasks;
    
    // Update count badges
    const completedCountBadge = document.getElementById('completedCount');
    const pendingCountBadge = document.getElementById('pendingCount');
    if (completedCountBadge) {
        completedCountBadge.textContent = completedTasks;
    }
    if (pendingCountBadge) {
        pendingCountBadge.textContent = pendingTasks;
    }
}

// Function to animate progress bar
function animateProgressBar(progressBar, targetWidth, duration = 1000) {
    const startWidth = 0;
    const startTime = performance.now();
    
    function updateProgress(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentWidth = startWidth + (targetWidth - startWidth) * easeProgress;
        progressBar.style.width = `${currentWidth}%`;
        progressBar.textContent = `${Math.round(currentWidth)}%`;
        
        if (progress < 1) {
            requestAnimationFrame(updateProgress);
        }
    }
    
    requestAnimationFrame(updateProgress);
}

// Function to create project card
function createProjectCard(row) {
    const status = row[1].toLowerCase();
    const isCompleted = status === 'completed';
    const isPending = status === 'pending';
    
    let card;
    if (isCompleted) {
        // Create a simple list item for completed projects
        card = document.createElement('div');
        card.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Left side: Project title and owner
        const leftContent = document.createElement('div');
        leftContent.className = 'd-flex align-items-center';
        
        const title = document.createElement('span');
        title.className = 'me-3';
        title.textContent = row[0];
        
        const owner = document.createElement('small');
        owner.className = 'text-muted';
        owner.innerHTML = `<i class="fas fa-user me-1"></i>${row[5] || 'Unassigned'}`;
        
        leftContent.appendChild(title);
        leftContent.appendChild(owner);
        
        // Right side: Start date and status badge
        const rightContent = document.createElement('div');
        rightContent.className = 'd-flex align-items-center';
        
        const startDate = document.createElement('small');
        startDate.className = 'text-muted me-3';
        startDate.innerHTML = `<i class="fas fa-calendar-check me-1"></i>${row[3]}`;
        
        const badge = document.createElement('span');
        badge.className = 'badge bg-secondary';
        badge.innerHTML = `<i class="fas fa-check-circle me-1"></i>${row[2]}%`;
        
        rightContent.appendChild(startDate);
        rightContent.appendChild(badge);
        
        card.appendChild(leftContent);
        card.appendChild(rightContent);
    } else if (isPending) {
        // Create a compact card for pending projects
        card = document.createElement('div');
        card.className = 'list-group-item pending-card';
        
        // Project title and owner
        const titleContainer = document.createElement('div');
        titleContainer.className = 'd-flex justify-content-between align-items-center mb-2';
        
        const title = document.createElement('div');
        title.className = 'project-title';
        title.textContent = row[0];
        
        const owner = document.createElement('div');
        owner.className = 'project-owner';
        owner.innerHTML = `<i class="fas fa-user me-1"></i>${row[5] || 'Unassigned'}`;
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(owner);
        card.appendChild(titleContainer);
        
        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'mb-2';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress';
        
        const progressInner = document.createElement('div');
        progressInner.className = 'progress-bar progress-bar-striped progress-bar-animated';
        progressInner.style.width = '0%';
        progressInner.textContent = '0%';
        progressInner.style.backgroundColor = '#ffc107'; // Yellow for pending
        
        progressBar.appendChild(progressInner);
        progressContainer.appendChild(progressBar);
        card.appendChild(progressContainer);
        
        // Start date
        const startDate = document.createElement('div');
        startDate.className = 'text-muted small';
        startDate.innerHTML = `<i class="fas fa-calendar-check me-1"></i>Started: ${row[3]}`;
        card.appendChild(startDate);
        
        // Animate progress bar after a short delay
        setTimeout(() => {
            animateProgressBar(progressInner, row[2]);
        }, 100);
    } else {
        // Create a full card for in-progress projects
        card = document.createElement('div');
        card.className = 'list-group-item';
        
        // Project title and owner
        const titleContainer = document.createElement('div');
        titleContainer.className = 'd-flex justify-content-between align-items-center mb-2';
        
        const title = document.createElement('div');
        title.className = 'project-title';
        title.textContent = row[0];
        
        const owner = document.createElement('div');
        owner.className = 'project-owner';
        owner.innerHTML = `<i class="fas fa-user me-1"></i>${row[5] || 'Unassigned'}`;
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(owner);
        card.appendChild(titleContainer);
        
        // Project description
        const description = document.createElement('div');
        description.className = 'project-description';
        description.textContent = row[4] || 'No description available';
        card.appendChild(description);
        
        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'mb-2';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress';
        
        const progressInner = document.createElement('div');
        progressInner.className = 'progress-bar progress-bar-striped progress-bar-animated';
        progressInner.style.width = '0%';
        progressInner.textContent = '0%';
        progressInner.style.backgroundColor = '#28a745'; // Green for in progress
        
        progressBar.appendChild(progressInner);
        progressContainer.appendChild(progressBar);
        card.appendChild(progressContainer);
        
        // Start date
        const startDate = document.createElement('div');
        startDate.className = 'text-muted small';
        startDate.innerHTML = `<i class="fas fa-calendar-check me-1"></i>Started: ${row[3]}`;
        card.appendChild(startDate);
        
        // Animate progress bar after a short delay
        setTimeout(() => {
            animateProgressBar(progressInner, row[2]);
        }, 100);
    }
    
    // Add click event to show project details
    card.addEventListener('click', () => showProjectDetails(row));
    
    return card;
}

// Function to show project details in modal
function showProjectDetails(row) {
    const modal = new bootstrap.Modal(document.getElementById('projectDetailsModal'));
    
    // Update modal content
    document.getElementById('modalProjectTitle').textContent = row[0];
    document.getElementById('modalProjectOwner').textContent = row[5] || 'Unassigned';
    document.getElementById('modalProjectStartDate').textContent = row[3];
    document.getElementById('modalProjectDescription').textContent = row[4] || 'No description available';
    
    // Set progress bar
    const progressBar = document.getElementById('modalProjectProgress');
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    
    // Set status badge
    const status = row[1].toLowerCase();
    const statusBadge = document.getElementById('modalProjectStatus');
    statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    
    // Set status badge color
    if (status === 'completed') {
        statusBadge.className = 'badge bg-secondary';
        progressBar.style.backgroundColor = '#6c757d';
    } else if (status === 'in progress') {
        statusBadge.className = 'badge bg-success';
        progressBar.style.backgroundColor = '#28a745';
    } else if (status === 'pending') {
        statusBadge.className = 'badge bg-warning';
        progressBar.style.backgroundColor = '#ffc107';
    }
    
    // Show the modal
    modal.show();
    
    // Animate progress bar after modal is shown
    setTimeout(() => {
        animateProgressBar(progressBar, row[2]);
    }, 300);
}

// Function to parse CSV string properly
function parseCSV(csvString) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    let i = 0;

    while (i < csvString.length) {
        const char = csvString[i];

        if (char === '"') {
            // Handle escaped quotes (double quotes)
            if (csvString[i + 1] === '"') {
                currentField += '"';
                i += 2;
                continue;
            }
            // Toggle quote state
            insideQuotes = !insideQuotes;
            i++;
            continue;
        }

        if (char === ',' && !insideQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
            i++;
            continue;
        }

        if (char === '\n' && !insideQuotes) {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
            i++;
            continue;
        }

        currentField += char;
        i++;
    }

    // Push the last field and row if they exist
    if (currentField) {
        currentRow.push(currentField.trim());
    }
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}

// Function to process the data
function processData(csvData) {
    try {
        // Parse CSV data using the new parser
        const rows = parseCSV(csvData);
        
        // Remove header row if it exists
        const dataRows = rows.slice(1);
        
        // Update statistics
        updateStats(dataRows);
        
        // Clear existing content
        document.getElementById('completedProjects').innerHTML = '';
        document.getElementById('inProgressProjects').innerHTML = '';
        document.getElementById('pendingProjects').innerHTML = '';
        
        // Group and display projects by status
        dataRows.forEach(row => {
            if (row.length >= 4) {
                const status = row[1].toLowerCase();
                const projectCard = createProjectCard(row);
                
                if (status === 'completed') {
                    document.getElementById('completedProjects').appendChild(projectCard);
                } else if (status === 'in progress') {
                    document.getElementById('inProgressProjects').appendChild(projectCard);
                } else if (status === 'pending') {
                    document.getElementById('pendingProjects').appendChild(projectCard);
                }
            }
        });
        
        // Check if completed projects should be hidden based on toggle state
        const toggleText = document.getElementById('toggleAllText');
        if (toggleText && toggleText.textContent === 'Show All') {
            document.getElementById('completedProjects').classList.add('d-none');
        }
        
        // Check if pending projects should be hidden based on toggle state
        const togglePendingText = document.getElementById('togglePendingText');
        if (togglePendingText && togglePendingText.textContent === 'Show All') {
            document.getElementById('pendingProjects').classList.add('d-none');
        }
    } catch (error) {
        console.error('Error processing data:', error);
        document.querySelector('#completedProjects').innerHTML = `
            <div class="list-group-item text-center text-danger">
                Error processing data. Please check the console for details.
            </div>
        `;
    }
}

// Fetch data when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchSheetData();
    
    // Add event listeners for the toggle buttons
    const toggleAllBtn = document.getElementById('toggleAllCompleted');
    const togglePendingBtn = document.getElementById('toggleAllPending');
    
    if (toggleAllBtn) {
        toggleAllBtn.addEventListener('click', toggleAllCompletedProjects);
    }
    
    if (togglePendingBtn) {
        togglePendingBtn.addEventListener('click', toggleAllPendingProjects);
    }
});

// Function to toggle all completed projects
function toggleAllCompletedProjects() {
    const completedProjectsContainer = document.getElementById('completedProjects');
    const toggleBtn = document.getElementById('toggleAllCompleted');
    const toggleText = document.getElementById('toggleAllText');
    const isCollapsed = toggleText.textContent === 'Show All';
    
    if (isCollapsed) {
        completedProjectsContainer.classList.remove('d-none');
        toggleText.textContent = 'Hide All';
        toggleBtn.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        completedProjectsContainer.classList.add('d-none');
        toggleText.textContent = 'Show All';
        toggleBtn.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

// Function to toggle all pending projects
function toggleAllPendingProjects() {
    const pendingProjectsContainer = document.getElementById('pendingProjects');
    const toggleBtn = document.getElementById('toggleAllPending');
    const toggleText = document.getElementById('togglePendingText');
    const isCollapsed = toggleText.textContent === 'Show All';
    
    if (isCollapsed) {
        pendingProjectsContainer.classList.remove('d-none');
        toggleText.textContent = 'Hide All';
        toggleBtn.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        pendingProjectsContainer.classList.add('d-none');
        toggleText.textContent = 'Show All';
        toggleBtn.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

// Refresh data every 5 minutes
setInterval(fetchSheetData, 5 * 60 * 1000); 
