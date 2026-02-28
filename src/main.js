// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';

// If you have custom global styles, import them as well:
// import '../styles/style.css';

function sayHello() {

}
document.getElementById("getstarted").addEventListener("click", function() {
    window.location.href = "landing.html";
});

document.getElementById("loginbtn").addEventListener("click", function() {
    window.location.href = "login.html";
});

function updateWaitTime() {
    let newTime = prompt("Enter new wait time:");
    //only update if they didnt hit cancel or enter nothing
    if (newTime !== null && newTime.trim() !== "") {
        let numericValue = Number(newTime);

        // Check if it is a valid integer and not a negative number
        if (Number.isInteger(numericValue) && numericValue >= 0) {
            let finalWait = numericValue + " min";
            
            document.getElementById("wait-time-value").innerText = finalWait;
        }
}
}
// document.addEventListener('DOMContentLoaded', sayHello);
