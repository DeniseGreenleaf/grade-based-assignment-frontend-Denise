
// const randomCocktailURL = "www.thecocktaildb.com/api/json/v1/1/random.php";
// const seeMoreBtn = document.querySelector(".btn");
// const searchBar = document.querySelector('input[name="searchbar"]');


export async function searchByName(cocktailQuery) { 
  const searchByNameURL = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${cocktailQuery}`; 
  const response = await fetch(searchByNameURL); 
  const data = await response.json();
  return data.drinks || []; 
}

export async function detailsCocktail(id) {
  const detailsPageURL = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`;
  const response = await fetch(detailsPageURL);
  const data = await response.json();
  return data.drinks ? data.drinks[0] : null; // Return the first drink or null if not found

}

export async function randomCocktail() {
  const randomCocktailURL = "https://www.thecocktaildb.com/api/json/v1/1/random.php"
  const response = await fetch(randomCocktailURL);
  const data = await response.json();
  return data.drinks ? data.drinks[0] : null; // Returnera den slumpmässiga cocktailen

}

export function mapRawCocktailData(rawCocktial) {
  return {
    id: rawCocktial.idDrink,
    name: rawCocktial.strDrink,
    tags: rawCocktial.strTags ? rawCocktial.strTags.split(",") : [],
    category: rawCocktial.strCategory,
    alcoholic: rawCocktial.strAlcoholic === "Alcoholic",
    glass: rawCocktial.strGlass,
    instructions: rawCocktial.strInstructions,
    thumbnail: rawCocktial.strDrinkThumb,
    ingredients: Array.from({ length: 15 })
      .map((_, i) => ({
        ingredient: rawCocktial[`strIngredient${i + 1}`],
        measure: rawCocktial[`strMeasure${i + 1}`],
      }))
      .filter((item) => item.ingredient),
  };
}


export async function getAllCocktails() {
  try {
    const response = await fetch("https://www.thecocktaildb.com/api/json/v1/1/search.php?f=a");
    if (!response.ok) {
      throw new Error("Failed to fetch cocktails");
    }
    const data = await response.json();
    return data.drinks || [];
  } catch (error) {
    console.error("Error fetching all cocktails:", error);
    return [];
  }
}