async function loadFooter() {
    console.log("footer js is loaded");
    const response = await fetch("/footer.html");
    const data = await response.text();
    document.getElementById("footer").innerHTML = data;
}

loadFooter();