
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // 1. Check Auth (Strict Requirement)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get Params
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '6');
  const status = searchParams.get('status');

  // 3. Calculate Range
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
let query = supabase
      .from('issues')
      .select(`
        *,
        images:issue_images(url),
        vote_count:votes(count),
        status_changes:status_history(
           to_status,
           changed_at,
           notes,
           profiles(display_name)
        )
      `, { count: 'exact' })
      .eq('reporter_email', user.email);

    // 4. Filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 5. Order & Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data: issues, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: issues || [],
      meta: {
        total: count,
        page: page,
        hasMore: count ? (from + (issues?.length || 0)) < count : false
      }
    });

  } catch (error) {
    console.error('My issues error:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}


// import { NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'

// export async function GET(request: Request) {
//   const supabase = await createClient()
//   const { searchParams } = new URL(request.url)
//   const limit = parseInt(searchParams.get('limit') || '50')
//   const statusFilter = searchParams.get('status')
  
//   try {
//     // Get current user
//     const { data: { user }, error: authError } = await supabase.auth.getUser()
//     if (authError || !user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     // Build query to get issues by current user
//     let query = supabase
//       .from('issues')
//       .select(`
//         *,
//         images:issue_images(url),
//         votes(count),
//         status_changes:status_history(
//           from_status,
//           to_status,
//           changed_at,
//           notes,
//           changed_by,
//           profiles!status_history_changed_by_fkey(display_name)
//         )
//       `)
//       .eq('reporter_email', user.email)
//       .order('created_at', { ascending: false })
//       .limit(limit)
    
//     if (statusFilter && statusFilter !== 'all') {
//       query = query.eq('status', statusFilter)
//     }
    
//     const { data: issues, error } = await query
    
//     if (error) {
//       console.error('My issues fetch error:', error)
//       return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
//     }
    
//     // Process vote counts to be numbers instead of objects
//     const processedIssues = (issues || []).map(issue => ({
//       ...issue,
//       vote_count: issue.votes?.[0]?.count || 0
//     }))
    
//     return NextResponse.json(processedIssues)
//   } catch (error) {
//     console.error('My issues error:', error)
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
//   }
// }

