const API_KEY = "rWKRNlg8fmuI-aLJ7XLpZ2XFwYYH5tLPCEwRTTJsd1E";

let page = 1;
let loading = false;
let currentQuery = "all";

const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");
const loader = document.getElementById("loader");
const searchInput = document.getElementById("searchInput");
const favoritesBtn = document.getElementById("favoritesBtn");
const closeBtn = document.querySelector(".close");


// ================= FETCH WALLPAPERS =================
async function fetchWallpapers(query = "all", reset = false) {
  if (loading) return;

  loading = true;
  loader.style.display = "block";

  if (reset) {
    gallery.innerHTML = "";
    page = 1;
  }

  try {
    let url =
      query === "all"
        ? `https://api.unsplash.com/photos?page=${page}&per_page=30`
        : `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=30`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${API_KEY}`,
      },
    });

    const data = await response.json();
    const images = query === "all" ? data : data.results;

    displayWallpapers(images);
    page++;

  } catch (error) {
    console.error("Error fetching wallpapers:", error);
  }

  loading = false;
  loader.style.display = "none";
}


// ================= DISPLAY IMAGES =================
function displayWallpapers(images) {
  if (!images || images.length === 0) return;

  images.forEach((img) => {
    const card = document.createElement("div");
    card.classList.add("image-card");

    const imageElement = document.createElement("img");
    imageElement.src = img.urls.small;
    imageElement.alt = img.alt_description || "Wallpaper";
    imageElement.loading = "lazy";
    imageElement.onclick = () => openModal(img.urls.full || img.urls.regular);

    const iconGroup = document.createElement("div");
    iconGroup.classList.add("icon-group");

    // ===== FAVORITE BUTTON =====
    const favoriteBtn = document.createElement("div");
    favoriteBtn.classList.add("icon-btn", "heart");
    favoriteBtn.innerHTML = "❤";

    if (isFavorite(img.urls.full)) {
      favoriteBtn.classList.add("active");
    }

    favoriteBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(img);
      favoriteBtn.classList.toggle("active");
    };

    // ===== DOWNLOAD BUTTON =====
    const downloadBtn = document.createElement("div");
    downloadBtn.classList.add("icon-btn");
    downloadBtn.innerHTML = `
      <img src="https://cdn-icons-png.flaticon.com/512/724/724933.png" alt="Download">
    `;

    downloadBtn.onclick = async (e) => {
      e.stopPropagation();

      // ✅ Unsplash download tracking
      if (img.links && img.links.download_location) {
        await fetch(img.links.download_location, {
          headers: {
            Authorization: `Client-ID ${API_KEY}`
          }
        });
      }

      downloadImage(img.urls.full || img.urls.regular);
    };

    iconGroup.appendChild(favoriteBtn);
    iconGroup.appendChild(downloadBtn);

    card.appendChild(imageElement);
    card.appendChild(iconGroup);
    gallery.appendChild(card);
  });
}


// ================= DOWNLOAD IMAGE =================
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `wallpaper-${Date.now()}.jpg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);

  } catch (error) {
    console.error("Download failed:", error);
  }
}


// ================= MODAL =================
function openModal(url) {
  modal.style.display = "flex";
  modalImg.src = url;
}

function closeModal() {
  modal.style.display = "none";
}

closeBtn.addEventListener("click", closeModal);

window.addEventListener("click", function (event) {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", function(e){
  if(e.key === "Escape") closeModal();
});


// ================= SEARCH =================
function searchWallpapers() {
  const input = searchInput.value.trim();
  if (!input) return;

  currentQuery = input;
  fetchWallpapers(currentQuery, true);
}

searchInput.addEventListener("keypress", function(e){
  if(e.key === "Enter") searchWallpapers();
});


// ================= FILTER CATEGORY =================
document.querySelectorAll(".filters button").forEach((btn) => {
  btn.addEventListener("click", function () {

    const category = this.innerText.toLowerCase();

    if (category === "favorites") {
      showFavorites(this);
      return;
    }

    currentQuery = category;
    localStorage.setItem("activeCategory", category);

    document.querySelectorAll(".filters button")
      .forEach(b => b.classList.remove("active"));

    this.classList.add("active");

    fetchWallpapers(category, true);
  });
});


// ================= FAVORITES SYSTEM =================
favoritesBtn.addEventListener("click", () => showFavorites(favoritesBtn));

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFavorite(url) {
  if (!url) return false;
  return getFavorites().some((fav) => fav.url === url);
}

function toggleFavorite(img) {
  let favorites = getFavorites();
  const url = img.urls.full || img.urls.regular;

  const exists = favorites.find((fav) => fav.url === url);

  if (exists) {
    favorites = favorites.filter((fav) => fav.url !== url);
  } else {
    favorites.push({
      url: url,
      small: img.urls.small,
    });
  }

  saveFavorites(favorites);
}


// ================= SHOW FAVORITES =================
function showFavorites(buttonElement) {
  currentQuery = "favorites";
  gallery.innerHTML = "";

  document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
  buttonElement.classList.add("active");

  const favorites = getFavorites();

  if (!favorites || favorites.length === 0) {
    gallery.innerHTML = "<h2 style='text-align:center; color: black;'>No Favorites Yet ❤️</h2>";
    return;
  }

  favorites.forEach((fav) => {
    const card = document.createElement("div");
    card.classList.add("image-card");

    const imageElement = document.createElement("img");
    imageElement.src = fav.small;
    imageElement.loading = "lazy";
    imageElement.onclick = () => openModal(fav.url);

    const iconGroup = document.createElement("div");
    iconGroup.classList.add("icon-group");

    // ❤️ REMOVE FROM FAVORITES BUTTON
    const favoriteBtn = document.createElement("div");
    favoriteBtn.classList.add("icon-btn", "heart", "active");
    favoriteBtn.innerHTML = "❤";

    favoriteBtn.onclick = (e) => {
      e.stopPropagation();
      const updatedFavorites = getFavorites().filter(item => item.url !== fav.url);
      saveFavorites(updatedFavorites);
      card.remove();
    };

    // ⬇ DOWNLOAD BUTTON
    const downloadBtn = document.createElement("div");
    downloadBtn.classList.add("icon-btn");
    downloadBtn.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/724/724933.png" alt="Download">`;
    downloadBtn.onclick = (e) => {
      e.stopPropagation();
      downloadImage(fav.url);
    };

    iconGroup.appendChild(favoriteBtn);
    iconGroup.appendChild(downloadBtn);

    card.appendChild(imageElement);
    card.appendChild(iconGroup);
    gallery.appendChild(card);
  });
}


// ================= INFINITE SCROLL =================
let scrollTimeout;
window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 400 &&
      !loading &&
      currentQuery !== "favorites"
    ) {
      fetchWallpapers(currentQuery);
    }
  }, 200);
});


// ================= LOAD SAVED CATEGORY =================
window.addEventListener("DOMContentLoaded", () => {
  const savedCategory = localStorage.getItem("activeCategory") || "all";
  currentQuery = savedCategory;

  document.querySelectorAll(".filters button").forEach(btn => {
    if (btn.innerText.toLowerCase() === savedCategory) btn.classList.add("active");
  });

  fetchWallpapers(savedCategory, true);
});