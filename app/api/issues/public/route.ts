// import { NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'

// export async function GET(request: Request) {
//   // Use the standard server client, which can act as 'anon'
//   const supabase = await createClient() 
//   const { searchParams } = new URL(request.url)
//   const limit = parseInt(searchParams.get('limit') || '100')

//   try {
//     // !! NO AUTH CHECKS HERE !!
//     // This is a public route.

//     let query = supabase
//       .from('issues')
//       .select(`
//         *,
//         images:issue_images(url),
//         vote_count:votes(count),
//         assignment:assignments(
//           department:departments(name),
//           assigned_at,
//           notes
//         )
//       `)
//       .order('flagged', { ascending: false })
//       .order('created_at', { ascending: false })
//       .limit(limit)

//     const { data: issues, error } = await query

//     if (error) {
//       console.error('Public issues fetch error:', error)
//       return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 })
//     }

//     return NextResponse.json(issues || [])
    
//   } catch (error) {
//     console.error('Public issues error:', error)
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
//   }
// }


// import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';

// export async function GET(request: Request) {
//   const supabase = await createClient();
//   const { searchParams } = new URL(request.url);

//   // Pagination Params
//   const page = parseInt(searchParams.get('page') || '1');
//   const limit = parseInt(searchParams.get('limit') || '6');
  
//   // Filter Params
//   const status = searchParams.get('status');
//   const category = searchParams.get('category');
//   const search = searchParams.get('search');
//   const sortBy = searchParams.get('sort') || 'recent';

//   // Calculate Range for Supabase
//   const from = (page - 1) * limit;
//   const to = from + limit - 1;

//   try {
//     let query = supabase
//       .from('issues')
//       .select(`
//         *,
//         images:issue_images(url),
//         vote_count:votes(count),
//         assignment:assignments(
//           department:departments(name),
//           assigned_at,
//           notes
//         )
//       `, { count: 'exact' }); // Request total count for "Has More" check

//     // --- APPLY FILTERS SERVER-SIDE ---
    
//     // 1. Status Filter
//     if (status && status !== 'all') {
//       query = query.eq('status', status);
//     }

//     // 2. Category (Tags) Filter
//     // Assuming 'tags' is a text array column in Postgres
//     if (category && category !== 'all') {
//       query = query.contains('tags', [category]);
//     }

//     // 3. Search (Description)
//     if (search) {
//       query = query.ilike('description', `%${search}%`);
//     }

//     // 4. Sorting
//     if (sortBy === 'priority') {
//       // Sort by flagged first, then votes (custom logic might be needed if complex)
//       query = query.order('flagged', { ascending: false })
//                    .order('vote_count', { ascending: false, nullsFirst: false });
//     } else {
//       // Default: Recent
//       query = query.order('created_at', { ascending: false });
//     }

//     // --- APPLY PAGINATION ---
//     query = query.range(from, to);

//     const { data: issues, error, count } = await query;

//     if (error) {
//       console.error('Fetch error:', error);
//       return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
//     }

//     return NextResponse.json({
//       data: issues || [],
//       meta: {
//         total: count,
//         page: page,
//         limit: limit,
//         hasMore: count ? (from + (issues?.length || 0)) < count : false
//       }
//     });

//   } catch (error) {
//     console.error('Server error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


// ---------------------------------------------------
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // 1. Get Query Params
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '6');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sort') || 'recent';

  // 2. Calculate Range for Supabase (0-indexed)
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('issues')
      .select(`
        *,
        images:issue_images(url),
        vote_count:votes(count)
      `, { count: 'exact' });

    // 3. Apply Filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      // Assuming 'tags' is a text array (text[]) in Supabase
      query = query.contains('tags', [category]);
    }

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    // 4. Apply Sorting
    if (sortBy === 'priority') {
      // Sort by flagged first, then votes (if your DB supports nullsLast etc)
      query = query.order('flagged', { ascending: false })
                   .order('created_at', { ascending: false }); 
    } else {
      // Default: Recent
      query = query.order('created_at', { ascending: false });
    }

    // 5. Apply Pagination
    query = query.range(from, to);

    const { data: issues, error, count } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 6. Return Data + Meta for "Load More" logic
    return NextResponse.json({
      data: issues || [],
      meta: {
        total: count,
        page: page,
        hasMore: count ? (from + (issues?.length || 0)) < count : false
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}