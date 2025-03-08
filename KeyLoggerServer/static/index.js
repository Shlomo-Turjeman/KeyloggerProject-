// Global Variables
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let machines = {};
let currentMachineId = null;
let activityData = null;
let activityChart = null;
let autoRefreshInterval = null;
let screenshotPollingInterval = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Initialize DOM elements
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const refreshDataBtn = document.getElementById('refresh-data');
    const refreshTableBtn = document.getElementById('refresh-table');
    const activityModal = document.getElementById('activity-modal');
    const modalClose = document.querySelector('.modal-close');
    const activityTabs = document.querySelectorAll('.activity-tab');
    const applyDateFilterBtn = document.getElementById('apply-date-filter');
    const takeScreenshotBtn = document.getElementById('take-screenshot');
    const stopListeningBtn = document.getElementById('stop-listening');
    const logoutBtn = document.getElementById('logout');
    const downloadLogsBtn = document.getElementById('download-logs');
    const globalSearch = document.getElementById('global-search');
    const exportDataBtn = document.getElementById('export-data');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const refreshScreenshotBtn = document.getElementById('refresh-screenshot');

    // Set today and a week ago as default dates
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    startDateInput.value = weekAgo.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    // Initialize event listeners
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            content.classList.toggle('full-width');
        });
    }

    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', refreshData);
    }

    if (refreshTableBtn) {
        refreshTableBtn.addEventListener('click', refreshData);
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeActivityModal);
    }

    activityTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchActivityTab(tabId);
        });
    });

    if (applyDateFilterBtn) {
        applyDateFilterBtn.addEventListener('click', applyDateFilter);
    }

    if (takeScreenshotBtn) {
        takeScreenshotBtn.addEventListener('click', () => {
            if (currentMachineId) {
                requestScreenshot(currentMachineId);
            }
        });
    }

    if (refreshScreenshotBtn) {
        refreshScreenshotBtn.addEventListener('click', () => {
            if (currentMachineId) {
                requestScreenshot(currentMachineId);
            }
        });
    }

    if (stopListeningBtn) {
        stopListeningBtn.addEventListener('click', () => {
            if (currentMachineId) {
                confirmShutdown(currentMachineId);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (downloadLogsBtn) {
        downloadLogsBtn.addEventListener('click', () => {
            if (currentMachineId) {
                downloadMachineLogs(currentMachineId);
            }
        });
    }

    if (globalSearch) {
        globalSearch.addEventListener('input', filterMachines);
    }

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportMachinesData);
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderMachinesTable();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderMachinesTable();
            }
        });
    }

    // Initialize the app
    refreshData();
    setupAutoRefresh();

    // Close modal when clicking outside
    activityModal.addEventListener('click', (e) => {
        if (e.target === activityModal) {
            closeActivityModal();
        }
    });

    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activityModal.classList.contains('active')) {
            closeActivityModal();
        }
    });
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp * 1000; // convert to milliseconds
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

function showNotification(type, title, message, duration = 5000) {
    const notificationContainer = document.getElementById('notifications-container');
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('closing');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('closing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

async function getCookie(name) {
    const cookies = document.cookie.split('; ').map(cookie => cookie.split('='));
    for (let [key, value] of cookies) {
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

function handleTokenError(errorMsg) {
    console.error("Token error:", errorMsg);
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
}

// API Functions
async function fetchMachines() {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        const response = await fetch("/api/machines", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenError(`HTTP error! Status: ${response.status}`);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching machines:", error);
        showNotification('error', 'Failed to load machines', 'There was an error loading the machine list. Please try again.');
        return null;
    }
}

async function fetchActivityData(machineId, startDate, endDate) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/keystrokes/${machineId}?start_date=${startDate}&end_date=${endDate}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        hideLoading();
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenError(`HTTP error! Status: ${response.status}`);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }
        
        return data;
    } catch (error) {
        hideLoading();
        console.error("Error fetching activity data:", error);
        showNotification('error', 'Failed to load activity data', 'There was an error loading the activity data. Please try again.');
        return null;
    }
}

async function shutdownMachine(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        showLoading();
        
        const response = await fetch(`/api/shutdown/${machineId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            hideLoading();
            if (response.status === 401 || response.status === 403) {
                handleTokenError(`HTTP error! Status: ${response.status}`);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.msg === "Token has expired") {
            hideLoading();
            handleTokenError("Token has expired");
            return;
        }

        if (data.status === "success") {
            // Check for machine status periodically
            let shutdownCheckInterval = setInterval(async () => {
                const machinesData = await fetchMachines();
                
                if (!machinesData || 
                    !machinesData[machineId] || 
                    (machinesData[machineId] && !machinesData[machineId].active)) {
                    
                    clearInterval(shutdownCheckInterval);
                    hideLoading();
                    
                    machines = machinesData || {};
                    updateMachineStatus(machineId);
                    updateUI();
                    
                    showNotification('success', 'Machine Shutdown', `Machine ${machineId} has been successfully shut down.`);
                }
            }, 2000);
            
            // Safety timeout after 30 seconds
            setTimeout(() => {
                if (shutdownCheckInterval) {
                    clearInterval(shutdownCheckInterval);
                    hideLoading();
                    refreshData();
                    showNotification('warning', 'Shutdown Status Unknown', `Unable to confirm shutdown status of machine ${machineId}. Please check the machine list.`);
                }
            }, 30000);
        } else {
            hideLoading();
            showNotification('error', 'Shutdown Failed', `Failed to shutdown machine ${machineId}.`);
        }

        return data;
    } catch (error) {
        hideLoading();
        console.error("Error shutting down machine:", error);
        showNotification('error', 'Shutdown Error', `An error occurred while trying to shutdown machine ${machineId}.`);
        return null;
    }
}

async function requestScreenshot(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return null;
    }

    try {
        showScreenshotLoading(true);

        const response = await fetch(`/api/take_screenshot/${machineId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            showScreenshotLoading(false);
            showScreenshotMessage("Failed to request screenshot");
            if (response.status === 401 || response.status === 403) {
                handleTokenError(`HTTP error! Status: ${response.status}`);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.msg === "Token has expired") {
            showScreenshotLoading(false);
            handleTokenError("Token has expired");
            return null;
        }

        if (data.status === "request sent") {
            // Start polling for the screenshot
            startScreenshotPolling(machineId, data.id);
            return data.id;
        } else {
            showScreenshotLoading(false);
            showScreenshotMessage("Failed to request screenshot");
            return null;
        }
    } catch (error) {
        showScreenshotLoading(false);
        showScreenshotMessage("Error requesting screenshot");
        console.error("Error requesting screenshot:", error);
        return null;
    }
}

function startScreenshotPolling(machineId, screenshotId) {
    clearInterval(screenshotPollingInterval);
    
    let checkCount = 0;
    const maxChecks = 60;
    
    screenshotPollingInterval = setInterval(() => {
        checkCount++;
        
        fetch(`/api/screenshots/${machineId}/${screenshotId}?check=true`)
            .then(response => {
                if (response.ok) {
                    clearInterval(screenshotPollingInterval);
                    loadScreenshot(machineId, screenshotId);
                    return true;
                }
                return false;
            })
            .catch(() => {
                if (checkCount >= maxChecks) {
                    clearInterval(screenshotPollingInterval);
                    showScreenshotLoading(false);
                    showScreenshotMessage("Screenshot not received");
                }
            });
        
        if (checkCount >= maxChecks) {
            clearInterval(screenshotPollingInterval);
            showScreenshotLoading(false);
            showScreenshotMessage("Screenshot not received");
        }
    }, 1000);
}

function loadScreenshot(machineId, screenshotId) {
    const imgElement = document.getElementById("screenshot-img");
    
    imgElement.onload = function() {
        showScreenshotLoading(false);
        imgElement.style.display = "block";
        document.getElementById("screenshot-placeholder").style.display = "none";
    };
    
    imgElement.onerror = function() {
        imgElement.style.display = "none";
        showScreenshotLoading(false);
        showScreenshotMessage("Error loading screenshot");
    };
    
    const timestamp = new Date().getTime();
    imgElement.src = `/api/screenshots/${machineId}/${screenshotId}?t=${timestamp}`;
}

function showScreenshotLoading(show) {
    const loadingElement = document.getElementById("screenshot-loading");
    const placeholderElement = document.getElementById("screenshot-placeholder");
    const imageElement = document.getElementById("screenshot-img");
    
    if (show) {
        loadingElement.style.display = "flex";
        placeholderElement.style.display = "none";
        imageElement.style.display = "none";
    } else {
        loadingElement.style.display = "none";
    }
}

function showScreenshotMessage(message) {
    const placeholderElement = document.getElementById("screenshot-placeholder");
    placeholderElement.textContent = message;
    placeholderElement.style.display = "block";
    document.getElementById("screenshot-img").style.display = "none";
}

// UI Functions
function updateDashboardStats() {
    // Count all machines
    const totalMachines = Object.keys(machines).length;
    document.getElementById('total-machines').textContent = totalMachines;
    
    // Count active machines
    const activeMachines = Object.values(machines).filter(machine => machine.active).length;
    document.getElementById('active-machines').textContent = activeMachines;
    document.getElementById('active-machines-count').textContent = activeMachines;
    
    // For other stats - we'll use placeholder values or calculate from data
    let totalKeystrokes = 0;
    let totalScreenshots = 0;
    
    // In a real implementation, these would be fetched from the server
    document.getElementById('total-keystrokes').textContent = totalKeystrokes.toLocaleString();
    document.getElementById('total-screenshots').textContent = totalScreenshots.toLocaleString();
    document.getElementById('total-data-count').textContent = '1.2 MB'; // Placeholder
}

function renderMachinesTable() {
    const machinesTableBody = document.getElementById('machines-table-body');
    const machinesArray = Object.entries(machines);
    totalPages = Math.ceil(machinesArray.length / itemsPerPage);
    
    // Update pagination info
    document.getElementById('pagination-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
    
    // Update table info
    document.getElementById('table-info').textContent = `Showing ${machinesArray.length} machines`;
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, machinesArray.length);
    
    // Clear existing table content
    machinesTableBody.innerHTML = '';
    
    // Check if there are any machines
    if (machinesArray.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="6" class="text-center">No machines found</td>`;
        machinesTableBody.appendChild(emptyRow);
        return;
    }
    
    // Render machines for current page
    for (let i = startIndex; i < endIndex; i++) {
        const [id, machine] = machinesArray[i];
        const row = document.createElement('tr');
        row.setAttribute('data-id', id);
        
        const lastActivity = machine.active ? 'Active now' : 'Offline';
        
        row.innerHTML = `
            <td>${id}</td>
            <td>${machine.name}</td>
            <td>${machine.ip}</td>
            <td>${lastActivity}</td>
            <td>
                <span class="status ${machine.active ? 'active' : 'inactive'}">
                    <span class="status-dot ${machine.active ? 'active' : 'inactive'}"></span>
                    ${machine.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline view-activity" data-id="${id}">
                    <i class="fas fa-eye"></i> View
                </button>
                ${machine.active ? `
                <button class="btn btn-sm btn-danger shutdown-machine" data-id="${id}">
                    <i class="fas fa-power-off"></i>
                </button>
                ` : `
                <button class="btn btn-sm btn-outline delete-machine" data-id="${id}">
                    <i class="fas fa-trash"></i>
                </button>
                `}
            </td>
        `;
        
        machinesTableBody.appendChild(row);
    }
    
    // Add event listeners to action buttons
    const viewButtons = document.querySelectorAll('.view-activity');
    const shutdownButtons = document.querySelectorAll('.shutdown-machine');
    const deleteButtons = document.querySelectorAll('.delete-machine');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const machineId = e.currentTarget.getAttribute('data-id');
            openActivityModal(machineId);
        });
    });
    
    shutdownButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const machineId = e.currentTarget.getAttribute('data-id');
            confirmShutdown(machineId);
            e.stopPropagation();
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const machineId = e.currentTarget.getAttribute('data-id');
            confirmDeleteMachine(machineId);
            e.stopPropagation();
        });
    });
    
    // Make entire row clickable to view activity
    const rows = machinesTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const machineId = row.getAttribute('data-id');
                if (machineId) {
                    openActivityModal(machineId);
                }
            }
        });
    });
}

function filterMachines() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase();
    
    if (!searchTerm) {
        renderMachinesTable();
        return;
    }
    
    const filteredMachines = {};
    
    Object.entries(machines).forEach(([id, machine]) => {
        if (id.toString().includes(searchTerm) || 
            machine.name.toLowerCase().includes(searchTerm) || 
            machine.ip.toLowerCase().includes(searchTerm)) {
            filteredMachines[id] = machine;
        }
    });
    
    const machinesTableBody = document.getElementById('machines-table-body');
    machinesTableBody.innerHTML = '';
    
    if (Object.keys(filteredMachines).length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="6" class="text-center">No matching machines found</td>`;
        machinesTableBody.appendChild(emptyRow);
        return;
    }
    
    Object.entries(filteredMachines).forEach(([id, machine]) => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', id);
        
        const lastActivity = machine.active ? 'Active now' : 'Offline';
        
        row.innerHTML = `
            <td>${id}</td>
            <td>${machine.name}</td>
            <td>${machine.ip}</td>
            <td>${lastActivity}</td>
            <td>
                <span class="status ${machine.active ? 'active' : 'inactive'}">
                    <span class="status-dot ${machine.active ? 'active' : 'inactive'}"></span>
                    ${machine.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline view-activity" data-id="${id}">
                    <i class="fas fa-eye"></i> View
                </button>
                ${machine.active ? `
                <button class="btn btn-sm btn-danger shutdown-machine" data-id="${id}">
                    <i class="fas fa-power-off"></i>
                </button>
                ` : `
                <button class="btn btn-sm btn-outline delete-machine" data-id="${id}">
                    <i class="fas fa-trash"></i>
                </button>
                `}
            </td>
        `;
        
        machinesTableBody.appendChild(row);
    });
    
    // Re-add event listeners
    const viewButtons = document.querySelectorAll('.view-activity');
    const shutdownButtons = document.querySelectorAll('.shutdown-machine');
    const deleteButtons = document.querySelectorAll('.delete-machine');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const machineId = e.currentTarget.getAttribute('data-id');
            openActivityModal(machineId);
        });
    });
    
    shutdownButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const machineId = e.currentTarget.getAttribute('data-id');
            confirmShutdown(machineId);
            e.stopPropagation();
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const machineId = e.currentTarget.getAttribute('data-id');
            confirmDeleteMachine(machineId);
            e.stopPropagation();
        });
    });
    
    // Make entire row clickable
    const rows = machinesTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const machineId = row.getAttribute('data-id');
                if (machineId) {
                    openActivityModal(machineId);
                }
            }
        });
    });
}

async function openActivityModal(machineId) {
    currentMachineId = machineId;
    
    // Update machine info
    updateMachineInfo(machineId);
    
    // Show modal
    document.getElementById('activity-modal').classList.add('active');
    
    // Load activity data
    await loadActivityData(machineId);
    
    // Load screenshot if machine is active
    if (machines[machineId] && machines[machineId].active) {
        requestScreenshot(machineId);
    } else {
        showScreenshotMessage("Machine is inactive");
    }
}

function closeActivityModal() {
    document.getElementById('activity-modal').classList.remove('active');
    clearInterval(screenshotPollingInterval);
    currentMachineId = null;
}

function updateMachineInfo(machineId) {
    const machine = machines[machineId];
    
    if (!machine) {
        console.error(`Machine with ID ${machineId} not found`);
        return;
    }
    
    document.getElementById('machine-id').textContent = machineId;
    document.getElementById('machine-name').textContent = machine.name;
    document.getElementById('machine-ip').textContent = machine.ip;
    
    const statusElement = document.getElementById('machine-status');
    statusElement.innerHTML = `
        <span class="status ${machine.active ? 'active' : 'inactive'}">
            <span class="status-dot ${machine.active ? 'active' : 'inactive'}"></span>
            ${machine.active ? 'Active' : 'Inactive'}
        </span>
    `;
    
    // Update buttons visibility based on machine status
    document.getElementById('take-screenshot').disabled = !machine.active;
    document.getElementById('stop-listening').disabled = !machine.active;
    document.getElementById('stop-listening').style.display = machine.active ? 'block' : 'none';
}

function updateMachineStatus(machineId) {
    if (currentMachineId === machineId) {
        updateMachineInfo(machineId);
    }
}

async function loadActivityData(machineId) {
    const startDate = formatDate(document.getElementById('start-date').value);
    const endDate = formatDate(document.getElementById('end-date').value);
    
    const data = await fetchActivityData(machineId, startDate, endDate);
    
    if (!data) {
        console.error('Failed to load activity data');
        document.getElementById('activity-table-body').innerHTML = `
            <tr><td colspan="3" class="text-center">Failed to load activity data</td></tr>
        `;
        document.getElementById('activity-timeline').innerHTML = `
            <div class="text-center">Failed to load activity data</div>
        `;
        return;
    }
    
    activityData = data;
    
    renderActivityTable(data);
    renderActivityTimeline(data);
    renderActivityChart(data);
}

function renderActivityTable(data) {
    const activityTableBody = document.getElementById('activity-table-body');
    activityTableBody.innerHTML = '';
    
    if (!data || !data.logs || Object.keys(data.logs).length === 0) {
        activityTableBody.innerHTML = `
            <tr><td colspan="3" class="text-center">No activity data available</td></tr>
        `;
        return;
    }
    
    // Flatten the nested structure for table view
    const flattenedData = [];
    
    Object.entries(data.logs).forEach(([window, entries]) => {
        Object.entries(entries).forEach(([time, text]) => {
            flattenedData.push({ time, window, text });
        });
    });
    
    // Sort by time (newest first)
    flattenedData.sort((a, b) => {
        return new Date(b.time.replace(' - ', ' ')) - new Date(a.time.replace(' - ', ' '));
    });
    
    // Render table rows
    flattenedData.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.time}</td>
            <td>${entry.window}</td>
            <td>${entry.text}</td>
        `;
        activityTableBody.appendChild(row);
    });
}

function renderActivityTimeline(data) {
    const activityTimeline = document.getElementById('activity-timeline');
    activityTimeline.innerHTML = '';
    
    if (!data || !data.logs || Object.keys(data.logs).length === 0) {
        activityTimeline.innerHTML = `
            <div class="text-center">No activity data available</div>
        `;
        return;
    }
    
    // Flatten and sort data for timeline
    const flattenedData = [];

    Object.entries(data.logs).forEach(([window, entries]) => {
        Object.entries(entries).forEach(([time, text]) => {
            flattenedData.push({ time, window, text });
        });
    });

    // Sort by time (oldest first for timeline view)
    flattenedData.sort((a, b) => {
        return new Date(a.time.replace(' - ', ' ')) - new Date(b.time.replace(' - ', ' '));
    });

    // Render timeline items
    flattenedData.forEach(entry => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';

        timelineItem.innerHTML = `
            <div class="timeline-icon"></div>
            <div class="timeline-content">
                <div class="timeline-time">${entry.time}</div>
                <div class="timeline-app">${entry.window}</div>
                <div class="timeline-text">${entry.text}</div>
            </div>
        `;

        activityTimeline.appendChild(timelineItem);
    });
}

function renderActivityChart(data) {
    const chartCanvas = document.getElementById('activity-chart');

    if (!data || !data.info || !data.info.dates) {
        document.getElementById('activity-chart-view').innerHTML = `
            <div class="text-center">No chart data available</div>
        `;
        return;
    }

    // Prepare data for chart
    const dates = Object.keys(data.info.dates);
    const counts = Object.values(data.info.dates);

    // Destroy previous chart if exists
    if (activityChart) {
        activityChart.destroy();
    }

    // Create new chart
    activityChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Keystrokes Logged',
                data: counts,
                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });

    // Update stats
    const totalKeystrokes = counts.reduce((a, b) => a + b, 0);
    document.getElementById('stats-keystrokes').textContent = totalKeystrokes;

    // Find most active window
    let windowCounts = {};
    if (data.logs) {
        Object.entries(data.logs).forEach(([window, entries]) => {
            windowCounts[window] = Object.keys(entries).length;
        });

        let mostActiveWindow = Object.entries(windowCounts).sort((a, b) => b[1] - a[1])[0];
        if (mostActiveWindow) {
            document.getElementById('stats-active-window').textContent = mostActiveWindow[0];
        }
    }

    // Determine peak activity time (just a placeholder logic - this would be more sophisticated in a real app)
    let maxCount = Math.max(...counts);
    let peakDateIndex = counts.indexOf(maxCount);
    if (peakDateIndex >= 0) {
        document.getElementById('stats-peak-time').textContent = dates[peakDateIndex];
    }
}

function switchActivityTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.activity-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.activity-tab[data-tab="${tabId}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`activity-${tabId}-view`).style.display = 'block';

    // Refresh chart if switching to chart tab
    if (tabId === 'chart' && activityChart) {
        activityChart.update();
    }
}

function applyDateFilter() {
    if (currentMachineId) {
        loadActivityData(currentMachineId);
    }
}

function confirmShutdown(machineId) {
    if (confirm(`Are you sure you want to shutdown machine ${machineId}?`)) {
        shutdownMachine(machineId);
    }
}

async function confirmDeleteMachine(machineId) {
    if (confirm(`Are you sure you want to delete machine ${machineId}? This action cannot be undone.`)) {
        await deleteMachine(machineId);
    }
}

async function deleteMachine(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        showLoading();

        const response = await fetch(`/api/machine/${machineId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        hideLoading();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenError(`HTTP error! Status: ${response.status}`);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }

        if (data.status === "success") {
            refreshData();
            showNotification('success', 'Machine Deleted', `Machine ${machineId} has been successfully deleted.`);
        } else {
            showNotification('error', 'Delete Failed', `Failed to delete machine ${machineId}.`);
        }

        return data;
    } catch (error) {
        hideLoading();
        console.error("Error deleting machine:", error);
        showNotification('error', 'Delete Error', `An error occurred while trying to delete machine ${machineId}.`);
        return null;
    }
}

function downloadMachineLogs(machineId) {
    // This is a placeholder function for now
    // In a real app, you would make an API call to get the logs in a downloadable format
    showNotification('info', 'Feature Not Available', 'Log download functionality is not implemented yet.');
}

function exportMachinesData() {
    // Convert machines data to CSV
    const headers = ['ID', 'Name', 'IP Address', 'Status'];
    let csvContent = headers.join(',') + '\n';

    Object.entries(machines).forEach(([id, machine]) => {
        const row = [
            id,
            machine.name,
            machine.ip,
            machine.active ? 'Active' : 'Inactive'
        ];
        csvContent += row.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `machines_export_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
}

function logout() {
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
}

async function refreshData() {
    showLoading();
    const fetchedMachines = await fetchMachines();
    hideLoading();

    if (fetchedMachines) {
        machines = fetchedMachines;
        updateUI();
    }
}

function updateUI() {
    updateDashboardStats();
    renderMachinesTable();
}

function setupAutoRefresh() {
    // Clear existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }

    // Set up new interval - refresh every 30 seconds
    autoRefreshInterval = setInterval(refreshData, 30000);
}