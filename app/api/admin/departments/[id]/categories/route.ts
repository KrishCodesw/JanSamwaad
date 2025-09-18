import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  try {
    // Check if user is admin/official
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('=== DEBUG INFO ===')
    console.log('Auth Error:', authError)
    console.log('User:', user ? { id: user.id, email: user.email } : 'No user')
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile Error:', profileError)
    console.log('Profile Data:', profile)
    console.log('Profile Role:', profile?.role)
    console.log('Role Check:', ['admin', 'official'].includes(profile?.role || ''))

    if (profileError || !profile || !['admin', 'official'].includes(profile.role)) {
      console.log('ACCESS DENIED - Reason:', {
        profileError: !!profileError,
        noProfile: !profile,
        wrongRole: profile?.role,
        allowedRoles: ['admin', 'official']
      })
      return NextResponse.json({ 
        error: 'Access denied - Admin/Official access required',
        debug: {
          userId: user.id,
          userEmail: user.email,
          profileFound: !!profile,
          currentRole: profile?.role,
          allowedRoles: ['admin', 'official']
        }
      }, { status: 403 })
    }

    const body = await request.json()
    const { category } = body

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Add category to department
    const { error: insertError } = await supabase
      .from('department_categories')
      .insert({ department_id: params.id, category })

    if (insertError) {
      console.error('Category insert error:', insertError)
      return NextResponse.json({ error: 'Failed to add category' }, { status: 500 })
    }

    console.log('SUCCESS: Category added')
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Department categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  try {
    // Check if user is admin/official
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('=== DELETE DEBUG INFO ===')
    console.log('Auth Error:', authError)
    console.log('User:', user ? { id: user.id, email: user.email } : 'No user')
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile Error:', profileError)
    console.log('Profile Data:', profile)
    console.log('Profile Role:', profile?.role)

    if (profileError || !profile || !['admin', 'official'].includes(profile.role)) {
      console.log('DELETE ACCESS DENIED - Reason:', {
        profileError: !!profileError,
        noProfile: !profile,
        wrongRole: profile?.role
      })
      return NextResponse.json({ 
        error: 'Access denied - Admin/Official access required',
        debug: {
          userId: user.id,
          userEmail: user.email,
          profileFound: !!profile,
          currentRole: profile?.role,
          allowedRoles: ['admin', 'official']
        }
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Remove category from department
    const { error: deleteError } = await supabase
      .from('department_categories')
      .delete()
      .eq('department_id', params.id)
      .eq('category', category)

    if (deleteError) {
      console.error('Category delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Department categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  try {
    // Get categories for department
    const { data: categories, error } = await supabase
      .from('department_categories')
      .select('category')
      .eq('department_id', params.id)
      .order('category')

    if (error) {
      console.error('Categories fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json(categories.map(c => c.category))
    
  } catch (error) {
    console.error('Department categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}