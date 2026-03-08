import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '6');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sort') || 'recent';

  const from = (page - 1) * limit;
  // THE TRICK: Ask for one extra item to check if there is a next page
  const to = from + limit; 

  try {
    // REMOVED: { count: 'exact' } - This is the biggest speed boost
    let query = supabase
      .from('issues')
      .select(`
        *,
        images:issue_images(url),
        vote_count:votes(count) 
      `);

    // Filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.contains('tags', [category]);
    }

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    // Sorting
    if (sortBy === 'priority') {
      query = query.order('flagged', { ascending: false })
                   .order('created_at', { ascending: false }); 
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination (fetching limit + 1)
    query = query.range(from, to);


    const startTime = performance.now();


    const { data: issues, error } = await query;

    const endTime = performance.now();
console.log(`Supabase Query Took: ${Math.round(endTime - startTime)}ms`);

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if we got that extra item back
    const hasMore = issues && issues.length > limit;
    
    // Slice off the extra item before sending to the client
    const dataToSend = hasMore ? issues.slice(0, limit) : (issues || []);

    return NextResponse.json({
      data: dataToSend,
      meta: {
        page: page,
        hasMore: hasMore,
        // Since we removed exact count, we can just return null or a generic label. 
        // Note: You will need to remove the exact `{totalCount}` badge from your frontend UI.
        total: null 
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}