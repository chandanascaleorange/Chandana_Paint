const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const brushSize = document.getElementById('brushSize');
const shapeSelect = document.getElementById('shapeSelect');
const eraseBtn = document.getElementById('eraseBtn');
const fillBtn = document.getElementById('fillBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const statusBar = document.getElementById('statusBar');

let isDrawing = false;
let isErasing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#000000';
let currentTool = 'brush';

// New variables for undo/redo functionality
let history = [];
let currentStep = -1;
const maxHistory = 50;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;
    loadFromLocalStorage();
    initializeHistory();
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
}

function draw(e) {
    if (!isDrawing) return;

    const [currentX, currentY] = getCoordinates(e);

    ctx.strokeStyle = isErasing ? '#ffffff' : currentColor;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';

    switch (shapeSelect.value) {
        case 'brush':
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            break;
        case 'rectangle':
            ctx.strokeRect(lastX, lastY, currentX - lastX, currentY - lastY);
            break;
        case 'circle':
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));
            ctx.arc(lastX, lastY, radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
        case 'line':
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
            break;
    }

    [lastX, lastY] = [currentX, currentY];
    updateStatus(currentX, currentY);
    saveToHistory();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveToHistory();
    }
}

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches[0]) {
        return [
            (e.touches[0].clientX - rect.left) * scaleX,
            (e.touches[0].clientY - rect.top) * scaleY
        ];
    } else {
        return [
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top) * scaleY
        ];
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
}

function saveCanvas() { 
    const link = document.createElement('a');
    link.download = 'paint.png';
    link.href = canvas.toDataURL();
    link.click();   
}

function updateStatus(x, y) {
    statusBar.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)} | Current tool: ${currentTool}`;
}

function createColorPalette() {
    const colors = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', 
                    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff','#ffb6c1','#ffa500'];
    const palette = document.getElementById('colorPalette');
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', () => {
            currentColor = color;
            isErasing = false;
        });
        palette.appendChild(swatch);
    });
}

function saveToLocalStorage() {
    localStorage.setItem('canvasState', canvas.toDataURL());
}

function loadFromLocalStorage() {
    const savedState = localStorage.getItem('canvasState');
    if (savedState) {
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        };
        img.src = savedState;
    }
}

// New functions for undo/redo functionality
function saveToHistory() {
    currentStep++;
    if (currentStep < history.length) {
        history = history.slice(0, currentStep);
    }
    history.push(canvas.toDataURL());
    if (history.length > maxHistory) {
        history.shift();
        currentStep--;
    }
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    undoBtn.disabled = currentStep <= 0;
    redoBtn.disabled = currentStep >= history.length - 1;
}

function undo() {
    if (currentStep > 0) {
        currentStep--;
        loadFromHistory();
    }
}

function redo() {
    if (currentStep < history.length - 1) {
        currentStep++;
        loadFromHistory();
    }
}

function loadFromHistory() {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = history[currentStep];
    updateUndoRedoButtons();
}

function initializeHistory() {
    clearCanvas();
    saveToHistory();
}

// Mouse event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch event listeners
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
});
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing();
});

window.addEventListener('resize', resizeCanvas);

eraseBtn.addEventListener('click', () => {
    isErasing = !isErasing;
    currentTool = isErasing ? 'eraser' : 'brush';
    updateStatus(lastX, lastY);
});
fillBtn.addEventListener('click', () => {
    alert('Fill tool not implemented');
});
clearBtn.addEventListener('click', () => {
    clearCanvas();
    updateStatus(0, 0);
});
saveBtn.addEventListener('click', saveCanvas);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Initial setup
resizeCanvas();
createColorPalette();
loadFromLocalStorage();
initializeHistory();
