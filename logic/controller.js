// Validates login values based on the encryption state
function validateLogin(values) {
    return ((isEncLoginState() && values.encKey !== "") ?
        (values.encKey.length > 0 && values.username.length > 0 && values.password.length > 0) :
        (values.username.length > 0 && values.password.length > 0));
}

// Encrypts the password using an encryption key
function encrypt(password, encryptionKey) {
    const keyLength = encryptionKey.length;
    const result = new Uint8Array(password.length);

    for (let i = 0; i < password.length; i++) {
        result[i] = password.charCodeAt(i) ^ encryptionKey.charCodeAt(i % keyLength);
    }

    return String.fromCharCode(...result);
}

// Performs login by filling in the fields and clicking the login button
function login(username, password) {
    document.getElementById("UserName").value = username;
    document.getElementById("Password").value = password;
    sleep(300);
    document.querySelector(".btn.btn-primary").click();
    sleep(500);
}

// Toggles the visual mode between light and dark
function toggleVisualMode(darkMode) {
    const colors = darkMode ? darkModeColor : whiteModeColor;
    document.documentElement.style.setProperty('--weekdayToday', colors.highlightColor);
    document.documentElement.style.setProperty('--navColor', colors.navColor);
    document.documentElement.style.setProperty('--backgroundColor', colors.backgroundColor);
    document.documentElement.style.setProperty('--planColor', colors.planColor);
    document.documentElement.style.setProperty('--glyphicon', colors.glyphicon);
    document.documentElement.style.setProperty('--lessonColor', colors.lessonColor);
    document.documentElement.style.setProperty('--hourOverlay', colors.hourOverlay);
    document.documentElement.style.setProperty('--hourCanceled', colors.hourCanceled);
    document.documentElement.style.setProperty('--hourCanceled', colors.hourCanceled);
    document.documentElement.style.setProperty('--hourChanged', colors.hourChanged);
    document.documentElement.style.setProperty('--white', colors.white);
    document.documentElement.style.setProperty('--activeTab', colors.activeTab);
    document.documentElement.style.setProperty('--timerBackgound', colors.timerBackgound);
}

// Marks the current day in the table
function markCurrentDay() {
    const date = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }).replace(/\./g, ".");

    const tables = document.getElementsByTagName("table");
    for (const table of tables) {
        const rows = table.getElementsByTagName("tr");
        for (const row of rows) {
            const strong = row.querySelector("strong");
            if (strong?.textContent.includes(date)) {
                row.style.backgroundColor = "var(--weekdayToday)";
                return;
            }
        }
    }
}

function isFutureWeek() {
    const box = document.getElementById("umgebung");
    if (box === null) return true;

    const currentDate = new Date();

    const match = box.children[1].children[0].children[1].innerHTML.match(/(\d{2})\.(\d{2})\./)
    const mondaySelected = { day: parseInt(match[1]), month: parseInt(match[2]) }

    const selectedYear = (mondaySelected.month < 9 && currentDate.getMonth() < 9) || (mondaySelected.month >= 9 && currentDate.getMonth() >= 9) ?
        currentDate.getFullYear() :
        (mondaySelected.month < 9 && currentDate.getMonth() >= 9 ?
            currentDate.getFullYear() + 1 :
            currentDate.getFullYear() - 1);

    const mondaySelectedDate = new Date(selectedYear, mondaySelected.month - 1, mondaySelected.day);

    return currentDate < mondaySelectedDate;
}

// Hides the passed days in the table
function hidePassedDays() {
    const box = document.getElementById("umgebung");
    if (box === null) return;

    // Hide passed days
    for (let i = 1; i < 6; i++) {
        if (box.children[i].children[0].children[0].classList.contains("weekdayToday")) {
            break;
        }
        box.children[i].children[0].children[1].classList.add("passedDay");
    }
}

// Checks the current time and updates the interface based on the period
function checkTime(period, index) {
    const currentTime = new Date();
    const startTime = getTimeObject(period.start[0], period.start[1]);
    const endTime = getTimeObject(period.end[0], period.end[1]);

    const currentBox = window.location.pathname.includes("Stundenplan") ?
        document.getElementById("umgebung")?.children[0]?.children[index] :
        document.getElementById("umgebung")?.children[0].children[1].children[0]?.children[index];

    if (currentBox === null || currentBox === undefined) return;

    if (currentTime > endTime) {
        currentBox.children[0].classList.remove("weekdayToday");
        for (const i of [1, 2, 3]) {
            currentBox.children[i].style.fill = hourOverColor;
        }
    } else if (currentTime > startTime && currentTime < endTime) {
        currentBox.children[0].classList.add("weekdayToday");
    }
}

// Creates a timer in the interface
function createTimer() {
    const box = document.getElementById("stdplanheading") || document.querySelector('div[style="margin-left:10px;"]');
    if (!box) return;

    const timerElement = document.createElement("span");
    timerElement.id = "timerText";
    box.append(timerElement);

    calculateTimeDiff();
    setInterval(calculateTimeDiff, 1000);
}

// Calculates the time difference until the next lesson and updates the timer
function calculateTimeDiff() {
    const currentTime = new Date();

    let nextLessonStart;
    if (getTimeObject(timeTable[0].start[0], timeTable[0].start[1]) > currentTime) {
        nextLessonStart = getTimeObject(timeTable[0].start[0], timeTable[0].start[1]);
    }
    else {
        for (let i = 0; i < timeTable.length; i++) {
            const endTime = getTimeObject(timeTable[i].end[0], timeTable[i].end[1]);
            if (currentTime < endTime) {
                nextLessonStart = endTime;
                break;
            }
        }
    }

    const timeDiff = Math.max(nextLessonStart - currentTime, 0);

    document.querySelector("#timerText").textContent =
        isNaN(timeDiff) ?
            "Schule zu Ende :)" :
            `${Math.floor(timeDiff / 60000)}m ${Math.floor((timeDiff % 60000) / 1000)}s`;
}

// Create Buttons in the interface
function createButtons() {
    const box = document.getElementById("stdplanheading") || document.querySelector('div[style="margin-left:10px;"]');
    if (box) {
        let buttons = [
            { text: 'Einstellungen',  onclick: () => chrome.runtime.sendMessage({ action: 'openOptionsPage' }) },
        ];
        for (const [name, href] of Object.entries(links)) {
            buttons.push({ text: name, onclick: () => window.open(href) });
        }

        buttons.forEach(({ text, id, onclick }) => {
            const button = document.createElement('button');
            button.classList.add('interface-button');
            button.textContent = text;
            button.onclick = onclick;
            box.appendChild(button);
        });
    }
}

// Paints the lessons in the table based on the defined color
 function paintLessons() {
    let box = document.getElementById("umgebung");
    if (box === null || box === undefined) return;

    for (let i = 1; i < 6; i++) {
        let j = 1;
        while (box.children[i].children[j] !== null && box.children[i].children[j] !== undefined) {
            if (box.children[i].children[j].children[1].classList.contains("regStd")) {
                let color = lessonColor[box.children[i].children[j].children[4].textContent];
                if (color !== undefined) {
                    box.children[i].children[j].children[1].setAttribute("style", `fill: ${color} !important;`);
                }
            }
            j++;
        }
    }
}

// Paints the lessons in the main page
function paintLessonsMain() {
  let box = document.getElementById("umgebung");
  if (box === null || box === undefined) return;
  box = box.children[0].children[1].children[1];
  for (let i = 0; i < box.children.length; i++) {
    if (!box.children[i].children[1].classList.contains("regStd")) continue;
    let color = lessonColor[box.children[i].children[4].textContent];
    if (color === undefined ) continue;
    box.children[i].children[1].setAttribute("style", `fill: ${color} !important;`);
  }
}

// Paints the appointments in the table in the main page
function paintAppointments() {
    let box = document.getElementById("umgebung");
    if (box === null || box === undefined) return;
    let table = box.children[1].children[1];
    const cells = table.querySelectorAll("td");
    cells.forEach(cell => {
        if (cell.style.color === 'red') {
            cell.style.color = "";
            cell.style.backgroundColor = "var(--weekdayToday)";
        }
    });
}