import {
  searchByName, mapRawCocktailData, detailsCocktail, randomCocktail, getAllCocktails
} from "./utilities.js";

let currentCocktailId = null;

const navbar = document.querySelector(".navbar");
const homePage = document.querySelector("#home-page");
const detailsPage = document.querySelector("#details-page");
const searchPage = document.querySelector("#search-page");
const favoritePage = document.querySelector("#favorite-page");


navbar.addEventListener("click", handleOnNavbarClick);

function handleOnNavbarClick(event) {
  const classList = event.target.classList;
  if (classList.contains("link")) return handleOnLinkClick(event.target.id);
}

function handleOnLinkClick(id) {
  if (id === "home-link") {
    homePage.classList.add("open");
    detailsPage.classList.remove("open");
    searchPage.classList.remove("open");
    favoritePage.classList.remove("open");
  }

  if (id === "search-link") {
    homePage.classList.remove("open");
    detailsPage.classList.remove("open");
    searchPage.classList.add("open");
    favoritePage.classList.remove("open");
  }

  if (id ==="favorite-link") {
    homePage.classList.remove("open");
    detailsPage.classList.remove("open");
    searchPage.classList.remove("open");
    favoritePage.classList.add("open");
  }
}

function navigateToDetailsPage() {
  homePage.classList.remove("open");
  detailsPage.classList.add("open");
  searchPage.classList.remove("open");
  favoritePage.classList.remove("open");
}

document.querySelector("#home-link").addEventListener("click", () => {
  window.location.reload(); 
});
document.querySelector("#favorite-link").addEventListener("click", showFavoritesPage);


// FUNK UPPDATERA DETALJSIDA
function updateDetailsPage(details, container = document) {
  const nameElement = container.querySelector(".details-cocktail-name");
  const imgElement = container.querySelector(".details-cocktail-img");
  const categoryElement = container.querySelector("#details-cocktail-category");
  const glassElement = container.querySelector("#details-cocktail-glass");
  const instructionsElement = container.querySelector("#details-cocktail-instructions");
  const ingredientsList = container.querySelector("#details-cocktail-ingredients");

  if (nameElement) nameElement.textContent = details.name;
  if (imgElement) imgElement.src = details.thumbnail;
  if (categoryElement) categoryElement.textContent = `Category: ${details.category}`;
  if (glassElement) glassElement.textContent = `Glass: ${details.glass}`;
  if (instructionsElement) instructionsElement.textContent = details.instructions;

  if (ingredientsList) {
    ingredientsList.innerHTML = details.ingredients
      .map((item) => `<li>${item.ingredient} - ${item.measure || "as needed"}</li>`)
      .join("");
  }
}

// F COCKTAILDETALJER
async function showCocktailDetails(cocktailId) {
  try {
    const details = mapRawCocktailData(await detailsCocktail(cocktailId));

    updateDetailsPage(details, document.querySelector("#details-page"));

    const favoriteButton = document.querySelector("#favorite-toggle");
    if (favoriteButton) {
      
      favoriteButton.textContent = ""; 
      favoriteButton.replaceWith(favoriteButton.cloneNode(true)); 
      handleFavoriteButton(details, document.querySelector("#favorite-toggle")); 
      handleFavoriteButton(details, favoriteButton);
    }

    navigateToDetailsPage();
  } catch (error) {
    console.error("Error loading cocktail details:", error);
  }
}

//RNDMCOCKTAIL ON PAGELOAD
window.addEventListener("DOMContentLoaded", async () => {
  
  try {
      const rawCocktail = await randomCocktail(); 
      console.log("fetched random cocktail", randomCocktail);
      const cocktail = mapRawCocktailData(rawCocktail);

      currentCocktailId = cocktail.id;
      updateDetailsPage(cocktail, document.querySelector("#home-page"));

     addCocktailCard(cocktail, document.querySelector("#home-page"));

  } catch (error) {
      console.error("Error fetching cocktail", error);
  }

});

(async function loadCocktailDetails() {
const params = new URLSearchParams(window.location.search);
const cocktailId = params.get("id"); 

if (cocktailId) {
  try {
      const details = mapRawCocktailData(await detailsCocktail(cocktailId));

    updateDetailsPage(details, document.querySelector("#details-page"));

} catch (error) {
  console.error("Error fetching cocktail details", error);
}
}
})();

// Random cocktail button
document.querySelector("#random-cocktail-btn").addEventListener("click", async () => {
  try {
    const rawCocktail = await randomCocktail();
    const cocktail = mapRawCocktailData(rawCocktail);

    currentCocktailId = cocktail.id;

    updateDetailsPage(cocktail, document.querySelector("#home-page"));
  
    addCocktailCard(cocktail);
  } catch (error) {
    console.error("Error fetching random cocktail details", error);
  }
});

const randomCocktailContainer = document.querySelector("#random-cocktail-container");

function addCocktailCard(cocktail) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.id = cocktail.id;

  card.innerHTML = `
    <h3>${cocktail.name}</h3>
    <img src="${cocktail.thumbnail}" alt="${cocktail.name}" class="drink-image" />
  `;
}

// See more button
document.querySelector("#see-more-btn").addEventListener("click", async () => {
  if (!currentCocktailId) {
    console.error("No cocktail selected!");
    return;
  }

  showCocktailDetails(currentCocktailId);
});

// FUNK FAVVOKNAPP
function handleFavoriteButton(cocktail, button) {
  if (!button) return;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  if (isFavorite(cocktail.idDrink)) {
    button.textContent = REMOVE_FROM_FAV;
    button.classList.add("is-favorite");
  } else {
    button.textContent = ADD_TO_FAV;
    button.classList.remove("is-favorite")
  }

  button.addEventListener("click", (e) => {
    e.stopPropagation(); 
    toggleFavorite(cocktail);
    handleFavoriteButton(cocktail, button); 
  });
}

//SEARCHFORM
const searchInput = document.querySelector("[data-search]");
const userCardContainer = document.querySelector("[data-user-cards-container]");
const filterSelect = document.querySelector("[data-filter-type]"); 
const paginationContainer = document.createElement("div");
paginationContainer.classList.add("pagination");
const findCocktailButton = document.querySelector("[data-find-cocktail-button]");

let currentPage = 1;
const resultsPerPage = 10;
let drinks = [];

let debounceTimeout;

// Sök och filtrera
async function fetchCocktails(query, filterType = "name") {
    const baseUrl = "https://www.thecocktaildb.com/api/json/v1/1";
    let url = "";

    switch (filterType) {
        case "name":
            url = `${baseUrl}/search.php?s=${query}`;
            break;
        case "category":
            url = `${baseUrl}/filter.php?c=${query}`;
            break;
        case "glass":
            url = `${baseUrl}/filter.php?g=${query}`;
            break;
        case "ingredient":
            url = `${baseUrl}/filter.php?i=${query}`;
            break;
        default:
            throw new Error("Invalid filter type");
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.drinks || [];  
    } catch (error) {
        console.error("Failed to fetch data:", error);
        return [];
    }
}

// validering
function showError(message) {
  const errorElement = document.querySelector(".error-message");
  if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.classList.add("error-message");
  }
  errorElement.textContent = message;
  searchInput.parentElement.appendChild(errorElement);
}

function hideError() {
  const errorElement = document.querySelector(".error-message");
  if (errorElement) errorElement.remove();
}

// sidor
function paginateAndDisplay(filteredDrinks) {
  const totalPages = Math.ceil(filteredDrinks.length / resultsPerPage);
  displayPage(filteredDrinks, currentPage, totalPages);
  createPaginationButtons(filteredDrinks, totalPages);
}

function displayPage(drinksToShow, page, totalPages) {
  userCardContainer.innerHTML = ""; 
  const startIndex = (page - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, drinksToShow.length);

  for (let i = startIndex; i < endIndex; i++) {
    const drink = drinksToShow[i]; 
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.id = drink.idDrink;
    card.innerHTML = `
        <h3>${drink.strDrink}</h3>
        <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" class="drink-image" />
    `;

    //"See More" knapp
    const seeMoreButton = document.createElement("button");
    seeMoreButton.textContent = "Seeeee More";
    seeMoreButton.classList.add("see-more-btn");

    seeMoreButton.addEventListener("click", (e) => {
      e.stopPropagation(); 
      showCocktailDetails(drink.idDrink); 
    });

     card.appendChild(seeMoreButton);

    userCardContainer.appendChild(card);

     //favoritknappen <--fungerar
    const favoriteButton = document.createElement("button");
    favoriteButton.classList.add("favorite-btn");
    
    handleFavoriteButton(drink, favoriteButton);
    card.appendChild(favoriteButton);
  }

  paginationContainer.innerHTML = `Sida ${page} av ${totalPages}`;
  userCardContainer.parentElement.appendChild(paginationContainer);
}

// sidknapp
function createPaginationButtons(drinksToPaginate, totalPages) {
  const buttonContainer = document.querySelector(".pagination-buttons") || document.createElement("div");
  buttonContainer.classList.add("pagination-buttons");
  buttonContainer.innerHTML = ""; 

  for (let i = 1; i <= totalPages; i++) {
      const button = document.createElement("button");
      button.textContent = i;
      button.classList.toggle("active", i === currentPage);
      button.addEventListener("click", () => {
          currentPage = i;
          displayPage(drinksToPaginate, currentPage, totalPages);
          createPaginationButtons(drinksToPaginate, totalPages);
      });
      buttonContainer.appendChild(button);
  }
 paginationContainer.appendChild(buttonContainer);
}


//sökning och filtrering
  searchInput.addEventListener("input", async (e) => {
  const value = e.target.value.trim().toLowerCase();
  
  if (!value) {
      showError("Sökfältet får inte vara tomt.");
      userCardContainer.innerHTML = ""; 
      paginationContainer.innerHTML = ""; 
      return;
  } else {
      hideError();
  }

  const filterType = filterSelect.value; 

  if (filterType === "name") {
      drinks = await fetchCocktails(value, filterType);
      drinks = drinks.filter(drink => drink.strDrink.toLowerCase().includes(value));  
      paginateAndDisplay(drinks);

  } else {
    if (debounceTimeout) clearTimeout(debounceTimeout); 
    debounceTimeout = setTimeout(async () => {
      drinks = await fetchCocktails(value, filterType);
      currentPage = 1; 
      if (drinks.length > 0) {
        paginateAndDisplay(drinks);
    } else {
      showError("Inga resultat hittades.");
                userCardContainer.innerHTML = "";
                paginationContainer.innerHTML = "";
    }
  }, 400); 
  }

  currentPage = 1; 
  paginateAndDisplay(drinks);
});

function whatFilterType(query) {
  if (query.includes("category:")) return "category";
  if (query.startsWith("glass:")) return "glass";
  if (query.startsWith("ingredient:")) return "ingredient";
  return "name";
}


async function showDetails(cocktailId) {
  currentCocktailId = cocktailId;

  try {
    const details = mapRawCocktailData(await detailsCocktail(cocktailId));

    updateDetailsPage(details);

    navigateToDetailsPage();
  } catch (error) {
    console.error("Error loading cocktail details:", error);
  }
}
// FAVORITE PAGE
const ADD_TO_FAV = "Add to favorites";
const REMOVE_FROM_FAV = "Added to favorites";

function saveFavorite(cocktail) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];


  if (!favorites.some((fav) => fav.idDrink === cocktail.idDrink)) {
    
    const cocktailData = {
      ...cocktail,
      strDrinkThumb: cocktail.strDrinkThumb || "https://unsplash.com/photos/brass-colored-cup-filled-with-crushed-ice-with-mint-YeH5EIRFCIs", // Sätt en standardbild om den saknas
      strDrink: cocktail.name || "Unnamed Cocktail" 
    };
    favorites.push(cocktailData);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
}
// Funk ta bort drink från favvolistan
function removeFavorite(cocktailId) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
 
  const updatedFavorites = favorites.filter(fav => fav.idDrink !== cocktailId);
  localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  
  showFavoritesPage();
}

// drink är favorit?
function isFavorite(cocktailId) {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  return favorites.some((fav) => fav.idDrink === cocktailId);
}

// // Funkt  lägg till/ta bort från favvosid
function toggleFavorite(cocktail) {
  if (isFavorite(cocktail.idDrink)) {
    removeFavorite(cocktail.idDrink);
  } else {
    saveFavorite(cocktail);
  }
}

// Visa alla favvo på favvosidan
function showFavoritesPage() {
  const favoriteList = document.querySelector(".favorite-list");
  favoriteList.innerHTML = ""; 

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (favorites.length === 0) {
    favoriteList.innerHTML = "<li>No favorites yet.</li>";
  } else {
    favorites.forEach((fav) => {
      const li = document.createElement("li");

      const favoriteItem = document.createElement("div");
      favoriteItem.classList.add("favorite-item");

      const img = document.createElement("img");
      img.src = fav.strDrinkThumb ? fav.strDrinkThumb : "https://images.unsplash.com/photo-1470338745628-171cf53de3a8?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; 
      img.alt = fav.strDrink;
      img.classList.add("favorite-img");

      const name = document.createElement("span");
      name.textContent = fav.strDrink;
      name.classList.add("favorite-name");

      favoriteItem.appendChild(img);
      favoriteItem.appendChild(name);

      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.classList.add("remove-fav");
      removeButton.dataset.id = fav.idDrink;

      const seeMoreButtonF = document.createElement("button");
      seeMoreButtonF.textContent = "See more";
      seeMoreButtonF.classList.add("see-more-fav");
      seeMoreButtonF.dataset.id = fav.idDrink;

      li.appendChild(favoriteItem);
      li.appendChild(removeButton);
      li.appendChild(seeMoreButtonF);
      favoriteList.appendChild(li);

      removeButton.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        removeFavorite(fav.idDrink); 
        showFavoritesPage(); 
      });

      favoriteItem.addEventListener("click", () => {
        showDetails(fav.idDrink);
      });

      seeMoreButtonF.addEventListener("click", async () => {
        if (!currentCocktailId) {
          console.error("No cocktail selected!");
          return;
        }
      
        showCocktailDetails(currentCocktailId);
      });

    });
  }
}

