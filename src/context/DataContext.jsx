import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchMeals } from '../api/meals'
import { fetchCategories } from '../api/categories'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [meals, setMeals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    try {
      const [mealsData, categoriesData] = await Promise.all([
        fetchMeals(),
        fetchCategories(),
      ])
      setMeals(mealsData)
      setCategories(categoriesData)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()

    const channel = supabase
      .channel('dinner-decider-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, reload)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reload])

  return (
    <DataContext.Provider value={{ meals, categories, loading, error, reload }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
