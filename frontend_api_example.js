// Example of secure frontend implementation using a backend API
// This would replace the direct Supabase calls in index.html

// API URL - replace with your actual backend API URL
const API_URL = 'https://your-backend-api.com';

// Load leaderboard data
async function loadLeaderboard() {
    try {
        // Fetch leaderboard data from your secure backend API
        const response = await fetch(`${API_URL}/api/leaderboard`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update the leaderboard display with the data
        updateLeaderboardDisplay(data);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Submit score to leaderboard
async function submitScore(playerName, email, score, level, wave) {
    try {
        // Submit score via your secure backend API
        const response = await fetch(`${API_URL}/api/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName,
                email,
                score,
                level,
                wave
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Store the record ID for potential sharing
        if (result.success && result.id) {
            window.currentScoreId = result.id;
        }
        
        // Reload leaderboard after submission
        loadLeaderboard();
        return { success: true, data: [{ id: result.id }] };
    } catch (error) {
        console.error('Error submitting score:', error);
        return { success: false, error };
    }
}

// Share score on X (Twitter)
function shareOnX(playerName, score, wave, level) {
    const text = `I just scored ${score} points in Cosmic Catalyst, reaching Wave ${wave} and Level ${level}! Can you beat my score? Play now: ${window.location.href} #CosmicCatalyst #SpaceShooter`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    // Update shared status in database if we have a record ID
    if (window.currentScoreId) {
        updateSharedStatus(window.currentScoreId);
    }
    
    // Open Twitter intent in a new window
    window.open(url, '_blank', 'width=550,height=420');
    return false;
}

// Update shared status in database
async function updateSharedStatus(recordId) {
    try {
        // Update shared status via your secure backend API
        const response = await fetch(`${API_URL}/api/scores/${recordId}/share`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error updating shared status:', error);
    }
}

// Update leaderboard display
function updateLeaderboardDisplay(leaderboardData) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    leaderboardData.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.player_name;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = entry.score;
        
        const levelCell = document.createElement('td');
        levelCell.textContent = entry.level || 1;
        
        const waveCell = document.createElement('td');
        waveCell.textContent = entry.wave || '-';
        
        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        row.appendChild(levelCell);
        row.appendChild(waveCell);
        
        leaderboardBody.appendChild(row);
    });
} 