import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();


export async function GET(
  request: Request,
  // Note: params must be awaited in Next.js 15
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('issue_images')
      .select('url')
      .eq('issue_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cache the response heavily for 1 hour
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}