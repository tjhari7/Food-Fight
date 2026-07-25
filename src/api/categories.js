import { supabase } from '../lib/supabaseClient'

export const UNASSIGNED_NAME = 'Unassigned'

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createCategory(name) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameCategory(id, name) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Reassigns any meals pointing at this category to "Unassigned", then
// deletes the category. Not atomic (no service-role/RPC access), but safe
// for this app's low write-concurrency (3 users).
export async function deleteCategory(id, categories) {
  const unassigned = categories.find((c) => c.name === UNASSIGNED_NAME)
  if (!unassigned) throw new Error('Unassigned meal type not found')
  if (id === unassigned.id) throw new Error('Cannot delete the Unassigned meal type')

  const { error: reassignError } = await supabase
    .from('meals')
    .update({ category_id: unassigned.id })
    .eq('category_id', id)
  if (reassignError) throw reassignError

  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  if (deleteError) throw deleteError
}
