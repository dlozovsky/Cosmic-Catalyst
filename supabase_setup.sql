-- Cosmic Catalyst Supabase Setup Script

-- Create the leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_name TEXT NOT NULL,
    email TEXT NOT NULL,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    wave INTEGER NOT NULL,
    shared_on_x BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous inserts (allows anyone to submit scores)
CREATE POLICY "Allow anonymous inserts" ON public.leaderboard
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Create policy for reading leaderboard data (hide emails for privacy)
CREATE POLICY "Allow public reads without emails" ON public.leaderboard
    FOR SELECT
    TO anon
    USING (true);

-- Create an index on score for faster leaderboard queries
CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON public.leaderboard (score DESC);

-- Create a view that excludes email addresses for public consumption
CREATE OR REPLACE VIEW public.leaderboard_public AS
SELECT 
    id,
    player_name,
    score,
    level,
    wave,
    shared_on_x,
    created_at
FROM public.leaderboard;

-- Grant access to the public view
GRANT SELECT ON public.leaderboard_public TO anon;

-- Add a function to get top scores
CREATE OR REPLACE FUNCTION public.get_top_scores(limit_count INTEGER DEFAULT 10)
RETURNS SETOF public.leaderboard_public
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        id,
        player_name,
        score,
        level,
        wave,
        shared_on_x,
        created_at
    FROM public.leaderboard
    ORDER BY score DESC
    LIMIT limit_count;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_top_scores TO anon;

-- Add a function to get a player's rank
CREATE OR REPLACE FUNCTION public.get_player_rank(player_score INTEGER)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*) + 1
    FROM public.leaderboard
    WHERE score > player_score;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_player_rank TO anon; 