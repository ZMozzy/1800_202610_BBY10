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
  const footerTarget = document.getElementById("footer");

  if (!footerTarget) return;

  for (const path of getFooterPaths()) {
    try {
      const response = await fetch(path);
      if (!response.ok) continue;

      footerTarget.innerHTML = await response.text();
      return;
    } catch (error) {
      console.warn(`Failed to load footer from ${path}`, error);
    }
  }

  console.error("Footer failed to load from all known paths.");
}

loadFooter();
