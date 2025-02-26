function BackToLogin() {
    window.location.href = "/login";
}

function handleTokenError(errorMsg) {
    console.error("Token error:", errorMsg);
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    BackToLogin();
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

async function GetDemoLogs() {
    const token = await getCookie("access_token");
    console.log(token);
    
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        let response = await fetch("/api/get_demo", {
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
        
        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching demo logs:", error);
        return null;
    }
}

async function GetComputersList() {
    const token = await getCookie("access_token"); 
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        let response = await fetch("/api/machines", {
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
        
        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }
        return data;
    } catch (error) {
        console.error("Error fetching computers list:", error);
        return null;
    }
}

async function GetComputersActivity(machine_sn, start_date, end_date) {
    const token = await getCookie("access_token"); 
    if (!token) {
        handleTokenError("No token found");
        return;
    }
    
    try {
        let response = await fetch("/api/keystrokes/"+machine_sn+"?start_date=" + start_date + "&end_date=" + end_date, {
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
        
        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }
        
        return data;
    } catch (error) {
        console.error("Error fetching computer activity:", error);
        return null;
    }
}

let loadingPopups = {};
let nextPopupId = 1;

/**
 * Opens a new loading popup
 * @param {string} title Title of the popup
 * @param {string} message Message to display in the popup
 * @param {string} entityId (optional) ID of the entity the popup is related to
 * @param {string} entityIdLabel (optional) Label for the entity ID
 * @returns {number} Unique ID of the popup
 */
function openLoadingPopup(title, message, entityId = null, entityIdLabel = "ID") {
    const popupId = nextPopupId++;
    
    const popupElement = document.createElement('div');
    popupElement.className = 'loading-popup';
    popupElement.id = `loadingPopup_${popupId}`;
    popupElement.innerHTML = `
        <h3>${title}</h3>
        <div class="spinner"></div>
        <p class="loading-message">${message}</p>
        ${entityId ? `<p class="entity-id">${entityIdLabel}: <span>${entityId}</span></p>` : ''}
    `;
    
    document.body.appendChild(popupElement);
    
    popupElement.style.display = 'block';
    document.getElementById("overlay").style.display = 'block';
    
    loadingPopups[popupId] = {
        element: popupElement,
        entityId: entityId
    };
    
    return popupId;
}

/**
 * Closes a loading popup by ID
 * @param {number} popupId ID of the popup to close
 */
function closeLoadingPopup(popupId) {
    if (!loadingPopups[popupId]) return;
    
    document.body.removeChild(loadingPopups[popupId].element);
    
    delete loadingPopups[popupId];
    
    if (Object.keys(loadingPopups).length === 0 && !isPopupOpen) {
        document.getElementById("overlay").style.display = 'none';
    }
}

/**
 * Returns a popup ID by entity ID
 * @param {string} entityId Entity ID to search for
 * @returns {number|null} Popup ID or null if not found
 */
function getPopupIdByEntityId(entityId) {
    for (const [popupId, popupData] of Object.entries(loadingPopups)) {
        if (popupData.entityId === entityId) {
            return parseInt(popupId);
        }
    }
    return null;
}

async function StopListening(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        const popupId = openLoadingPopup(
            "Machine Shutdown",
            "Please wait while the machine is shutting down",
            machineId,
            "Machine ID"
        );
        
        let response = await fetch(`/api/shutdown/${machineId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            closeLoadingPopup(popupId);
            if (response.status === 401 || response.status === 403) {
                handleTokenError(`HTTP error! Status: ${response.status}`);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();
        if (data.msg === "Token has expired") {
            closeLoadingPopup(popupId);
            handleTokenError("Token has expired");
            return;
        }

        if (data.status === "success") {
            let checkStatusInterval = setInterval(async () => {
                try {
                    const machinesData = await GetComputersList();
                    
                    if (!machinesData || 
                        !machinesData[machineId] || 
                        (machinesData[machineId] && machinesData[machineId].active === false)) {
                        
                        clearInterval(checkStatusInterval);
                        closeLoadingPopup(popupId);
                        
                        let indicator = document.getElementById("indicator");
                        if (indicator) {
                            indicator.classList.remove("active");
                            indicator.title = "Logging is not active.";
                        }
                        
                        const stopButton = document.getElementById("stopListening");
                        if (stopButton) {
                            stopButton.style.display = "none";
                        }
                    }
                } catch (error) {
                    console.error("Error checking machine status:", error);
                }
            }, 2000);
            
            setTimeout(() => {
                if (checkStatusInterval) {
                    clearInterval(checkStatusInterval);
                    
                    const currentPopupId = getPopupIdByEntityId(machineId);
                    if (currentPopupId !== null) {
                        closeLoadingPopup(currentPopupId);
                    }
                }
            }, 30000);
        }

        return data;
    } catch (error) {
        // Check if there's an open popup for this machine and close it
        const currentPopupId = getPopupIdByEntityId(machineId);
        if (currentPopupId !== null) {
            closeLoadingPopup(currentPopupId);
        }
        
        console.error("Error stopping listener:", error);
        return null;
    }
}

/**
 * פונקציה חדשה - מבקשת צילום מסך מהמחשב
 * @param {string} machineId מזהה המחשב
 * @returns {Promise<string|null>} מזהה הצילום אם ההבקשה הצליחה, אחרת null
 */
async function requestScreenshot(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return null;
    }

    try {
        // מציגה אנימציית טעינה בתיבת הצילום
        showScreenshotLoading(true);

        let response = await fetch(`/api/take_screenshot/${machineId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            showScreenshotLoading(false);
            showScreenshotMessage("שגיאה בבקשת צילום המסך");
            if (response.status === 401 || response.status === 403) {
                handleTokenError(`HTTP error! Status: ${response.status}`);
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();
        if (data.msg === "Token has expired") {
            showScreenshotLoading(false);
            handleTokenError("Token has expired");
            return null;
        }

        if (data.status === "request sent") {
            // מתחיל לבדוק אם הצילום התקבל
            startScreenshotPolling(machineId, data.id);
            return data.id;
        } else {
            showScreenshotLoading(false);
            showScreenshotMessage("שגיאה בבקשת צילום המסך");
            return null;
        }
    } catch (error) {
        showScreenshotLoading(false);
        showScreenshotMessage("שגיאה בבקשת צילום המסך");
        console.error("Error requesting screenshot:", error);
        return null;
    }
}

/**
 * פונקציה חדשה - בודקת האם צילום המסך התקבל ומציגה אותו
 * @param {string} machineId מזהה המחשב
 * @param {string} screenshotId מזהה הצילום
 */
function startScreenshotPolling(machineId, screenshotId) {
    let checkCount = 0;
    const maxChecks = 20; // 20 seconds maximum wait
    
    const checkInterval = setInterval(() => {
        checkCount++;
        
        // בדיקה האם הצילום קיים
        const imgElement = document.getElementById("screenshotImage");
        imgElement.onload = function() {
            clearInterval(checkInterval);
            showScreenshotLoading(false);
            imgElement.style.display = "block";
            document.getElementById("screenshotMessage").style.display = "none";
        };
        
        imgElement.onerror = function() {
            // עדיין לא התקבל, ממשיכים לבדוק
            imgElement.style.display = "none";
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                showScreenshotLoading(false);
                showScreenshotMessage("לא התקבל צילום מסך");
            }
        };
        
        // מנסה לטעון את התמונה
        const timestamp = new Date().getTime(); // מונע cache
        imgElement.src = `/api/screenshots/${machineId}/${screenshotId}?t=${timestamp}`;
        
        // מפסיק את הבדיקה אחרי מקסימום ניסיונות
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            showScreenshotLoading(false);
            showScreenshotMessage("פג הזמן המוקצב לקבלת צילום המסך");
        }
    }, 1000);
}

/**
 * פונקציה חדשה - מציגה או מסתירה את אנימציית הטעינה של צילום המסך
 * @param {boolean} show האם להציג את אנימציית הטעינה
 */
function showScreenshotLoading(show) {
    const spinner = document.getElementById("screenshotSpinner");
    const message = document.getElementById("screenshotMessage");
    const image = document.getElementById("screenshotImage");
    
    if (show) {
        spinner.style.display = "block";
        message.style.display = "block";
        message.textContent = "מתבצע צילום מסך...";
        image.style.display = "none";
    } else {
        spinner.style.display = "none";
    }
}

/**
 * פונקציה חדשה - מציגה הודעה בתיבת צילום המסך
 * @param {string} message הודעה להצגה
 */
function showScreenshotMessage(message) {
    const messageElement = document.getElementById("screenshotMessage");
    messageElement.textContent = message;
    messageElement.style.display = "block";
    document.getElementById("screenshotImage").style.display = "none";
}

async function deleteComputer(machineId) {

    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        let response = await fetch(`/api/machine/${machineId}`, {
            method: "DELETE",
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

        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }

        if (data.status === "success") {
            fetchLogs();
        }

        return data;
    } catch (error) {
        console.error("Error deleting computer:", error);
        return null;
    }
}

let isPopupOpen = false;
let autoRefreshInterval = null;
let currentMachineId = null;
let currentStartDate = null;
let currentEndDate = null;

// Global variables for storing current sort state
let currentSortColumn = null;
let currentSortDirection = null; // 'asc' or 'desc'
let currentActivitySortColumn = null;
let currentActivitySortDirection = null;

/**
 * Creates or updates the activity chart
 * @param {Object} datesData - Object with dates as keys and activity counts as values
 */
function createActivityChart(datesData) {
    // Get the chart container and make it visible
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    // Show the chart container
    chartContainer.style.display = 'block';
    
    // Convert dates data to arrays for the chart
    const dates = Object.keys(datesData);
    const counts = Object.values(datesData);
    
    // Setup the canvas for drawing
    const canvas = document.getElementById('activityChart');
    const ctx = canvas.getContext('2d');
    
    // Clear previous chart
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set chart dimensions
    const chartWidth = canvas.width - 60; // Leave space for y-axis
    const chartHeight = canvas.height - 40; // Leave space for x-axis
    const barWidth = Math.max(Math.floor(chartWidth / (dates.length || 1)) - 10, 15);
    const maxCount = Math.max(...counts, 1); // Avoid division by zero
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.moveTo(40, 10);
    ctx.lineTo(40, 10 + chartHeight);
    ctx.lineTo(40 + chartWidth, 10 + chartHeight);
    ctx.stroke();
    
    // Draw Y-axis labels
    ctx.font = '10px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const y = 10 + chartHeight - (i * chartHeight / ySteps);
        const value = Math.round(i * maxCount / ySteps);
        ctx.fillText(value.toString(), 35, y + 3);
        
        // Draw horizontal grid lines
        ctx.beginPath();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.moveTo(40, y);
        ctx.lineTo(40 + chartWidth, y);
        ctx.stroke();
    }
    
    // Draw bars and x-axis labels
    dates.forEach((date, index) => {
        const count = counts[index];
        const x = 40 + (index * (chartWidth / dates.length)) + ((chartWidth / dates.length) - barWidth) / 2;
        const barHeight = (count / maxCount) * chartHeight;
        
        // Draw the bar
        ctx.fillStyle = count > 0 ? '#0cac2a' : '#ddd';
        ctx.fillRect(x, 10 + chartHeight - barHeight, barWidth, barHeight);
        
        // Draw outline
        ctx.beginPath();
        ctx.strokeStyle = '#0a8021';
        ctx.lineWidth = 1;
        ctx.rect(x, 10 + chartHeight - barHeight, barWidth, barHeight);
        ctx.stroke();
        
        // Draw the date label - show only day & month
        const shortDate = date.split('-').slice(0, 2).join('-');
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth/2, 10 + chartHeight + 15);
        ctx.fillText(shortDate, 0, 0);
        ctx.restore();
        
        // Draw the count above the bar if > 0
        if (count > 0) {
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText(count.toString(), x + barWidth/2, 10 + chartHeight - barHeight - 5);
        }
    });
}

async function fetchLogs() {
    const tableBody = document.getElementById("ComputersTableBody");
    
    try {
        const data = await GetComputersList();
        
        let newContent = "";
        
        if (!data || typeof data !== "object" || Object.keys(data).length === 0) { 
            newContent = "<tr><td colspan='5' class='text-center'>No available data</td></tr>";
        } else {
            Object.entries(data).forEach(([id, details]) => {
                newContent += `
                    <tr data-id="${id}">
                        <td>${id}</td>
                        <td>${details.ip}</td>
                        <td>${details.name}</td>
                        <td>
                            <div class="cell-container">
                                <span class="text">${details.active ? '✅' : '🟩'}</span>
                                ${!details.active ? `<button class="delete-button" data-id="${id}">🗑️</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        tableBody.innerHTML = newContent;
        
        addRowClickListeners();
        addDeleteButtonListeners();
        setupTableSorting("ComputersTable", [3], false); // Configure sorting after table load, exclude Active column (index 3)
        
    } catch (error) {
        console.error("Error in fetchLogs:", error);
        tableBody.innerHTML = "<tr><td colspan='5' class='text-center'>Error loading data</td></tr>";
    }
}

function addDeleteButtonListeners() {
    const deleteButtons = document.querySelectorAll(".delete-button");
    deleteButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.stopPropagation();
            const machineId = this.getAttribute("data-id");
            deleteComputer(machineId);
        });
    });
}

function formatDateToDDMMYYYY(dateStr) {
    let date = new Date(dateStr);
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

async function LoadComputerActivity(machine_sn, start_date, end_date) {
    const activityTable = document.getElementById("ActivityTable");
    
    try {
        const log = await GetComputersActivity(machine_sn, start_date, end_date);
        
        let newContent = "";
        
        if (!log) {
            newContent = "<tr><td colspan='3' class='text-center'>No available data</td></tr>";
        } else if (log.error) {
            newContent = `<tr><td colspan='3' class='text-center'>${log.error}</td></tr>`;
        } else if (typeof log !== "object" || Object.keys(log).length === 0 || !log.logs) {
            newContent = "<tr><td colspan='3' class='text-center'>No available data</td></tr>";
        } else {
            Object.entries(log.logs).forEach(([window, val]) => {
                Object.entries(val).forEach(([time, text]) => {
                    newContent += `<tr><td>${time}</td><td>${window}</td><td>${text}</td></tr>`;
                });
            });  
        }
        
        activityTable.innerHTML = newContent;
        setupTableSorting("ActivityTable", [0], true); // Configure as activity table, exclude Time column (index 0)
        
        // Create or update activity chart if data exists
        if (log && log.info && log.info.dates) {
            createActivityChart(log.info.dates);
        }
        
    } catch (error) {
        console.error("Error in LoadComputerActivity:", error);
        activityTable.innerHTML = "<tr><td colspan='3' class='text-center'>Error loading data</td></tr>";
    }
}


async function updateMachineStatus() {
    if (!currentMachineId) return;
    
    try {
        const data = await GetComputersList();
        if (!data || !data[currentMachineId]) return;
        
        const machineDetails = data[currentMachineId];
        const wasActive = document.getElementById("indicator").classList.contains("active");
        
        let indicator = document.getElementById("indicator");
        if (machineDetails.active) {
            indicator.classList.add("active");
            indicator.title = "Logging is active.";
        } else {
            indicator.classList.remove("active");
            indicator.title = "Logging is not active.";
        }
        
        const stopButton = document.getElementById("stopListening");
        if (machineDetails.active) {
            stopButton.style.display = "block";
        } else {
            stopButton.style.display = "none";
        }
        
        if (machineDetails.active && currentStartDate && currentEndDate) {
            LoadComputerActivity(currentMachineId, currentStartDate, currentEndDate);
        }
    } catch (error) {
        console.error("Error updating machine status:", error);
    }
}

const popup = document.getElementById("ComputerActivity");
const overlay = document.getElementById("overlay");
const closePopupBtn = document.getElementById("closePopup");

function closePopup() {
    popup.style.display = "none";
    overlay.style.display = "none";
    isPopupOpen = false;
    currentMachineId = null;
    currentStartDate = null;
    currentEndDate = null;
    
    // Reset activity table sort state when closing popup
    currentActivitySortColumn = null;
    currentActivitySortDirection = null;

    const stopListeningButton = document.getElementById("stopListening");
    if (stopListeningButton) {
        stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));
    }
    
    // Hide the chart container
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.style.display = 'none';
    }

    // אופס את תמונת הצילום מסך
    const screenshotImage = document.getElementById("screenshotImage");
    if (screenshotImage) {
        screenshotImage.src = "";
        screenshotImage.style.display = "none";
    }
    
    const screenshotMessage = document.getElementById("screenshotMessage");
    if (screenshotMessage) {
        screenshotMessage.textContent = "אין צילום מסך זמין";
        screenshotMessage.style.display = "block";
    }
    
    setupAutoRefresh();
}

function openPopup(machineId, ip, name, active) {
    document.getElementById("compId").textContent = machineId;
    document.getElementById("compIp").textContent = ip;
    document.getElementById("compName").textContent = name;

    currentMachineId = machineId;
    isPopupOpen = true;

    let indicator = document.getElementById("indicator");
    if (active === '✅') {
        indicator.classList.add("active");
        indicator.title = "Logging is active.";
        
        document.getElementById("stopListening").style.display = "block";
    } else {
        indicator.classList.remove("active");
        indicator.title = "Logging is not active.";
        
        document.getElementById("stopListening").style.display = "none";
    }

    popup.style.display = "block";
    overlay.style.display = "block";

    let today = new Date().toISOString().split('T')[0];
    let lasdweek = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById("startDate").value = lasdweek;
    document.getElementById("endDate").value = today;

    currentStartDate = formatDateToDDMMYYYY(lasdweek);
    currentEndDate = formatDateToDDMMYYYY(today);

    LoadComputerActivity(machineId, formatDateToDDMMYYYY(lasdweek), formatDateToDDMMYYYY(today));

    const stopListeningButton = document.getElementById("stopListening");
    stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));

    document.getElementById("stopListening").addEventListener("click", function() {
        const currentMachineId = document.getElementById("compId").textContent;
        StopListening(currentMachineId);
    });
    
    // הוספת פונקציונליות כפתור צילום מסך
    const takeScreenshotButton = document.getElementById("takeScreenshot");
    takeScreenshotButton.replaceWith(takeScreenshotButton.cloneNode(true));
    document.getElementById("takeScreenshot").addEventListener("click", function() {
        requestScreenshot(machineId);
    });
    
    // אם המחשב פעיל, בקש צילום מסך באופן אוטומטי
    if (active === '✅') {
        requestScreenshot(machineId);
    } else {
        showScreenshotMessage("המחשב לא מחובר");
    }
    
    // Add manual sorting capability to activity table
    const activityTable = document.querySelector('.activity-section table');
    if (activityTable) {
        const headers = activityTable.querySelectorAll('th');
        headers.forEach((header, index) => {
            // Skip Time column (index 0)
            if (index === 0) return;
            
            header.classList.add('sortable');
            
            // Clear previous listeners
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // Add new listener
            newHeader.addEventListener('click', (event) => {
                // Stop event propagation
                event.stopPropagation();
                
                // Reset all other headers
                headers.forEach(h => {
                    if (h !== newHeader) {
                        h.classList.remove('sort-asc', 'sort-desc');
                    }
                });
                
                // Set sort direction
                let asc = true;
                if (newHeader.classList.contains('sort-asc')) {
                    newHeader.classList.remove('sort-asc');
                    newHeader.classList.add('sort-desc');
                    asc = false;
                } else if (newHeader.classList.contains('sort-desc')) {
                    newHeader.classList.remove('sort-desc');
                    newHeader.classList.add('sort-asc');
                    asc = true;
                } else {
                    newHeader.classList.add('sort-asc');
                }
                
                // Save current sort state
                currentActivitySortColumn = index;
                currentActivitySortDirection = asc ? 'asc' : 'desc';
                
                // Execute the sort
                sortTable(activityTable, index, asc);
            });
        });
    }
    
    setupAutoRefresh();
}

function setupAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    
    if (isPopupOpen) {
        autoRefreshInterval = setInterval(() => {
            updateMachineStatus();
        }, 5000);
    } else {
        autoRefreshInterval = setInterval(() => {
            fetchLogs();
        }, 5000);
    }
}

function addRowClickListeners() {
    const rows = document.querySelectorAll("#ComputersTableBody tr");
    rows.forEach(row => {
        row.addEventListener("click", function() {
            let rowData = Array.from(this.children).map(td => td.textContent.trim());
            openPopup(rowData[0], rowData[1], rowData[2], rowData[3]);
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    fetchLogs();
    
    closePopupBtn.addEventListener("click", closePopup);
    
    overlay.addEventListener("click", function() {
        if (Object.keys(loadingPopups).length > 0) {
            return;
        } 
        else if (isPopupOpen) {
            closePopup();
        }
    });
    
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            if (Object.keys(loadingPopups).length > 0) {
                return;
            } 
            else if (isPopupOpen) {
                closePopup();
            }
        }
    });
    
    document.getElementById("logout").addEventListener("click", async function() {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        BackToLogin();
    });
    
    document.getElementById("ComputersTable").addEventListener("click", function(event) {
        // אם הקליק היה על כותרת טבלה, לא פותחים פופאפ
        if (event.target.tagName === 'TH') return;
        
        let row = event.target.closest("tr");
        if (!row) return;

        let rowData = Array.from(row.children).map(td => td.textContent.trim());
        openPopup(rowData[0], rowData[1], rowData[2], rowData[3]);
    });
    
    document.getElementById("updateActivity").addEventListener("click", function() {
        let machineId = document.getElementById("compId").textContent;
        let startDate = document.getElementById("startDate").value;
        let endDate = document.getElementById("endDate").value;
        
        currentStartDate = formatDateToDDMMYYYY(startDate);
        currentEndDate = formatDateToDDMMYYYY(endDate);

        LoadComputerActivity(machineId, formatDateToDDMMYYYY(startDate), formatDateToDDMMYYYY(endDate));
    });
    
    setupAutoRefresh();
    setupTableSorting("ComputersTable", [3], false); // הגדרת מיון ראשונית, החרגת עמודת Active (אינדקס 3)
});

/**
 * Sorts a table by a specific column
 * @param {HTMLTableElement} table - The table element to sort
 * @param {number} column - Column index to sort by (starts at 0)
 * @param {boolean} asc - Whether to sort ascending (true) or descending (false)
 */
function sortTable(table, column, asc = true) {
    // Find tbody
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error('No tbody found in table');
        return;
    }
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Check for empty table or only one row
    if (!rows.length || rows.length === 1) return;
    
    // Check if there's an error message in the table (a single row spanning all columns)
    if (rows[0].querySelector('td[colspan]')) return;
    
    // Sort the rows
    const sortedRows = rows.sort((a, b) => {
        // Get cell contents for comparison
        const cellsA = a.querySelectorAll('td');
        const cellsB = b.querySelectorAll('td');
        
        // Check if there are enough cells
        if (cellsA.length <= column || cellsB.length <= column) return 0;
        
        const cellA = cellsA[column].textContent.trim();
        const cellB = cellsB[column].textContent.trim();
        
        // Check if content is numeric
        const numA = parseFloat(cellA);
        const numB = parseFloat(cellB);
        
        if (!isNaN(numA) && !isNaN(numB)) {
            // Numeric sort
            return asc ? numA - numB : numB - numA;
        } else {
            // Text sort
            return asc 
                ? cellA.localeCompare(cellB, 'he', { sensitivity: 'base' }) 
                : cellB.localeCompare(cellA, 'he', { sensitivity: 'base' });
        }
    });
    
    // Remove all existing rows
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // Add sorted rows
    sortedRows.forEach(row => tbody.appendChild(row));
}

/**
 * Adds sorting functionality to table headers
 * @param {string} tableId - ID of the table or its tbody
 * @param {Array<number>} excludeColumns - Array of column indexes to exclude from sorting
 * @param {boolean} isActivityTable - Whether this is the activity table
 */
function setupTableSorting(tableId, excludeColumns = [], isActivityTable = false) {
    let table = document.getElementById(tableId);
    if (!table) return;
    
    // Check if the found element is tbody instead of table
    if (table.tagName === 'TBODY') {
        // Find the table element that is the parent of tbody
        table = table.closest('table');
        if (!table) return;
    }
    
    const headers = table.querySelectorAll('th');
    if (!headers || headers.length === 0) {
        console.error('No headers found in table');
        return;
    }
    
    // Clear previous sort classes
    headers.forEach(header => {
        header.classList.remove('sortable', 'sort-asc', 'sort-desc');
    });
    
    headers.forEach((header, index) => {
        // Skip columns that are in the exclude list
        if (excludeColumns.includes(index)) return;
        
        // Add CSS class
        header.classList.add('sortable');
        
        // Restore previous sort state if exists
        if (isActivityTable && currentActivitySortColumn === index) {
            header.classList.add(currentActivitySortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        } else if (!isActivityTable && currentSortColumn === index) {
            header.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
        
        // Delete previous listeners to prevent duplicates
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        // Add new listener
        newHeader.addEventListener('click', (event) => {
            // Stop event propagation to prevent popup opening
            event.stopPropagation();
            
            // Reset all other headers
            headers.forEach(h => {
                if (h !== newHeader) {
                    h.classList.remove('sort-asc', 'sort-desc');
                }
            });
            
            // Determine sort direction (toggle between ascending and descending on consecutive clicks)
            let asc = true;
            if (newHeader.classList.contains('sort-asc')) {
                newHeader.classList.remove('sort-asc');
                newHeader.classList.add('sort-desc');
                asc = false;
            } else if (newHeader.classList.contains('sort-desc')) {
                newHeader.classList.remove('sort-desc');
                newHeader.classList.add('sort-asc');
                asc = true;
            } else {
                newHeader.classList.add('sort-asc');
            }
            
            // Save current sort state
            if (isActivityTable) {
                currentActivitySortColumn = index;
                currentActivitySortDirection = asc ? 'asc' : 'desc';
            } else {
                currentSortColumn = index;
                currentSortDirection = asc ? 'asc' : 'desc';
            }
            
            // Execute the sort
            sortTable(table, index, asc);
        });
    });
    
    // If there's a saved sort state, sort the table accordingly
    const sortColumnIndex = isActivityTable ? currentActivitySortColumn : currentSortColumn;
    const isAscending = (isActivityTable ? currentActivitySortDirection : currentSortDirection) === 'asc';
    
    if (sortColumnIndex !== null) {
        sortTable(table, sortColumnIndex, isAscending);
    }
}