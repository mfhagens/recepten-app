export interface Recipe {
  id: number;
  name: string;
  ingredients: string;
  instructions: string;
  tags: string;
  liked_by: string;
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
