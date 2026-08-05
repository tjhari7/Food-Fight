// A snapshot of the real app's meal roster, used by both onboarding variants.
//
// Carries the same fields the real `meals` table does — prep/cook time, full
// macros, and ingredients — so the Main Event card and the Champion screen
// render exactly like their real-app counterparts instead of the sparser
// "title only" look a partial record would produce. Voice-added meals are
// deliberately title-only by contrast — standing them next to these in the
// roster is what shows the difference between the two entry paths.
//
// This is a point-in-time copy, not a live read: onboarding is a prototype
// flow for user testing, so the roster lives in React state and dies with the
// session. Nothing here is written to Supabase, and edits made here never
// touch the real `meals` table.
const STARTER_MEALS = [
  { title: 'Sandwiches', category: 'American', prep_time: 20, cook_time: 35, protein_g: 34, carbs_g: 23, fats_g: 5, ingredients: [{ name: 'Bread', amount: '' }, { name: 'Cheese', amount: '' }] },
  { title: 'Potatoes & Veggies', category: 'American', prep_time: 5, cook_time: 10, protein_g: 28, carbs_g: 65, fats_g: 24, ingredients: [{ name: 'Potatoes', amount: '' }, { name: 'Broccoli', amount: '' }, { name: 'Carrots', amount: '' }, { name: 'Olive Oil', amount: '' }] },
  { title: 'Macaroni & Cheese', category: 'American', prep_time: 20, cook_time: 0, protein_g: 20, carbs_g: 68, fats_g: 13, ingredients: [{ name: 'Macaroni Pasta', amount: '' }, { name: 'Cheddar Cheese', amount: '' }, { name: 'Milk', amount: '' }, { name: 'Butter', amount: '' }] },
  { title: 'Noodle Stir Fry', category: 'Vegetarian', prep_time: 15, cook_time: 15, protein_g: 34, carbs_g: 60, fats_g: 25, ingredients: [{ name: 'Noodles', amount: '56g' }, { name: 'Tofu', amount: '4oz' }, { name: 'Veggies', amount: '1 cup' }, { name: 'Soy Sauce', amount: '2 Tbsp' }] },
  { title: 'Burritos', category: 'Mexican', prep_time: 10, cook_time: 10, protein_g: 32, carbs_g: 48, fats_g: 10, ingredients: [{ name: 'Tortilla', amount: '' }, { name: 'Rice', amount: '' }, { name: 'Beans', amount: '' }, { name: 'Cheese', amount: '' }, { name: 'Tofu', amount: '' }, { name: 'Beyond Beef', amount: '' }, { name: 'Avocado', amount: '' }, { name: 'Mushrooms', amount: '' }, { name: 'Bell Peppers', amount: '' }, { name: 'Yogurt', amount: '' }] },
  { title: 'Rice Stir Fry', category: 'Asian', prep_time: 15, cook_time: 20, protein_g: 43, carbs_g: 55, fats_g: 10, ingredients: [{ name: 'Rice', amount: '' }, { name: 'Soy Sauce', amount: '' }, { name: 'Eggs', amount: '' }, { name: 'Mixed Vegetables', amount: '' }] },
  { title: 'Eggs & Sausage', category: 'Breakfast', prep_time: 15, cook_time: 30, protein_g: 41, carbs_g: 67, fats_g: 23, ingredients: [{ name: 'Eggs', amount: '' }, { name: 'Veggie Sausage', amount: '' }, { name: 'Bell Peppers', amount: '' }, { name: 'Onion', amount: '' }] },
  { title: 'Chili & Potatoes', category: 'American', prep_time: 20, cook_time: 30, protein_g: 12, carbs_g: 35, fats_g: 11, ingredients: [] },
  { title: 'Tacos', category: 'Mexican', prep_time: 10, cook_time: 10, protein_g: 41, carbs_g: 45, fats_g: 6, ingredients: [{ name: 'Tortillas', amount: '' }, { name: 'Beyond Beef', amount: '' }, { name: 'Cheese', amount: '' }, { name: 'Lettuce', amount: '' }, { name: 'Salsa', amount: '' }] },
  { title: 'Burgers', category: 'American', prep_time: 15, cook_time: 15, protein_g: 31, carbs_g: 22, fats_g: 17, ingredients: [{ name: 'Beyond Meat', amount: '' }, { name: 'Burger Bun', amount: '' }, { name: 'Lettuce', amount: '' }, { name: 'Tomato', amount: '' }, { name: 'Cheese', amount: '' }] },
  { title: 'Grilled Cheese', category: 'American', prep_time: 5, cook_time: 10, protein_g: 37, carbs_g: 67, fats_g: 14, ingredients: [{ name: 'Bread', amount: '' }, { name: 'Cheddar Cheese', amount: '' }, { name: 'Butter', amount: '' }, { name: 'Tomato Soup', amount: '' }] },
  { title: 'Ramen', category: 'Asian', prep_time: 25, cook_time: 40, protein_g: 32, carbs_g: 45, fats_g: 7, ingredients: [{ name: 'Ramen Noodles', amount: '' }, { name: 'Chicken Broth', amount: '' }, { name: 'Soft-Boiled Egg', amount: '' }, { name: 'Green Onions', amount: '' }] },
  { title: 'Curry w/ Naan', category: 'Asian', prep_time: 10, cook_time: 20, protein_g: 45, carbs_g: 63, fats_g: 13, ingredients: [{ name: 'Curry Powder', amount: '' }, { name: 'Coconut Milk', amount: '' }, { name: 'Chickpeas', amount: '' }, { name: 'Naan Bread', amount: '' }] },
  { title: 'Hummas Veggie Wrap', category: 'Healthy', prep_time: 15, cook_time: 10, protein_g: 25, carbs_g: 68, fats_g: 21, ingredients: [{ name: 'Tortilla Wrap', amount: '' }, { name: 'Hummas', amount: '' }] },
  { title: 'Fried Rice', category: 'Asian', prep_time: 20, cook_time: 5, protein_g: 22, carbs_g: 30, fats_g: 23, ingredients: [{ name: 'Rice', amount: '' }, { name: 'Eggs', amount: '' }, { name: 'Soy Sauce', amount: '' }, { name: 'Peas & Carrots', amount: '' }, { name: 'Green Onions', amount: '' }] },
  { title: 'Pesto Pasta', category: 'Italian', prep_time: 5, cook_time: 15, protein_g: 37, carbs_g: 34, fats_g: 17, ingredients: [{ name: 'Pasta', amount: '' }, { name: 'Basil Pesto', amount: '' }, { name: 'Parmesan Cheese', amount: '' }, { name: 'Pine Nuts', amount: '' }] },
  { title: 'Stuffed Peppers', category: 'Vegetarian', prep_time: 25, cook_time: 0, protein_g: 44, carbs_g: 68, fats_g: 8, ingredients: [{ name: 'Bell Peppers', amount: '' }, { name: 'Quinoa', amount: '' }, { name: 'Black Beans', amount: '' }, { name: 'Diced Tomatoes', amount: '' }, { name: 'Corn', amount: '' }] },
  { title: 'Pancakes', category: 'Breakfast', prep_time: 20, cook_time: 30, protein_g: 29, carbs_g: 56, fats_g: 22, ingredients: [{ name: 'Pancake Mix', amount: '' }, { name: 'Eggs', amount: '' }, { name: 'Milk', amount: '' }, { name: 'Mixed Berries', amount: '' }] },
  { title: 'Lentils & Rice', category: 'Asian', prep_time: 5, cook_time: 10, protein_g: 28, carbs_g: 68, fats_g: 24, ingredients: [{ name: 'Lentils', amount: '' }, { name: 'Rice', amount: '' }, { name: 'Naan Bread', amount: '' }, { name: 'Onion', amount: '' }] },
  { title: 'Pizza', category: 'Vegetarian', prep_time: 30, cook_time: 20, protein_g: 25, carbs_g: 50, fats_g: 20, ingredients: [{ name: 'Sauce', amount: '' }, { name: 'Pizza Dough', amount: '' }, { name: 'Mozzarella Cheese', amount: '' }, { name: 'Bell Peppers', amount: '' }, { name: 'Mushrooms', amount: '' }] },
  { title: 'Fettuccine Alfredo', category: 'Italian', prep_time: 5, cook_time: 15, protein_g: 43, carbs_g: 44, fats_g: 10, ingredients: [{ name: 'Fettuccine Pasta', amount: '' }, { name: 'Parmesan Cheese', amount: '' }, { name: 'Butter', amount: '' }, { name: 'Heavy Cream', amount: '' }] },
  { title: 'Spaghetti', category: 'Italian', prep_time: 5, cook_time: 15, protein_g: 15, carbs_g: 35, fats_g: 18, ingredients: [{ name: 'Pasta', amount: '' }, { name: 'Marinara Sauce', amount: '' }, { name: 'Garlic', amount: '' }, { name: 'Basil', amount: '' }, { name: 'Onion', amount: '' }] },
  { title: 'Quesadillas', category: 'Mexican', prep_time: 10, cook_time: 10, protein_g: 16, carbs_g: 32, fats_g: 14, ingredients: [{ name: 'Flour Tortillas', amount: '' }, { name: 'Cheddar Cheese', amount: '' }, { name: 'Bell Peppers', amount: '' }, { name: 'Onion', amount: '' }, { name: 'Black Beans', amount: '' }] },
  { title: 'Jackfruit Tacos', category: 'Mexican', prep_time: 15, cook_time: 20, protein_g: 8, carbs_g: 52, fats_g: 14, ingredients: [{ name: 'Corn Tortillas', amount: '' }, { name: 'Jackfruit', amount: '' }, { name: 'Onion', amount: '' }, { name: 'Chipotle Peppers', amount: '' }, { name: 'Cilantro', amount: '' }, { name: 'Lime', amount: '' }] },
  { title: 'Waffles', category: 'Breakfast', prep_time: 5, cook_time: 10, protein_g: 12, carbs_g: 44, fats_g: 23, ingredients: [{ name: 'Waffle Mix', amount: '' }] },
  { title: 'French Toast', category: 'Breakfast', prep_time: 8, cook_time: 12, protein_g: 16, carbs_g: 50, fats_g: 22, ingredients: [{ name: 'Bread', amount: '' }, { name: 'Eggs', amount: '' }, { name: 'Syrup', amount: '' }] },
  { title: 'Lasagna', category: 'Italian', prep_time: 30, cook_time: 20, protein_g: 16, carbs_g: 66, fats_g: 24, ingredients: [{ name: 'Lasagna Noodles', amount: '' }, { name: 'Cheese', amount: '' }, { name: 'Sauce', amount: '' }] },
  { title: 'Pad Thai', category: 'Asian', prep_time: 20, cook_time: 14, protein_g: 35, carbs_g: 55, fats_g: 30, ingredients: [{ name: 'Pad Noodles', amount: '' }] },
  { title: 'Mapo Tofu', category: 'Asian', prep_time: 20, cook_time: 20, protein_g: 22, carbs_g: 49, fats_g: 26, ingredients: [{ name: 'Tofu', amount: '' }] },
  { title: 'Bibimbap', category: 'Asian', prep_time: 20, cook_time: 20, protein_g: 34, carbs_g: 65, fats_g: 18, ingredients: [{ name: 'Rice', amount: '' }] },
  { title: 'Tofu Scramble', category: 'Breakfast', prep_time: 14, cook_time: 14, protein_g: 28, carbs_g: 43, fats_g: 23, ingredients: [{ name: 'Tofu', amount: '' }, { name: 'Eggs', amount: '' }] },
  { title: 'Sweet Potato Bowl', category: 'Healthy', prep_time: 20, cook_time: 15, protein_g: 18, carbs_g: 52, fats_g: 22, ingredients: [{ name: 'Sweet Potato', amount: '' }] },
  { title: 'Rice Bowl', category: 'Healthy', prep_time: 12, cook_time: 16, protein_g: 25, carbs_g: 50, fats_g: 9, ingredients: [{ name: 'Rice', amount: '' }, { name: 'Veggies', amount: '' }] },
  { title: 'Stuffed Sweet Potatoes', category: 'Healthy', prep_time: 18, cook_time: 20, protein_g: 26, carbs_g: 55, fats_g: 32, ingredients: [{ name: 'Sweet Potato', amount: '' }, { name: 'Beans', amount: '' }, { name: 'Greek Yogurt', amount: '' }] },
  { title: 'Avocado Toast', category: 'Breakfast', prep_time: 5, cook_time: 5, protein_g: 12, carbs_g: 32, fats_g: 24, ingredients: [{ name: 'Avocado', amount: '' }] },
  { title: 'Udon Noodles', category: 'Asian', prep_time: 15, cook_time: 15, protein_g: 36, carbs_g: 59, fats_g: 23, ingredients: [{ name: 'Udon Noodles', amount: '' }, { name: 'Garlic', amount: '' }] },
  { title: 'Quinoa Salad Bowl', category: 'Vegetarian', prep_time: 8, cook_time: 20, protein_g: 22, carbs_g: 43, fats_g: 26, ingredients: [{ name: 'Quinoa', amount: '' }, { name: 'Greens', amount: '' }] },
  { title: 'Ricotta Stuffed Shells', category: 'Italian', prep_time: 30, cook_time: 25, protein_g: 35, carbs_g: 68, fats_g: 30, ingredients: [{ name: 'Ricotta', amount: '' }, { name: 'Shell Pasta', amount: '' }, { name: 'Spinach', amount: '' }] },
  { title: 'Teriyaki Tofu Bowl', category: 'Asian', prep_time: 16, cook_time: 16, protein_g: 39, carbs_g: 64, fats_g: 34, ingredients: [{ name: 'Tofu', amount: '' }, { name: 'Rice', amount: '' }, { name: 'Veggies', amount: '' }, { name: 'Teriyaki Sauce', amount: '' }] },
]

// The meal types offered in onboarding's own forms. Kept local rather than
// read from the categories table, because nothing in this flow touches
// Supabase — mirrors the real app's category list minus "Unassigned", which
// these forms already offer as their own blank/default option.
export const ONBOARDING_CATEGORIES = [
  'American',
  'Asian',
  'Breakfast',
  'Healthy',
  'Italian',
  'Mexican',
  'Vegetarian',
]

export function buildStarterMeals() {
  return STARTER_MEALS.map((meal, i) => ({
    ...meal,
    id: `starter-${i}`,
    source: 'starter',
  }))
}

export const STARTER_COUNT = STARTER_MEALS.length

// Shown as preview cards on the starter pack screen — enough to make the offer
// concrete without turning the screen into a list to read.
export const STARTER_PREVIEW = ['Tacos', 'Burgers', 'Ramen']

// Shown on variant B's "you already have a pack" reveal (Figma B-4). The
// Figma frame's own copy uses "Stir Fry" as a friendly stand-in, but that
// title doesn't exist in STARTER_MEALS — using it here would make the 5th
// row visibly change text the moment "Load All" swaps in the real title, so
// this list uses the real "Noodle Stir Fry" instead.
//
// This exact order is pinned: PrebuiltMeals.jsx keeps these five titles first
// in the same order once "Load All" swaps in the full roster, so the reveal
// doesn't visibly reshuffle out from under the user.
export const STARTER_PREVIEW_LIST = ['Burgers', 'Tacos', 'Waffles', 'Sandwiches', 'Noodle Stir Fry']
