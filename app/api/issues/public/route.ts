


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. INITIALIZE OUTSIDE THE HANDLER
// This ensures the client is created once and reused, preventing memory leaks and socket congestion.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '6');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sort') || 'recent';

  const from = (page - 1) * limit;
  const to = from + limit; 

  try {
    // 2. QUERY THE DATABASE
    // let query = supabase
    //   .from('issues')
    //   .select(`
    //     *,
    //     images:issue_images(url)
    //   `);
    let query = supabase
  .from('issues')
  .select('*');

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

    // Pagination
    query = query.range(from, to);

    const startTime = performance.now();
    
    const { data: issues, error } = await query;
    
    const endTime = performance.now();
    console.log(`Supabase Query Took: ${Math.round(endTime - startTime)}ms`);

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const hasMore = issues && issues.length > limit;
    const dataToSend = hasMore ? issues.slice(0, limit) : (issues || []);

    return NextResponse.json({
      data: dataToSend,
      meta: {
        page: page,
        hasMore: hasMore,
        total: null 
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}