async function loadFooter() {
    console.log("footer js is loaded");

    const response = await fetch("/footer.html");
    const data = await response.text();

    const footer = document.getElementById("footer");
    if (footer) {
        footer.innerHTML = data;
    }
}

loadFooter();






