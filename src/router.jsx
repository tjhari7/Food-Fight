import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import AllMeals from './pages/AllMeals.jsx'
import AddEditMeal from './pages/AddEditMeal.jsx'
import ManageCategories from './pages/ManageCategories.jsx'
import Settings from './pages/Settings.jsx'
import FindMealResults from './pages/FindMealResults.jsx'
import MealDetail from './pages/MealDetail.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Legal from './pages/Legal.jsx'

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
      // Two onboarding variants under test — /onboarding/a (10 screens) and
      // /onboarding/b (6). Neither writes to Supabase; see onboarding/flows.js.
      { path: '/onboarding/:variant', element: <Onboarding /> },
      // Linked from the paywall, which App Store guideline 3.1.2 requires. Both
      // are honest placeholders rather than drafted documents — see Legal.jsx
      // for why, and for what has to happen before launch.
      { path: '/terms', element: <Legal doc="terms" /> },
      { path: '/privacy', element: <Legal doc="privacy" /> },
    ],
  },
])
