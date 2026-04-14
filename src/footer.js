function getFooterPaths() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const currentIsFile = pathParts.length > 0 && pathParts[pathParts.length - 1].includes(".");
  const directoryDepth = currentIsFile ? pathParts.length - 1 : pathParts.length;
  const relativePrefix = "../".repeat(Math.max(directoryDepth, 0));

  return [
    `${relativePrefix}footer.html`,
    "/footer.html",
    "footer.html",
  ];
}

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






