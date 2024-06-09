document.addEventListener('DOMContentLoaded', function() {
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const subjectSelect = document.getElementById('subject');
    const descInput = document.getElementById('task-desc');
    const dueDateInput = document.getElementById('due-date');
    const taskTypeSelect = document.getElementById('task-type');
    const reminderIntervalSelect = document.getElementById('reminder-interval');
    const groupMembersInput = document.getElementById('group-members');
    const homeworkList = document.getElementById('homework-list').querySelector('.task-container');
    const projectList = document.getElementById('project-list').querySelector('.task-container');
    const examList = document.getElementById('exam-list').querySelector('.task-container');
    const messageDiv = document.getElementById('message');
    const exportButton = document.getElementById('export-tasks');
    const importInput = document.getElementById('import-tasks');

    const resources = {
        Math: [
            { name: "Khan Academy", url: "https://www.khanacademy.org/math" },
            { name: "Wolfram Alpha", url: "https://www.wolframalpha.com/" }
        ],
        Science: [
            { name: "NASA", url: "https://www.nasa.gov/" },
            { name: "ScienceDaily", url: "https://www.sciencedaily.com/" }
        ],
        SS: [
            { name: "National Geographic", url: "https://www.nationalgeographic.com/" },
            { name: "Smithsonian", url: "https://www.si.edu/" }
        ],
        ELA: [
            { name: "Grammarly", url: "https://www.grammarly.com/" },
            { name: "Purdue OWL", url: "https://owl.purdue.edu/" }
        ]
    };

    taskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const taskName = taskNameInput.value;
        const subject = subjectSelect.value;
        const description = descInput.value;
        const dueDate = dueDateInput.value;
        const taskType = taskTypeSelect.value;
        const reminderInterval = parseInt(reminderIntervalSelect.value, 10);
        const groupMembers = groupMembersInput.value;

        addTask(taskName, subject, description, dueDate, taskType, reminderInterval, groupMembers);
        storeTask(taskName, subject, description, dueDate, taskType, reminderInterval, groupMembers);
        
        taskForm.reset();
        showMessage('Task added successfully!');
    });

    function addTask(name, subject, description, date, type, reminderInterval, groupMembers) {
        const task = document.createElement('div');
        task.classList.add('task', subject.replace(/\s+/g, ''));
        const dueDateTime = new Date(date);
        
        task.innerHTML = `
            <div>
                <div>
                    <img src="icons/${subject.toLowerCase()}.png" class="icons">
                    <strong>${name}</strong><br>
                    Subject: ${subject}<br>
                    Description: ${description}<br>
                    Due: <span class="due-date">${dueDateTime.toLocaleString()}</span>
                    (<span class="time-remaining"></span>)
                    ${groupMembers ? `<br>Group Members: ${groupMembers}` : ''}
                    <div class="resources">
                        <strong>Resources:</strong>
                        ${resources[subject]?.map(resource => `<a href="${resource.url}" class="resource-link" target="_blank">${resource.name}</a>`).join('<br>') || 'No resources available'}
                    </div>
                </div>
                <button class="remove-button">Mark as Done</button>
            </div>
        `;

        const removeButton = task.querySelector('.remove-button');
        removeButton.addEventListener('click', function() {
            task.remove();
            removeTask(name, subject, description, date, type, reminderInterval, groupMembers);
            showMessage('Task removed successfully!');
        });

        if (type === 'homework') {
            homeworkList.appendChild(task);
        } else if (type === 'project') {
            projectList.appendChild(task);
        } else if (type === 'exam') {
            examList.appendChild(task);
        }

        updateTaskTimes();
    }

    function storeTask(name, subject, description, date, type, reminderInterval, groupMembers) {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push({ name, subject, description, date, type, reminderInterval, groupMembers });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => addTask(task.name, task.subject, task.description, task.date, task.type, task.reminderInterval, task.groupMembers));
        setInterval(updateTaskTimes, 1000);
    }

    function removeTask(name, subject, description, date, type, reminderInterval, groupMembers) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.filter(task => task.name !== name || task.subject !== subject || task.description !== description || task.date !== date || task.type !== type || task.reminderInterval !== reminderInterval || task.groupMembers !== groupMembers);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function updateTaskTimes() {
        const tasks = document.querySelectorAll('.task');
        tasks.forEach(task => {
            const dueDateElement = task.querySelector('.due-date');
            const timeRemainingElement = task.querySelector('.time-remaining');
            const dueDate = new Date(dueDateElement.textContent);
            const now = new Date();
            const timeDiff = dueDate - now;

            if (timeDiff > 0) {
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

                if (days > 0) {
                    timeRemainingElement.textContent = `${days} days remaining`;
                } else {
                    timeRemainingElement.textContent = `${hours}h ${minutes}m ${seconds}s remaining`;
                }
            } else {
                timeRemainingElement.textContent = 'Past due!';
            }
        });
    }

    function notifyTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const now = new Date();

        tasks.forEach(task => {
            const dueDateTime = new Date(task.date);
            const timeRemaining = dueDateTime - now;

            if (timeRemaining >= 0) {
                let interval = task.reminderInterval;

                if (timeRemaining < 24 * 60 * 60 * 1000) {
                    interval = Math.max(1 * 60 * 1000, timeRemaining / 24); // Gradually reduce interval to a minimum of 1 minute
                }

                if (Notification.permission === 'granted') {
                    setTimeout(() => new Notification(`Reminder: "${task.name}" is due on ${dueDateTime.toLocaleString()}`), timeRemaining);
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            setTimeout(() => new Notification(`Reminder: "${task.name}" is due on ${dueDateTime.toLocaleString()}`), timeRemaining);
                        }
                    });
                }
            }
        });
    }

    function showMessage(message) {
        messageDiv.textContent = message;
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);
    }

    exportButton.addEventListener('click', () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const blob = new Blob([JSON.stringify(tasks)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const tasks = JSON.parse(e.target.result);
                localStorage.setItem('tasks', JSON.stringify(tasks));
                loadTasks();
                showMessage('Tasks imported successfully!');
            };
            reader.readAsText(file);
        }
    });

    // Dark and light mode functionality
    const darkThemeToggle = document.getElementById('dark-theme-toggle');

    darkThemeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            darkThemeToggle.textContent = 'Toggle Light Theme';
        } else {
            darkThemeToggle.textContent = 'Toggle Dark Theme';
        }
    });

    // Initialize button text based on the initial theme
    if (document.body.classList.contains('dark')) {
        darkThemeToggle.textContent = 'Toggle Light Theme';
    } else {
        darkThemeToggle.textContent = 'Toggle Dark Theme';
    }

    loadTasks();
    setInterval(notifyTasks, 24 * 60 * 60 * 1000);
    notifyTasks();
});