export interface Recipe {
  id: number;
  name: string;
  ingredients: string;
  instructions: string;
  tags: string;
  liked_by: string;
  url: string;
  photo_url: string;
  duration: string;
}

export interface RecipeWithStats extends Recipe {
  mealCount: number;
  lastEaten: string | null;
}

export interface Meal {
  id: number;
  recipe_id: number;
  ate_on: string;
  notes: string;
}

export interface Plan {
  id: number;
  date: string;
  recipe_id: number | null;
  eaters: string;
}
