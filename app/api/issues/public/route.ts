import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // <-- IMPORTANT: Using your secure Next.js server client

export async function GET(request: Request) {
  // 1. Initialize inside the handler so it can read the user's secure cookies
  const supabase = await createClient();
  
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
    // 2. Get the currently logged-in user making the request
    const { data: { user } } = await supabase.auth.getUser();

    // 3. QUERY THE DATABASE
    let query = supabase.from('issues').select('*');

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

    // 4. --- THE VOTE CHECK LOGIC ---
    // We use a Set for lightning-fast lookups
    let votedIssueIds = new Set<number>();
    
    // Only bother checking the database if a user is logged in AND there are issues on screen
    if (user && issues && issues.length > 0) {
      // Pluck out just the IDs of the issues we just fetched
      const issueIds = issues.map((i: any) => i.id);
      
      // Ask the database: "Did this specific user vote on any of these specific issues?"
      const { data: votes } = await supabase
        .from('votes')
        .select('issue_id')
        .eq('voter_id', user.id)
        .in('issue_id', issueIds);
        
      if (votes) {
        votes.forEach((v: any) => votedIssueIds.add(v.issue_id));
      }
    }

    // 5. FORMAT THE FINAL DATA
    const hasMore = issues && issues.length > limit;
    const rawDataToSend = hasMore ? issues.slice(0, limit) : (issues || []);

    // Inject the boolean flag into every issue object
    const dataToSend = rawDataToSend.map((issue: any) => ({
      ...issue,
      user_has_voted: votedIssueIds.has(issue.id)
    }));

    return NextResponse.json({
      data: dataToSend,
      meta: {
        page: page,
        hasMore: hasMore,
        total: null 
      }
    });

  } catch (error) {
    console.error('API catch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}