import { supabase } from '../lib/supabaseClient'

export async function fetchMeals() {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  return data
}

export async function createMeal(meal) {
  const { data, error } = await supabase
    .from('meals')
    .insert(meal)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMeal(id, meal) {
  const { data, error } = await supabase
    .from('meals')
    .update(meal)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMeal(id) {
  const { error } = await supabase.from('meals').delete().eq('id', id)
  if (error) throw error
}
