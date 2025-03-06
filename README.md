# Cosmic Catalyst

A space shooter game built with p5.js and Supabase.

## Play the Game

You can play the game online at: [https://dlozovsky.github.io/Cosmic-Catalyst/](https://dlozovsky.github.io/Cosmic-Catalyst/)

## Game Features

- Fast-paced space shooter gameplay
- Multiple enemy types
- Power-ups and special abilities
- Progressive difficulty with waves and levels
- Global leaderboard using Supabase

## How to Play

- Use WASD or arrow keys to move your ship
- Press SPACE to shoot
- Collect power-ups to enhance your abilities
- Survive as long as possible and achieve the highest score

## Development

This game was built using:
- p5.js for rendering and game logic
- Supabase for the backend leaderboard functionality

## Local Development

To run the game locally:
1. Clone this repository
2. Open `index.html` in your browser

## Credits

- Game developed by [Your Name]
- Sound effects and music from [Source if applicable]
- Inspired by classic arcade space shooters

## Last Updated

This game was last updated on May 5, 2024.

## Features

- Smooth, physics-based spaceship controls
- Multiple enemy types with unique behaviors
- Power-up system (Triple Shot, Shield, Rapid Fire)
- Wave-based progression with adaptive difficulty
- Lives system with visual feedback
- Particle effects and visual polish
- Global leaderboard with Supabase integration
- Social sharing via X (Twitter)
- Responsive design that works on different screen sizes
- Detailed help documentation

## Leaderboard & Social Sharing

### Leaderboard
The game features a global leaderboard that tracks the top scores from players around the world. After a game ends, you can submit your score by entering your name and email. View the leaderboard at any time by clicking the trophy icon in the bottom right corner of the screen.

### Social Sharing
Share your achievements on X (formerly Twitter) directly from the game! After submitting your score, you'll have the option to share your score, level, and wave reached with your followers. Challenge your friends to beat your high score and help spread the word about Cosmic Catalyst.

#### How X Integration Works
1. When a player submits their score, they'll see a "Share on X" button
2. Clicking this button opens a new window with a pre-populated tweet containing:
   - Their final score
   - The level and wave they reached
   - A link back to the game
   - Hashtags: #CosmicCatalyst #SpaceShooter
3. The game tracks which scores have been shared on X in the database
4. No X API key is required as this uses X's Web Intent API

#### Customizing the X Share Message
You can customize the message that appears in the X share by editing the `shareOnX` function in `index.html`:

```javascript
function shareOnX(playerName, score, wave, level) {
    const text = `I just scored ${score} points in Cosmic Catalyst, reaching Wave ${wave} and Level ${level}! Can you beat my score? Play now: ${window.location.href} #CosmicCatalyst #SpaceShooter`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    // Rest of the function...
}
```

Modify the template string to change the message format, add different hashtags, or include other game information.

#### Tracking Social Sharing Analytics
The game tracks which scores have been shared on X by updating the `shared_on_x` field in the database. You can use this data to:

1. **Analyze Share Rates**: Query your Supabase database to see what percentage of players share their scores
   ```sql
   -- Example query to get share rate
   SELECT 
     COUNT(*) as total_scores,
     SUM(CASE WHEN shared_on_x = true THEN 1 ELSE 0 END) as shared_scores,
     (SUM(CASE WHEN shared_on_x = true THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100 as share_percentage
   FROM leaderboard;
   ```

2. **Identify Viral Potential**: Determine which score ranges are most likely to be shared
   ```sql
   -- Example query to analyze sharing by score ranges
   SELECT 
     CASE 
       WHEN score < 1000 THEN 'Low (< 1000)'
       WHEN score BETWEEN 1000 AND 5000 THEN 'Medium (1000-5000)'
       ELSE 'High (> 5000)'
     END as score_range,
     COUNT(*) as total_in_range,
     SUM(CASE WHEN shared_on_x = true THEN 1 ELSE 0 END) as shared_count,
     (SUM(CASE WHEN shared_on_x = true THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100 as share_percentage
   FROM leaderboard
   GROUP BY score_range
   ORDER BY share_percentage DESC;
   ```

3. **Track Traffic Sources**: Add UTM parameters to your game URL in the share message to track which players come from social shares
   ```javascript
   // Example of adding UTM parameters
   const gameUrl = `${window.location.origin}${window.location.pathname}?utm_source=x&utm_medium=social&utm_campaign=score_share`;
   const text = `I just scored ${score} points in Cosmic Catalyst! Play now: ${gameUrl} #CosmicCatalyst`;
   ```

This data can help you optimize your game's viral loop and understand how social sharing contributes to player acquisition.

## Setup Instructions

### Local Development

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/cosmic-catalyst.git
   cd cosmic-catalyst
   ```

2. Open the project in your favorite code editor.

3. Set up a local web server to run the game. You can use:
   - Python: `python -m http.server`
   - Node.js: `npx serve`
   - VS Code Live Server extension

4. Open your browser and navigate to the local server (usually http://localhost:8000 or similar).

### Supabase Setup

To enable the leaderboard functionality and X (Twitter) sharing integration, follow these detailed steps:

1. **Create a Supabase Account and Project**
   - Sign up for a free account at [Supabase](https://supabase.com/)
   - Create a new project and give it a name (e.g., "cosmic-catalyst")
   - Once the project is created, note your project URL and anon key from the API settings page

2. **Set Up the Database**
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy and paste the entire contents of the provided `supabase_setup.sql` file
   - Click "Run" to execute the script, which will:
     - Create the `leaderboard` table with all required columns
     - Set up Row Level Security (RLS) policies for data protection
     - Create a public view that hides email addresses
     - Add helper functions for retrieving leaderboard data
     - Create necessary indexes for performance

3. **Configure Your Game**
   - Open `index.html` in your code editor
   - Locate the Supabase configuration section (around line 285)
   - Replace the placeholder values with your actual Supabase credentials:
   ```javascript
   const supabaseUrl = 'https://your-project-id.supabase.co';
   const supabaseKey = 'your-anon-key';
   ```

4. **Verify the Setup**
   - Run your game locally
   - Play a game until you reach the game over screen
   - Submit a test score with your name and email
   - Check the Supabase Table Editor to confirm your score was recorded
   - Click the trophy icon to view the leaderboard and verify it displays correctly

5. **Test X (Twitter) Integration**
   - After submitting a score, click the "Share on X" button
   - Verify that a new window opens with a pre-populated tweet containing your score
   - If you want to actually post the tweet, you'll need to be logged into X in your browser

6. **Understanding the Database Structure**
   The `leaderboard` table contains the following columns:
   - `id`: Unique identifier for each score entry (UUID)
   - `player_name`: The name entered by the player
   - `email`: The player's email address (kept private)
   - `score`: The player's final score
   - `level`: The level reached
   - `wave`: The wave reached
   - `shared_on_x`: Boolean flag indicating if the score was shared on X
   - `created_at`: Timestamp when the score was submitted

7. **Security Considerations**
   - The setup includes Row Level Security (RLS) policies that:
     - Allow anonymous users to submit scores
     - Prevent modification of existing scores
     - Hide email addresses in public queries
   - For production use, consider adding additional security measures like rate limiting

8. **Troubleshooting**
   - If scores aren't being submitted, check the browser console for errors
   - Verify your Supabase URL and anon key are correct
   - Ensure your database tables were created correctly
   - Check that your RLS policies are properly configured

For more advanced customization of the leaderboard functionality, refer to the [Supabase documentation](https://supabase.com/docs).

## Customization

### Difficulty
You can adjust the game difficulty by modifying these variables in `sketch.js`:
- `shotDelay`: Time between shots (lower = easier)
- `levelThreshold`: Points needed to level up (higher = easier)
- Enemy spawn rates and speeds

### Visuals
The game uses CSS variables for styling. You can modify the colors and visual effects in the `<style>` section of `index.html`.

## Credits

- Built with [p5.js](https://p5js.org/)
- Leaderboard powered by [Supabase](https://supabase.com/)
- Font: [Orbitron](https://fonts.google.com/specimen/Orbitron) from Google Fonts

## License

This project is licensed under the MIT License - see the LICENSE file for details. 

## Implementation Summary

This project includes the following key implementations:

### Leaderboard System
- Global leaderboard using Supabase as the backend database
- Secure storage of player scores with privacy protection for emails
- Sorting and ranking of top scores
- Easy-to-use submission form after game over
- Floating trophy button to view the leaderboard at any time

### X (Twitter) Integration
- One-click sharing of game scores on X
- Pre-formatted messages with score, level, and wave information
- Tracking of which scores have been shared
- No API keys required (uses X's Web Intent API)
- Analytics capabilities to measure viral impact

### Database Structure
- Optimized Supabase database with proper indexes
- Row Level Security (RLS) for data protection
- Public view that excludes sensitive information
- Helper functions for common leaderboard operations
- Tracking of social sharing metrics

### User Experience
- Clean, intuitive interface for score submission
- Responsive design that works on all devices
- Clear instructions for setting up the backend
- Customizable sharing messages and analytics

These features work together to create an engaging game experience that encourages social sharing and friendly competition through the leaderboard system. 

## Secure API Key Handling

### Security Risks of Frontend API Keys

Including your Supabase URL and anon key directly in your HTML/JavaScript code poses several security risks:

- Anyone who views your source code can see your API keys
- Malicious users could use these keys to make unauthorized database queries
- Your database could be filled with spam or invalid data
- You might exceed usage limits, leading to unexpected costs

### Recommended Approaches

#### Option 1: Backend API Proxy (Most Secure)

Create a simple backend service that handles all Supabase interactions:

1. **Set up a server** using Node.js, Python, or another backend technology
2. **Store your Supabase credentials** as environment variables on the server
3. **Create API endpoints** that your game calls instead of directly accessing Supabase
4. **Implement proper validation** on the server to prevent abuse

Example Node.js server with Express:

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase credentials stored as environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// API endpoint to submit score
app.post('/api/scores', async (req, res) => {
  try {
    const { playerName, email, score, level, wave } = req.body;
    
    // Validate input
    if (!playerName || !email || !score) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Submit to Supabase
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ 
        player_name: playerName,
        email: email,
        score: score,
        level: level || 1,
        wave: wave || 1,
        shared_on_x: false
      }]);
      
    if (error) throw error;
    
    return res.status(200).json({ success: true, id: data[0].id });
  } catch (error) {
    console.error('Error submitting score:', error);
    return res.status(500).json({ error: 'Failed to submit score' });
  }
});

// API endpoint to get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard_public') // Use the public view
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Then modify your frontend code to use these endpoints instead of direct Supabase calls.

#### Option 2: Environment Variables with Build Process

If you're using a build tool like Webpack, Parcel, or Vite:

1. **Create a .env file** to store your Supabase credentials
2. **Use environment variables** in your code
3. **Configure your build process** to inject these variables at build time

Example with Vite:
```javascript
// In your JavaScript file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

#### Option 3: Serverless Functions

Use serverless functions (AWS Lambda, Vercel Functions, Netlify Functions) to handle Supabase interactions:

1. **Create serverless functions** for each Supabase operation
2. **Store credentials as environment variables** in your serverless platform
3. **Call these functions** from your frontend instead of Supabase directly

### Updating Your Implementation

To implement these security measures:

1. Choose one of the approaches above based on your hosting setup
2. Modify the `submitScore` and `loadLeaderboard` functions to use your secure API
3. Update the README and documentation to reflect these changes
4. Consider adding rate limiting and additional validation

Remember that even with Row Level Security (RLS) in place, exposing your anon key still poses risks. Always use a secure approach for production applications.

### Leveraging Supabase Row Level Security (RLS)

Even if you must use the anon key in your frontend code temporarily, you can significantly enhance security by properly configuring Row Level Security (RLS) policies in Supabase:

#### 1. Restrict Operations by Type

Create specific policies for each operation type:

```sql
-- Allow anyone to read only public leaderboard data (no emails)
CREATE POLICY "Public read access" ON public.leaderboard
    FOR SELECT USING (true);

-- Allow inserts but with validation
CREATE POLICY "Allow validated inserts" ON public.leaderboard
    FOR INSERT WITH CHECK (
        -- Validate email format
        email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'
        -- Add other validation as needed
    );

-- Prevent updates to existing records
CREATE POLICY "No updates allowed" ON public.leaderboard
    FOR UPDATE USING (false);

-- Prevent deletions
CREATE POLICY "No deletions allowed" ON public.leaderboard
    FOR DELETE USING (false);
```

#### 2. Use Database Functions for Complex Operations

Create database functions that enforce additional validation:

```sql
-- Function to submit score with validation
CREATE OR REPLACE FUNCTION submit_validated_score(
    p_name TEXT,
    p_email TEXT,
    p_score INTEGER,
    p_level INTEGER,
    p_wave INTEGER
) RETURNS SETOF leaderboard AS $$
BEGIN
    -- Validate inputs
    IF p_score < 0 OR p_score > 1000000 THEN
        RAISE EXCEPTION 'Invalid score value';
    END IF;
    
    IF p_level < 1 OR p_level > 100 THEN
        RAISE EXCEPTION 'Invalid level value';
    END IF;
    
    -- Insert the record
    RETURN QUERY
    INSERT INTO public.leaderboard (
        player_name,
        email,
        score,
        level,
        wave,
        shared_on_x
    ) VALUES (
        p_name,
        p_email,
        p_score,
        p_level,
        p_wave,
        false
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION submit_validated_score TO anon;
```

#### 3. Rate Limiting with Supabase Edge Functions

If you're using Supabase Edge Functions, you can implement rate limiting:

```javascript
// Example Supabase Edge Function with rate limiting
export async function handler(req, res) {
  // Get client IP
  const clientIP = req.headers['x-forwarded-for'] || req.ip;
  
  // Check rate limit using Supabase
  const { data: rateData, error: rateError } = await supabase
    .from('rate_limits')
    .select('count, last_request')
    .eq('ip', clientIP)
    .single();
  
  // If this IP has made requests before
  if (rateData) {
    const now = new Date();
    const lastRequest = new Date(rateData.last_request);
    const timeDiff = now - lastRequest;
    
    // If last request was within the last minute
    if (timeDiff < 60000) {
      // If too many requests in the last minute
      if (rateData.count >= 5) {
        return res.status(429).json({ error: 'Too many requests' });
      }
      
      // Increment count
      await supabase
        .from('rate_limits')
        .update({ count: rateData.count + 1, last_request: now.toISOString() })
        .eq('ip', clientIP);
    } else {
      // Reset count if more than a minute has passed
      await supabase
        .from('rate_limits')
        .update({ count: 1, last_request: now.toISOString() })
        .eq('ip', clientIP);
    }
  } else {
    // First request from this IP
    await supabase
      .from('rate_limits')
      .insert({ ip: clientIP, count: 1, last_request: new Date().toISOString() });
  }
  
  // Process the request...
}
```

These techniques can help mitigate the risks of exposing your anon key, but they are not a substitute for properly securing your API keys using the methods described earlier. 
