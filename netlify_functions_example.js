// Example of a Netlify serverless function for handling Supabase interactions
// Save this as /netlify/functions/leaderboard.js

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials stored as environment variables in Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // GET request - fetch leaderboard
  if (event.httpMethod === 'GET') {
    try {
      const { data, error } = await supabase
        .from('leaderboard_public')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch leaderboard' })
      };
    }
  }
  
  // POST request - submit score
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const { playerName, email, score, level, wave } = body;
      
      // Validate input
      if (!playerName || !email || !score) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }
      
      // Basic validation
      if (typeof score !== 'number' || score < 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid score value' })
        };
      }
      
      // Rate limiting (simple IP-based)
      // In a real implementation, you'd use a more robust solution
      
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
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, id: data[0].id })
      };
    } catch (error) {
      console.error('Error submitting score:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to submit score' })
      };
    }
  }
  
  // If we get here, the HTTP method is not supported
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}; 