export function saveScore(score) {
    localStorage.setItem("highScore", score);
}

export function getScore() {
    return localStorage.getItem("highScore") || 0;
}

export function saveSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
}

export function getSettings() {
    return JSON.parse(localStorage.getItem("settings")) || {};
}
