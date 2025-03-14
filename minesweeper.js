// Default game settings
let rows = 9, cols = 9, minesCount = 10;
let board = [], minePositions = new Set();
let gameOver = false;
let flagsLeft;
let timerInterval;
let secondsElapsed = 0;

document.getElementById("restartButton").addEventListener("click", startGame);
document.getElementById("solveButton").addEventListener("click", solveGame);
document.getElementById("difficulty").addEventListener("change", changeDifficulty);

function changeDifficulty() {
    const difficulty = document.getElementById("difficulty").value;

    switch (difficulty) {
        case "1":
            rows = 9;
            cols = 9;
            minesCount = 10;
            break;
        case "2":
            rows = 16;
            cols = 16;
            minesCount = 40;
            break;
        case "3":
            rows = 16;
            cols = 30;
            minesCount = 99;
            break;
        default:
            break;
    }

    startGame(); // Restart the game with the selected difficulty
}

function startGame() {
    gameOver = false;
    flagsLeft = minesCount;
    secondsElapsed = 0;
    clearInterval(timerInterval); // Reset timer if needed
    document.getElementById("bombCounter").textContent = `Bombs Left: ${flagsLeft}`;
    document.getElementById("timer").textContent = `Time: 0`;

    const boardElement = document.getElementById("board");
    boardElement.innerHTML = "";
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    boardElement.style.gridTemplateRows = `repeat(${rows}, 32px)`;

    board = [];
    minePositions.clear();
    createBoard(boardElement);
    placeMines();
    calculateNumbers();

    // Start timer
    timerInterval = setInterval(updateTimer, 1000);
}

function createBoard(boardElement) {
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener("click", handleLeftClick);
            cell.addEventListener("contextmenu", handleRightClick);
            cell.addEventListener("dblclick", handleChording);

            board[r][c] = { element: cell, isMine: false, revealed: false, flagged: false, adjacentMines: 0 };
            boardElement.appendChild(cell);
        }
    }
}

function placeMines() {
    while (minePositions.size < minesCount) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        let key = `${r}-${c}`;
        if (!minePositions.has(key)) {
            minePositions.add(key);
            board[r][c].isMine = true;
        }
    }
}

function calculateNumbers() {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],         [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].isMine) continue;

            let count = 0;
            directions.forEach(([dr, dc]) => {
                let nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                    count++;
                }
            });

            board[r][c].adjacentMines = count;
        }
    }
}

function handleLeftClick(event) {
    if (gameOver) return; // Prevent clicks after game over

    const r = parseInt(event.target.dataset.row);
    const c = parseInt(event.target.dataset.col);
    revealCell(r, c);
}

function revealCell(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c].revealed || board[r][c].flagged || gameOver) return;

    const cell = board[r][c];
    cell.revealed = true;
    cell.element.classList.add("revealed");

    if (cell.isMine) {
        cell.element.classList.add("mine");
        gameOver = true;
        clearInterval(timerInterval); // Stop the timer when the game is over
        alert("Game Over!");
        revealAllMines();
        return;
    }

    if (cell.adjacentMines > 0) {
        cell.element.textContent = cell.adjacentMines;
        cell.element.dataset.number = cell.adjacentMines;
    } else {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],         [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        directions.forEach(([dr, dc]) => revealCell(r + dr, c + dc));
    }

    checkWinCondition();
}

function handleRightClick(event) {
    event.preventDefault();
    if (gameOver) return; // Prevent flagging after game over

    const cell = event.target;
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);

    if (!board[r][c].revealed) {
        board[r][c].flagged = !board[r][c].flagged;

        if (board[r][c].flagged) {
            flagsLeft--;
        } else {
            flagsLeft++;
        }

        document.getElementById("bombCounter").textContent = `Bombs Left: ${flagsLeft}`;

        cell.textContent = board[r][c].flagged ? "🚩" : "";
        cell.classList.toggle("flagged", board[r][c].flagged);
    }
}

function handleChording(event) {
    if (gameOver) return; // Prevent chording after game over

    const r = parseInt(event.target.dataset.row);
    const c = parseInt(event.target.dataset.col);
    const cell = board[r][c];

    if (!cell.revealed || cell.adjacentMines === 0) return;

    let flaggedCount = 0;
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],         [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].flagged) {
            flaggedCount++;
        }
    });

    if (flaggedCount === cell.adjacentMines) {
        directions.forEach(([dr, dc]) => {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                revealCell(nr, nc);
            }
        });
    }
}

function revealAllMines() {
    minePositions.forEach(pos => {
        const [r, c] = pos.split("-").map(Number);
        board[r][c].element.classList.add("mine");
    });
}

function checkWinCondition() {
    let revealedCount = 0;
    let totalCells = rows * cols;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].revealed && !board[r][c].isMine) {
                revealedCount++;
            }
        }
    }

    if (revealedCount === totalCells - minesCount) {
        gameOver = true;
        clearInterval(timerInterval); // Stop the timer when the game is won
        alert("You Win!");
    }
}

function updateTimer() {
    secondsElapsed++;
    document.getElementById("timer").textContent = `Time: ${secondsElapsed}`;
}

function solveGame() {
    // Add solver functionality here to automatically solve the game
}

startGame();
