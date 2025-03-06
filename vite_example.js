// Example of using environment variables with Vite for secure Supabase integration
// This would be part of your main.js or similar file

import { createClient } from '@supabase/supabase-js';

// Safely access environment variables injected by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the environment variables are defined
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are not defined. Please check your .env file.');
}

// Create the Supabase client only if credentials are available
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Load leaderboard data
export async function loadLeaderboard() {
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}

// Submit score to leaderboard
export async function submitScore(playerName, email, score, level, wave) {
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return { success: false, error: 'Supabase client is not initialized' };
  }
  
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ 
        player_name: playerName,
        email: email,
        score: score,
        level: level,
        wave: wave,
        shared_on_x: false
      }]);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error submitting score:', error);
    return { success: false, error };
  }
}

// Share on X with configurable hashtags
export function shareOnX(playerName, score, wave, level) {
  // Get hashtags from environment variables or use defaults
  const hashtags = import.meta.env.VITE_SHARE_HASHTAGS || '#CosmicCatalyst #SpaceShooter';
  
  const text = `I just scored ${score} points in Cosmic Catalyst, reaching Wave ${wave} and Level ${level}! Can you beat my score? Play now: ${window.location.href} ${hashtags}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  // Only enable sharing if the feature is enabled in environment variables
  if (import.meta.env.VITE_ENABLE_X_SHARING !== 'false') {
    window.open(url, '_blank', 'width=550,height=420');
  }
  
  return false;
}

// Example of how to use these functions in your game
document.addEventListener('DOMContentLoaded', async () => {
  // Load initial leaderboard data
  const leaderboardData = await loadLeaderboard();
  updateLeaderboardDisplay(leaderboardData);
  
  // Set up game title from environment variables
  const gameTitle = import.meta.env.VITE_GAME_TITLE || 'Cosmic Catalyst';
  document.title = gameTitle;
  
  // Example of using the difficulty setting from environment variables
  const defaultDifficulty = import.meta.env.VITE_DEFAULT_DIFFICULTY || 'medium';
  console.log(`Game initialized with ${defaultDifficulty} difficulty`);
}); 