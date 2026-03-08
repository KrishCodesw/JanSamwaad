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