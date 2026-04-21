const form = document.getElementById("setupForm");
const timerCheckbox = document.getElementById("enableTimer");
const timerGroup = document.getElementById("timerGroup");

// Show/hide timer input
timerCheckbox.addEventListener("change", () => {
    timerGroup.style.display = timerCheckbox.checked ? "block" : "none";
});

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const retries = document.getElementById("retries").value;
    const timerEnabled = timerCheckbox.checked;
    const timerDuration = document.getElementById("timerDuration").value;

    // Basic validation
    if (timerEnabled && (!timerDuration || Number(timerDuration) < 10)) {
        alert("Please enter a timer duration of at least 10 seconds.");
        return;
    }

    // Save to sessionStorage
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("maxRetries", retries);
    sessionStorage.setItem("timerEnabled", timerEnabled);
    sessionStorage.setItem("timerDuration", timerDuration);

    // Go to game page
    window.location.href = "game.html";
});
