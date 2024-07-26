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
let undoStack = [];
let redoStack = [];
let currentColor = '#000000';
let currentTool = 'brush';

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    redrawCanvas();
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop];
    saveState();
}

function draw(e) {
    if (!isDrawing) return;

    const currentX = e.clientX - canvas.offsetLeft;
    const currentY = e.clientY - canvas.offsetTop;

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
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
}

function clearCanvas() {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';  // Change to white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToLocalStorage();
}
// this function makes sure that the background of the saved image is white and the colors used to draw are preserved by creating a temporary canvas
function saveCanvas() { 
    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Fill the temporary canvas with white
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the main canvas content onto the temporary canvas
    tempCtx.drawImage(canvas, 0, 0);
    
    // Save the temporary canvas
    const link = document.createElement('a');
    link.download = 'paint.png';
    link.href = tempCanvas.toDataURL();
    link.click();   
}

function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = [];
    saveToLocalStorage();
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        redrawState(undoStack[undoStack.length - 1]);
        saveToLocalStorage();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        redrawState(undoStack[undoStack.length - 1]);
        saveToLocalStorage();
    }
}

function redrawState(state) {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = state;
}

function redrawCanvas() {
    if (undoStack.length > 0) {
        redrawState(undoStack[undoStack.length - 1]);
    }
}

function updateStatus(x, y) {
    statusBar.textContent = `X: ${x}, Y: ${y} | Current tool: ${currentTool}`;
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
    localStorage.setItem('canvasState', JSON.stringify({
        imageData: canvas.toDataURL(),
        undoStack: undoStack,
        redoStack: redoStack
    }));
}

function loadFromLocalStorage() {
    const savedState = localStorage.getItem('canvasState');
    if (savedState) {
        const state = JSON.parse(savedState);
        undoStack = state.undoStack;
        redoStack = state.redoStack;
        redrawState(state.imageData);
    }
}

window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

eraseBtn.addEventListener('click', () => {
    isErasing = !isErasing;
    currentTool = isErasing ? 'eraser' : 'brush';
    updateStatus(lastX, lastY);
});
fillBtn.addEventListener('click', () => {
    alert('Fill tool not implemented');
});
clearBtn.addEventListener('click', clearCanvas);
saveBtn.addEventListener('click', saveCanvas);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Initial setup
resizeCanvas();
createColorPalette();
loadFromLocalStorage(); // Load saved state on page load
if (undoStack.length === 0) {
    saveState(); // Save initial blank state if no saved state exists
}