import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import AllMeals from './pages/AllMeals.jsx'
import AddEditMeal from './pages/AddEditMeal.jsx'
import ManageCategories from './pages/ManageCategories.jsx'
import Settings from './pages/Settings.jsx'
import FindMealResults from './pages/FindMealResults.jsx'
import MealDetail from './pages/MealDetail.jsx'

// A data router rather than <BrowserRouter>, because view transitions need one:
// <BrowserRouter> pushes its location update through React.startTransition, so a
// route swap can't be forced to commit while the browser is between snapshots,
// and the card morph has nothing to animate to. RouterProvider drives the
// transition itself and hands pages `viewTransition` and useViewTransitionState.
export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/meals', element: <AllMeals /> },
      { path: '/meals/new', element: <AddEditMeal /> },
      { path: '/meals/:id', element: <MealDetail /> },
      { path: '/meals/:id/edit', element: <AddEditMeal /> },
      { path: '/categories', element: <ManageCategories /> },
      { path: '/settings', element: <Settings /> },
      { path: '/find/results', element: <FindMealResults /> },
    ],
  },
])
