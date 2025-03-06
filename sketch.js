let player;
let enemies = [];
let bullets = [];
let particles = [];
let stars = [];
let powerups = [];
let score = 0;
let gameOver = false;
let lastShotTime = 0;
let shotDelay = 200; // milliseconds
let level = 1;
let levelScore = 0;
let levelThreshold = 100;
let gameStarted = false;
let playerLives = 3;
let backgroundParticles = [];
let playerShield = 0;
let playerPowerUpTime = 0;
let activePowerUp = null;
let gameFont;
let bgImage;
let playerImage;
let enemyImages = [];
let powerUpImages = [];
let explosionSpritesheet;
let explosionFrames = [];
let shootSound, explosionSound, powerUpSound, levelUpSound;
let mouseWasPressed = false; // Track mouse state for button clicks

// Wave system variables
let waveActive = false;
let waveNumber = 1;
let enemiesThisWave = 10; // Initial number of enemies in wave 1
let enemiesRemaining = 0;
let waveCompleted = false;
let waveCompletedTime = 0;
let wavePauseTime = 120; // Reduced from 180 to 120 (2 seconds at 60fps) to keep momentum

// High score variables
let isHighScore = false;
let highScoreRank = 0;
let highScoreChecked = false;
let fireworks = [];

// Player performance tracking for adaptive difficulty
let playerPerformance = {
    killsPerWave: 0,
    deathsPerWave: 0,
    accuracyRate: 0,
    shotsFired: 0,
    shotsHit: 0,
    difficultyMultiplier: 1.0
};

// Control scheme
let controlScheme = "arrows"; // "arrows" or "wasd"

// Keyboard handling flag
let p5KeyboardHandlingDisabled = false;

// Notifications
let notifications = [];

// Expose variables to window object early
window.gameStarted = gameStarted;
window.gameOver = gameOver;
window.waveNumber = waveNumber;
window.p5KeyboardHandlingDisabled = p5KeyboardHandlingDisabled;
window.resetGame = resetGame; // Forward declaration

// Override the p5.js keyPressed function to prevent it from capturing keyboard events
document.addEventListener('keydown', function(e) {
    // Check if modals are open
    const scoreModalOpen = document.getElementById('score-modal') && 
                          document.getElementById('score-modal').style.display === 'block';
    const leaderboardModalOpen = document.getElementById('leaderboard-modal') && 
                                document.getElementById('leaderboard-modal').style.display === 'block';
    
    // If modals are open, stop propagation to prevent p5.js from capturing the event
    if (scoreModalOpen || leaderboardModalOpen) {
        // Don't stop propagation for Tab key (to allow tabbing between fields)
        if (e.key !== 'Tab') {
            e.stopPropagation();
        }
    }
}, true); // Use capture phase to intercept events before they reach p5.js

function preload() {
    try {
        // Load font
        console.log("Loading font...");
        gameFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
        console.log("Font loaded successfully");
    } catch (error) {
        console.error("Error loading font:", error);
        // Use a fallback font if loading fails
        console.log("Using fallback font");
        gameFont = null;
    }
    
    // We'll use placeholder colors instead of images for now
    // In a real implementation, you would load images like this:
    // playerImage = loadImage('assets/player.png');
    // for (let i = 1; i <= 3; i++) {
    //     enemyImages.push(loadImage(`assets/enemy${i}.png`));
    // }
    // for (let i = 1; i <= 3; i++) {
    //     powerUpImages.push(loadImage(`assets/powerup${i}.png`));
    // }
    
    // Load sounds (commented out for now)
    // shootSound = loadSound('assets/shoot.wav');
    // explosionSound = loadSound('assets/explosion.wav');
    // powerUpSound = loadSound('assets/powerup.wav');
    // levelUpSound = loadSound('assets/levelup.wav');
}

function setup() {
    console.log("Setting up game...");
    let canvas = createCanvas(1000, 700);
    canvas.parent('game-container');
    
    // Only set the font if it was loaded successfully
    if (gameFont) {
        textFont(gameFont);
    }
    
    // Expose functions and variables to the window object
    // These need to be exposed after p5.js has initialized them
    window.loop = loop;
    window.noLoop = noLoop;
    window.gameOver = gameOver;
    window.gameStarted = gameStarted;
    window.waveNumber = waveNumber;
    window.resetGame = resetGame;
    
    player = new Player(width / 2, height / 2);
    
    // Generate stars for the background with different sizes
    for (let i = 0; i < 200; i++) {
        stars.push({ 
            x: random(width), 
            y: random(height),
            size: random(0.5, 2),
            brightness: random(150, 255)
        });
    }
    
    // Generate background particles
    for (let i = 0; i < 70; i++) {
        backgroundParticles.push({
            x: random(width),
            y: random(height),
            size: random(1, 3),
            speed: random(0.2, 0.5),
            color: color(random(50, 150), random(50, 150), random(200, 255), 150)
        });
    }
    
    console.log("Game setup complete");
}

function draw() {
    try {
        // Sync the p5KeyboardHandlingDisabled variable with the window object
        p5KeyboardHandlingDisabled = window.p5KeyboardHandlingDisabled;
        
        // Debug game state periodically
        if (frameCount % 60 === 0) {
            console.log("Game state:", {
                gameStarted: gameStarted,
                gameOver: gameOver,
                waveNumber: waveNumber,
                playerLives: playerLives
            });
            
            // Ensure window object is in sync with game state
            window.gameStarted = gameStarted;
            window.gameOver = gameOver;
            window.waveNumber = waveNumber;
        }
        
        // Prevent unwanted game resets by ensuring consistent state
        // If the game is marked as started in the window object but not locally, sync them
        if (window.gameStarted === true && gameStarted === false) {
            console.log("Syncing gameStarted from window object (true)");
            gameStarted = true;
        }
        
        // Only sync gameOver from false to true, never from true to false
        // This prevents overriding a legitimate game over state
        if (window.gameOver === true && gameOver === false) {
            console.log("Syncing gameOver from window object (true)");
            gameOver = true;
        }
        
        // CRITICAL FIX: Prevent unwanted resets during gameplay
        // If the game is in progress (started, not over, and past wave 1), ensure it stays that way
        if (gameStarted && !gameOver && waveNumber > 1) {
            // Ensure these values stay consistent to prevent unwanted resets
            window.gameStarted = true;
            window.gameOver = false;
        }
        
        // Check if modals are open - if so, don't update game state
        const scoreModalOpen = document.getElementById('score-modal') && 
                              document.getElementById('score-modal').style.display === 'block';
        const leaderboardModalOpen = document.getElementById('leaderboard-modal') && 
                                    document.getElementById('leaderboard-modal').style.display === 'block';
        
        if (!gameStarted) {
            drawStartScreen();
            // Update mouseWasPressed at the end of the frame
            mouseWasPressed = mouseIsPressed;
            return;
        }
        
        // Create a deep space background gradient
        background(0);
        drawStarfield();
        
        // If modals are open, just draw the current state without updating
        if (scoreModalOpen || leaderboardModalOpen) {
            // Draw all entities without updating them
            player.draw();
            enemies.forEach(enemy => enemy.draw());
            bullets.forEach(projectile => projectile.draw());
            particles.forEach(explosion => explosion.draw());
            powerups.forEach(powerUp => powerUp.draw());
            drawHUD();
            return;
        }
        
        if (!gameOver) {
            // Update and render player
            player.update();
            player.draw();
            
            // Debug log for player lives
            if (playerLives <= 0 && !gameOver) {
                console.error("CRITICAL: Player lives <= 0 but game not over!", {
                    playerLives: playerLives,
                    gameOver: gameOver,
                    window_gameOver: window.gameOver
                });
                // Force game over state
                gameOver = true;
                window.gameOver = true;
            }
            
            // Update power-up timer
            if (playerPowerUpTime > 0) {
                playerPowerUpTime--;
                if (playerPowerUpTime <= 0) {
                    deactivatePowerUp();
                }
            }
            
            // Wave system logic
            if (waveCompleted) {
                // Show wave completion screen
                drawWaveCompletedScreen();
                
                // After pause time, start next wave
                if (frameCount - waveCompletedTime > wavePauseTime) {
                    console.log("Wave pause time completed, starting next wave");
                    console.log("Current game state before startNextWave:", {
                        score: score,
                        level: level,
                        waveNumber: waveNumber,
                        gameOver: gameOver,
                        gameStarted: gameStarted,
                        waveActive: waveActive,
                        waveCompleted: waveCompleted
                    });
                    startNextWave();
                }
            } else if (!waveActive) {
                // Start a new wave if none is active
                console.log("No active wave, starting new wave");
                console.log("Current game state before startWave:", {
                    score: score,
                    level: level,
                    waveNumber: waveNumber,
                    gameOver: gameOver,
                    gameStarted: gameStarted,
                    waveActive: waveActive,
                    waveCompleted: waveCompleted
                });
                startWave();
            } else {
                // Spawn enemies based on wave (only if we still have enemies to spawn)
                if (enemiesRemaining > 0 && frameCount % max(60 - level * 5, 20) === 0) {
                    spawnEnemy();
                    enemiesRemaining--;
                }
                
                // Check if wave is completed (all enemies spawned and defeated)
                if (enemiesRemaining === 0 && enemies.length === 0) {
                    console.log("All enemies defeated, completing wave");
                    console.log("Current game state before completeWave:", {
                        score: score,
                        level: level,
                        waveNumber: waveNumber,
                        gameOver: gameOver,
                        gameStarted: gameStarted,
                        waveActive: waveActive,
                        waveCompleted: waveCompleted
                    });
                    completeWave();
                }
            }
            
            // Spawn power-ups occasionally
            if (frameCount % 500 === 0) {
                spawnPowerUp();
            }
            
            // Update and render entities
            updateEntities(enemies);
            updateEntities(bullets);
            updateEntities(particles);
            updateEntities(powerups);
        
            // Check for collisions
            checkCollisions();
        
            // Display HUD (Heads-Up Display)
            drawHUD();
            
            // Draw notifications
            drawNotifications();
        } else {
            drawGameOverScreen();
        }
    } catch (error) {
        console.error("Error in draw function:", error);
        console.error("Error stack:", error.stack);
        console.error("Game state at error:", {
            score: score,
            level: level,
            waveNumber: waveNumber,
            gameOver: gameOver,
            gameStarted: gameStarted,
            waveActive: waveActive,
            waveCompleted: waveCompleted,
            enemiesRemaining: enemiesRemaining,
            enemies: enemies.length,
            highScoreChecked: highScoreChecked,
            isHighScore: isHighScore
        });
        
        // Try to recover by resetting the game ONLY if there was an error
        // and not because the player legitimately lost all lives or is checking high scores
        if (!gameStarted) {
            gameStarted = true;
        }
        
        // Only reset if gameOver is true due to an error, not due to player losing all lives
        // We can check playerLives to determine if this is a legitimate game over
        // Also don't reset if we're in the process of checking high scores
        if (gameOver && playerLives > 0 && !highScoreChecked) {
            console.log("Resetting game due to error recovery, not due to player losing all lives");
            resetGame();
        }
    }
    
    // Update mouseWasPressed at the end of the frame
    mouseWasPressed = mouseIsPressed;
}

function drawStarfield() {
    // Draw background particles
    for (let particle of backgroundParticles) {
        fill(particle.color);
        noStroke();
        ellipse(particle.x, particle.y, particle.size);
        
        // Move particles slowly downward
        particle.y += particle.speed;
        if (particle.y > height) {
            particle.y = 0;
            particle.x = random(width);
        }
    }
    
    // Draw stars with different sizes and brightness
    for (let star of stars) {
        fill(star.brightness);
        noStroke();
        ellipse(star.x, star.y, star.size);
    }
}

function drawStartScreen() {
    push();
    textAlign(CENTER, CENTER);
    textSize(50);
    fill(0, 255, 255);
    text("COSMIC CATALYST", width/2, height/3);
    
    textSize(24);
    fill(255);
    text("Press ENTER to Start", width/2, height/2);
    
    textSize(18);
    fill(200, 200, 255);
    text("Controls: Arrow Keys or WASD + Space to shoot", width/2, height/2 + 50);
    text("Press C during game to toggle control scheme", width/2, height/2 + 80);
    
    // Draw buttons for help and leaderboard
    textSize(16);
    fill(0, 150, 255);
    
    // Help button
    let helpBtnX = width/2 - 80;
    let btnY = height/2 + 130;
    let btnSize = 40;
    
    fill(0, 150, 255, 200);
    stroke(0, 200, 255);
    strokeWeight(2);
    ellipse(helpBtnX, btnY, btnSize, btnSize);
    
    fill(255);
    noStroke();
    textSize(24);
    text("?", helpBtnX, btnY + 1);
    
    // Leaderboard button
    let leaderBtnX = width/2 + 80;
    
    fill(76, 175, 80, 200);
    stroke(100, 220, 100);
    strokeWeight(2);
    ellipse(leaderBtnX, btnY, btnSize, btnSize);
    
    fill(255);
    noStroke();
        textSize(20);
    text("🏆", leaderBtnX, btnY + 1);
    
    // Button labels
    textSize(14);
    fill(200, 200, 255);
    text("Help", helpBtnX, btnY + 30);
    text("Leaderboard", leaderBtnX, btnY + 30);
    
    // Animated stars in background
    for (let i = 0; i < 5; i++) {
        let angle = frameCount * 0.01 + i * TWO_PI / 5;
        let x = width/2 + cos(angle) * 150;
        let y = height/3 - 80 + sin(angle) * 20;
        fill(255, 255, 0);
        star(x, y, 10, 20, 5);
    }
    
    pop();
    
    // Check for button clicks
    if (mouseIsPressed && !mouseWasPressed) {
        // Help button
        if (dist(mouseX, mouseY, helpBtnX, btnY) < btnSize/2) {
            window.location.href = 'help.html';
        }
        
        // Leaderboard button
        if (dist(mouseX, mouseY, leaderBtnX, btnY) < btnSize/2) {
            window.location.href = 'leaderboard.html';
        }
    }
    
    // Track mouse state
    mouseWasPressed = mouseIsPressed;
}

function drawGameOverScreen() {
    background(0, 0, 0, 10);
    drawStarfield();
    
    // Check for high score if not already checked
    if (!highScoreChecked && typeof supabaseClient !== 'undefined') {
        try {
            // Call the async function but don't wait for it
            // This prevents blocking the game loop
            checkHighScore().catch(error => {
                console.error("Error checking high score:", error);
            });
        } catch (error) {
            console.error("Error initiating high score check:", error);
            // Mark as checked to prevent repeated errors
            highScoreChecked = true;
        }
    }
    
    // Draw fireworks if it's a high score
    if (isHighScore) {
        updateFireworks();
    }
    
    push();
    textAlign(CENTER, CENTER);
    textSize(50);
    fill(255, 0, 0);
    text("GAME OVER", width/2, height/3);
    
    textSize(24);
    fill(255);
    text("Final Score: " + score, width/2, height/2);
    text("Level Reached: " + level, width/2, height/2 + 40);
    text("Wave Reached: " + waveNumber, width/2, height/2 + 80);
    
    // Display high score message if applicable
    if (isHighScore) {
        textSize(28);
        fill(255, 215, 0); // Gold color
        text("NEW HIGH SCORE!", width/2, height/3 + 60);
        
        textSize(20);
        text("Rank: " + highScoreRank, width/2, height/3 + 90);
    }
    
    textSize(18);
    fill(200, 200, 255);
    text("Press ENTER to Restart", width/2, height/2 + 130);
    
    // Draw a button to submit score
    drawButton("SUBMIT SCORE", width/2, height/2 + 170, 200, 50);
    
    // Draw buttons for help and leaderboard
    let helpBtnX = width/2 - 180;
    let leaderBtnX = width/2 + 180;
    let btnY = height/2 + 170;
    let btnSize = 40;
    
    // Help button
    fill(0, 150, 255, 200);
    stroke(0, 200, 255);
    strokeWeight(2);
    ellipse(helpBtnX, btnY, btnSize, btnSize);
    
    fill(255);
    noStroke();
    textSize(24);
    text("?", helpBtnX, btnY + 1);
    
    // Leaderboard button
    fill(76, 175, 80, 200);
    stroke(100, 220, 100);
    strokeWeight(2);
    ellipse(leaderBtnX, btnY, btnSize, btnSize);
    
    fill(255);
    noStroke();
    textSize(20);
    text("🏆", leaderBtnX, btnY + 1);
    
    // Button labels
    textSize(14);
    fill(200, 200, 255);
    text("Help", helpBtnX, btnY + 30);
    text("Leaderboard", leaderBtnX, btnY + 30);
    
    pop();
    
    // Check for button clicks
    if (mouseIsPressed && !mouseWasPressed) {
        // Help button
        if (dist(mouseX, mouseY, helpBtnX, btnY) < btnSize/2) {
            window.location.href = 'help.html';
        }
        
        // Leaderboard button
        if (dist(mouseX, mouseY, leaderBtnX, btnY) < btnSize/2) {
            window.location.href = 'leaderboard.html';
        }
    }
}

function drawButton(label, x, y, w, h) {
    // Check if mouse is over button
    let isOver = mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2;
    
    // Draw button
    if (isOver) {
        fill(0, 200, 255);
    } else {
        fill(0, 150, 200);
    }
    stroke(255);
    rectMode(CENTER);
    rect(x, y, w, h, 10);
    
    // Draw label
        fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    text(label, x, y);
}

function drawHUD() {
    push();
    textAlign(LEFT, TOP);
        textSize(20);
    fill(255);
    
    // Score
    text("SCORE: " + score, 20, 20);
    
    // Wave and Level
    text("WAVE: " + waveNumber, 20, 50);
    text("LEVEL: " + level, 20, 80);
    
    // Controls indicator
    textSize(14);
    fill(200, 200, 255);
    text("CONTROLS: " + (controlScheme === "arrows" ? "ARROWS" : "WASD") + " (Press C to toggle)", 20, 110);
    
    // Lives
    text("LIVES: ", 20, height - 30);
    for (let i = 0; i < playerLives; i++) {
        fill(255, 0, 0);
        triangle(90 + i * 25, height - 25, 80 + i * 25, height - 15, 100 + i * 25, height - 15);
    }
    
    // Shield
    if (playerShield > 0) {
        fill(0, 200, 255);
        text("SHIELD: " + playerShield, width - 150, 20);
    }
    
    // Power-up timer
    if (playerPowerUpTime > 0) {
        let powerUpName = "";
        switch(activePowerUp) {
            case 1: powerUpName = "RAPID FIRE"; break;
            case 2: powerUpName = "TRIPLE SHOT"; break;
            case 3: powerUpName = "SHIELD"; break;
        }
        
        fill(255, 255, 0);
        text(powerUpName + ": " + ceil(playerPowerUpTime / 60) + "s", width - 200, 50);
    }
    
    // Enemies remaining in wave
    fill(255, 100, 100);
    text("ENEMIES: " + (enemies.length + enemiesRemaining), width - 150, 80);
    
    pop();
}

// Helper function to update and render entities
function updateEntities(entities) {
    for (let i = entities.length - 1; i >= 0; i--) {
        entities[i].update();
        entities[i].draw();
        
        // Remove off-screen entities
        if (entities[i].isOffScreen && entities[i].isOffScreen()) {
            entities.splice(i, 1);
        }
        // Remove expired entities
        else if (entities[i].isExpired && entities[i].isExpired()) {
            entities.splice(i, 1);
        }
    }
}

/** Player Class */
class Player {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.angle = 0;
        this.turnSpeed = radians(5);
        this.speed = 1;
        this.velocity = createVector(0, 0);
        this.maxSpeed = 5;
        this.thrusterParticles = [];
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 180; // 3 seconds at 60fps (increased from 2 seconds)
        this.size = 15; // Ship size for collision detection
        this.flashRate = 6; // Flash rate for invincibility visual feedback
    }
    
    update() {
        // Don't update player movement when modals are open
        if (document.getElementById('score-modal') && 
            document.getElementById('score-modal').style.display === 'block') {
            return;
        }
        
        // Debug control scheme
        if (frameCount % 60 === 0) {
            console.log("Current control scheme:", controlScheme);
        }
        
        // Handle controls - allow both WASD and arrow keys to work regardless of scheme
        // Rotate left with LEFT_ARROW or A key
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.angle -= this.turnSpeed;
        
        // Rotate right with RIGHT_ARROW or D key
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.angle += this.turnSpeed;
        
        // Move forward with UP_ARROW or W key
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
            let thrust = createVector(0, -this.speed).rotate(this.angle);
            this.velocity.add(thrust);
            
            // Add thruster particles
            this.addThrusterParticles();
        }
        
        // Move backward with DOWN_ARROW or S key
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
            let thrust = createVector(0, this.speed).rotate(this.angle);
            this.velocity.add(thrust);
        }
        
        // Limit velocity
        this.velocity.limit(this.maxSpeed);
        
        // Apply velocity
        this.position.add(this.velocity);
        
        // Apply drag
        this.velocity.mult(0.98);
        
        // Wrap around screen edges
        if (this.position.x < 0) this.position.x = width;
        if (this.position.x > width) this.position.x = 0;
        if (this.position.y < 0) this.position.y = height;
        if (this.position.y > height) this.position.y = 0;
        
        // Update thruster particles
        this.updateThrusterParticles();
        
        // Update invincibility
        if (this.invincible) {
            this.invincibleTime--;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }
    }
    
    addThrusterParticles() {
        // Calculate thruster position (back of the ship)
        let thrusterPos = createVector(0, 10).rotate(this.angle);
        
        // Add 2-3 particles per frame when thrusting
        for (let i = 0; i < random(2, 4); i++) {
            let offset = createVector(random(-5, 5), random(-2, 2)).rotate(this.angle);
            let pos = p5.Vector.add(this.position, p5.Vector.add(thrusterPos, offset));
            let vel = createVector(0, random(1, 3)).rotate(this.angle + PI + random(-0.2, 0.2));
            
            this.thrusterParticles.push({
                pos: pos,
                vel: vel,
                life: random(20, 30),
                color: color(255, random(100, 200), 0, 200)
            });
        }
    }
    
    updateThrusterParticles() {
        for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
            let p = this.thrusterParticles[i];
            p.pos.add(p.vel);
            p.life -= 1;
            
            if (p.life <= 0) {
                this.thrusterParticles.splice(i, 1);
            }
        }
    }
    
    draw() {
        push();
        translate(this.position.x, this.position.y);
        rotate(this.angle);
        
        // Draw ship with invincibility flashing effect
        if (!this.invincible || (frameCount % this.flashRate < this.flashRate/2)) {
            // Ship body
            fill(0, 100, 255);
            stroke(0, 200, 255);
            strokeWeight(2);
            triangle(-10, 10, 10, 10, 0, -20);
            
            // Cockpit
            fill(200, 255, 255);
            noStroke();
            ellipse(0, 0, 8, 8);
            
            // Engines
            fill(50);
            rect(-8, 10, 5, 5);
            rect(3, 10, 5, 5);
            
            // Shield visual if active
            if (playerShield > 0) {
                noFill();
                stroke(0, 200, 255, 150);
                strokeWeight(2);
                ellipse(0, 0, this.size * 3, this.size * 3);
                
                // Pulse effect
                stroke(0, 200, 255, 50 + sin(frameCount * 0.1) * 30);
                ellipse(0, 0, this.size * 3.5, this.size * 3.5);
            }
        }
        
        pop();
    }
    
    hit() {
        if (this.invincible || playerShield > 0) {
            if (playerShield > 0) {
                playerShield--;
                console.log("Shield hit! Shields remaining:", playerShield);
            }
            return false; // No damage taken
        }
        
        playerLives--;
        console.log("Player hit! Lives remaining:", playerLives);
        playerPerformance.deathsPerWave++;
        
        // Make player invincible for a short time
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;
        
        if (playerLives <= 0) {
            gameOver = true;
            window.gameOver = true; // Ensure window object is also updated
            console.log("Game over! Player out of lives.");
            console.log("Game state after game over:", {
                gameOver: gameOver,
                "window.gameOver": window.gameOver,
                playerLives: playerLives
            });
            // Create big explosion
            for (let i = 0; i < 20; i++) {
                let angle = random(TWO_PI);
                let dist = random(10, 30);
                let x = this.position.x + cos(angle) * dist;
                let y = this.position.y + sin(angle) * dist;
                particles.push(new Explosion(x, y, color(255, 0, 0)));
            }
            return true; // Game over
        }
        
        return true; // Damage taken
    }
}

/** Enemy Class */
class Enemy {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.type = type;
        this.speed = 2 + (type * 0.5);
        this.size = 30 + (type * 5);
        this.health = type;
        this.maxHealth = this.health;
        this.shootCooldown = 0;
        this.canShoot = type > 3; // Only advanced enemies can shoot
        this.points = getEnemyPoints(type);
        
        // Movement pattern
        this.movementType = floor(random(3));
        this.amplitude = random(2, 5);
        this.frequency = random(0.02, 0.05);
        this.angle = 0;
        this.direction = 1; // For zigzag movement
        
        // Visual properties
        this.rotation = 0;
        this.rotationSpeed = random(-0.05, 0.05);
        this.color = color(255, 100, 100);
        
        // Set velocity based on type
        this.velocity = createVector(0, this.speed);
        
        switch(type) {
            case 2:
                this.color = color(255, 150, 50);
                break;
            case 3:
                this.color = color(255, 200, 0);
                break;
            case 4:
                this.color = color(200, 100, 255);
                break;
            case 5:
                this.color = color(255, 50, 255);
                break;
        }
    }
    
    update() {
        this.angle += this.rotationSpeed;
        
        // Different movement patterns based on enemy type
        if (this.type === 1) {
            // Basic enemy - moves straight down
            this.pos.y += this.speed;
        } else if (this.type === 2) {
            // Tracking enemy - follows player
            let direction = p5.Vector.sub(player.position, this.pos);
            direction.normalize().mult(this.speed * 0.8);
            this.pos.add(direction);
        } else if (this.type === 3) {
            // Zigzag enemy
            this.pos.x += this.speed * this.direction;
            this.pos.y += this.speed * 0.7;
            
            // Reverse direction at screen edges
            if (this.pos.x < 0 || this.pos.x > width) {
                this.direction *= -1;
            }
        } else if (this.type === 4) {
            // Advanced enemy - sine wave movement
            this.pos.y += this.speed;
            this.pos.x += sin(frameCount * this.frequency) * this.amplitude;
        } else if (this.type === 5) {
            // Boss enemy - sweeps across the screen
            this.pos.x = width/2 + sin(frameCount * 0.01) * (width/2 - 50);
            this.pos.y += this.speed * 0.5;
            
            // Boss shoots at player
            if (frameCount % 60 === 0) {
                // Shooting logic would go here
            }
        }
        
        // Shooting logic for advanced enemies
        if (this.canShoot) {
            this.shootCooldown--;
            if (this.shootCooldown <= 0) {
                // Reset cooldown
                this.shootCooldown = 120 - (level * 5);
                
                // Shooting logic would go here
            }
        }
    }
    
    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        
        // Draw enemy based on type
        fill(this.color);
        stroke(255);
        strokeWeight(2);
        
        if (this.type === 1) {
            // Basic triangle enemy
            triangle(0, -this.size/2, -this.size/2, this.size/2, this.size/2, this.size/2);
        } else if (this.type === 2) {
            // Tracking enemy - diamond shape
            quad(0, -this.size/2, this.size/2, 0, 0, this.size/2, -this.size/2, 0);
        } else if (this.type === 3) {
            // Zigzag enemy - hexagon
            beginShape();
            for (let i = 0; i < 6; i++) {
                let angle = TWO_PI / 6 * i;
                let x = cos(angle) * this.size/2;
                let y = sin(angle) * this.size/2;
                vertex(x, y);
            }
            endShape(CLOSE);
        } else if (this.type === 4) {
            // Advanced enemy - star shape
            beginShape();
            for (let i = 0; i < 10; i++) {
                let angle = TWO_PI / 10 * i;
                let radius = i % 2 === 0 ? this.size/2 : this.size/4;
                let x = cos(angle) * radius;
                let y = sin(angle) * radius;
                vertex(x, y);
            }
            endShape(CLOSE);
        } else if (this.type === 5) {
            // Boss enemy - complex shape
            ellipse(0, 0, this.size, this.size);
            fill(255);
            ellipse(0, 0, this.size/2, this.size/2);
            fill(this.color);
            rect(-this.size/2, -this.size/4, this.size, this.size/8);
            rect(-this.size/2, this.size/8, this.size, this.size/8);
        }
        
        // Health bar for enemies with more than 1 health
        if (this.maxHealth > 1) {
            noStroke();
            fill(100);
            rect(-this.size/2, -this.size/2 - 10, this.size, 5);
            fill(255, 0, 0);
            let healthWidth = map(this.health, 0, this.maxHealth, 0, this.size);
            rect(-this.size/2, -this.size/2 - 10, healthWidth, 5);
        }
        
        pop();
    }
    
    hit() {
        this.health--;
        if (this.health <= 0) {
            return true; // Enemy destroyed
        }
        return false; // Enemy still alive
    }
    
    isOffScreen() {
        return (this.pos.y > height + this.size || 
                this.pos.x < -this.size || 
                this.pos.x > width + this.size);
    }
}

/** Projectile Class */
class Projectile {
    constructor(x, y, angle) {
        this.position = createVector(x, y);
        this.velocity = createVector(0, -7).rotate(angle); // Faster projectiles
        this.angle = angle;
        this.size = 5;
        this.trail = [];
    }
    
    update() {
        // Add current position to trail
        this.trail.push({
            x: this.position.x,
            y: this.position.y,
            alpha: 255
        });
        
        // Limit trail length
        if (this.trail.length > 10) {
            this.trail.shift();
        }
        
        // Fade trail
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].alpha -= 25;
        }
        
        this.position.add(this.velocity);
    }
    
    draw() {
        // Draw trail
        noStroke();
        for (let i = 0; i < this.trail.length; i++) {
            let t = this.trail[i];
            let size = map(i, 0, this.trail.length, 1, this.size);
            fill(255, 255, 0, t.alpha);
            ellipse(t.x, t.y, size);
        }
        
        // Draw projectile
        fill(255, 255, 0);
        ellipse(this.position.x, this.position.y, this.size);
        
        // Glow effect
        noFill();
        stroke(255, 255, 0, 100);
        ellipse(this.position.x, this.position.y, this.size * 2);
    }
    
    isOffScreen() {
        return (this.position.x < 0 || this.position.x > width ||
                this.position.y < 0 || this.position.y > height);
    }
}

/** PowerUp Class */
class PowerUp {
    constructor(x, y, type) {
        this.position = createVector(x, y);
        this.type = type;
        this.velocity = createVector(0, 0.5);
        this.angle = 0;
        this.size = 15;
        this.pulseSize = 0;
    }
    
    update() {
        this.position.add(this.velocity);
        this.angle += 0.05;
        this.pulseSize = sin(frameCount * 0.1) * 5;
    }
    
    draw() {
        push();
        translate(this.position.x, this.position.y);
        rotate(this.angle);
        
        // Outer glow
        noFill();
        stroke(this.getColor());
        strokeWeight(2);
        ellipse(0, 0, this.size * 2 + this.pulseSize);
        
        // Power-up icon
        fill(this.getColor());
        noStroke();
        
        if (this.type === 1) {
            // Triple shot - three small circles
            ellipse(-5, 0, 5);
            ellipse(0, 0, 5);
            ellipse(5, 0, 5);
        } else if (this.type === 2) {
            // Shield - circle with ring
            ellipse(0, 0, 10);
            noFill();
            stroke(this.getColor());
            ellipse(0, 0, 15);
        } else if (this.type === 3) {
            // Speed boost - lightning bolt
            beginShape();
            vertex(-5, -8);
            vertex(0, 0);
            vertex(-3, 0);
            vertex(5, 8);
            vertex(0, 0);
            vertex(3, 0);
            endShape(CLOSE);
        }
        
        pop();
    }
    
    getColor() {
        if (this.type === 1) return color(255, 255, 0); // Yellow for triple shot
        if (this.type === 2) return color(0, 150, 255); // Blue for shield
        if (this.type === 3) return color(0, 255, 0);   // Green for speed boost
        return color(255);
    }
    
    isOffScreen() {
        return this.position.y > height + this.size;
    }
}

/** Explosion Class - Updated */
class Explosion {
    constructor(x, y, explosionColor = color(255, 200, 0)) {
        this.position = createVector(x, y);
        this.size = 0;
        this.maxSize = random(30, 60);
        this.fade = 255;
        this.fadeSpeed = random(3, 8);
        this.color = explosionColor;
        this.particles = [];
        
        // Create explosion particles
        let particleCount = floor(random(5, 15));
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                pos: createVector(x, y),
                vel: p5.Vector.random2D().mult(random(0.5, 2)),
                size: random(2, 6),
                life: random(20, 40)
            });
        }
    }
    
    update() {
        this.size += (this.maxSize - this.size) * 0.2; // Smooth growth
        this.fade -= this.fadeSpeed;
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.pos.add(p.vel);
            p.life -= 1;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw() {
        // Draw explosion ring
        noFill();
        stroke(red(this.color), green(this.color), blue(this.color), this.fade);
        strokeWeight(2);
        ellipse(this.position.x, this.position.y, this.size);
        
        // Draw particles
        noStroke();
        for (let p of this.particles) {
            let alpha = map(p.life, 0, 40, 0, 200);
            fill(red(this.color), green(this.color), blue(this.color), alpha);
            ellipse(p.pos.x, p.pos.y, p.size);
        }
    }
    
    isExpired() {
        return this.fade <= 0;
    }
}

/** Collision Detection */
function checkCollisions() {
    // Projectile vs Enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            let distance = dist(
                bullets[i].position.x, 
                bullets[i].position.y,
                enemies[j].pos.x, 
                enemies[j].pos.y
            );
            
            if (distance < enemies[j].size / 2 + bullets[i].size / 2) {
                // Hit detected
                bullets.splice(i, 1);
                
                // Track successful hits for accuracy calculation
                playerPerformance.shotsHit++;
                
                // Damage enemy
                if (enemies[j].hit()) {
                    // Enemy destroyed
                    playerPerformance.killsPerWave++;
                    
                let enemyType = enemies[j].type;
                    let enemyPosX = enemies[j].pos.x;
                    let enemyPosY = enemies[j].pos.y;
                    
                    // Add points based on enemy type
                    let points = enemies[j].points;
                    score += points;
                    
                    // Check for level up based on score
                    checkLevelUp();
                    
                    // Create explosion
                    let explosionColor;
                    switch(enemyType) {
                        case 1: explosionColor = color(255, 100, 0); break;
                        case 2: explosionColor = color(255, 150, 50); break;
                        case 3: explosionColor = color(255, 200, 0); break;
                        case 4: explosionColor = color(200, 100, 255); break;
                        case 5: explosionColor = color(255, 50, 255); break;
                        default: explosionColor = color(255, 200, 0);
                    }
                    particles.push(new Explosion(enemyPosX, enemyPosY, explosionColor));
                    
                    // Chance to spawn power-up (higher chance from bigger enemies)
                    // Adjusted to balance power-up frequency
                    let powerUpChance = 0.03 * enemyType * playerPerformance.difficultyMultiplier;
                    if (random() < powerUpChance) {
                        powerups.push(new PowerUp(enemyPosX, enemyPosY, floor(random(1, 4))));
                    }
                    
                    // Remove enemy
                    enemies.splice(j, 1);
                }
                
                // Break out of inner loop since projectile is gone
                break;
            }
        }
    }
    
    // Player vs Enemy collisions
    if (!player.invincible) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            let distance = dist(
                player.position.x, 
                player.position.y,
                enemies[i].pos.x, 
                enemies[i].pos.y
            );
            
            if (distance < player.size + enemies[i].size / 2) {
                // Player hit by enemy
                player.hit();
                
                // Remove enemy on collision
                let enemyPosX = enemies[i].pos.x;
                let enemyPosY = enemies[i].pos.y;
                enemies.splice(i, 1);
                
                // Create explosion
                particles.push(new Explosion(enemyPosX, enemyPosY, color(255, 0, 0)));
                break;
            }
        }
    }
    
    // Player vs PowerUp collisions
    for (let i = powerups.length - 1; i >= 0; i--) {
        let distance = dist(
            player.position.x, 
            player.position.y,
            powerups[i].position.x, 
            powerups[i].position.y
        );
        
        if (distance < player.size + powerups[i].size / 2) {
            // Collect power-up
            activatePowerUp(powerups[i].type);
            
            // Create explosion effect
            particles.push(new Explosion(
                powerups[i].position.x,
                powerups[i].position.y,
                powerups[i].getColor()
            ));
            
            // Remove power-up
            powerups.splice(i, 1);
            break;
        }
    }
}

/** Score Calculation */
function getEnemyPoints(type) {
    // Base points for each enemy type
    let basePoints = 0;
    switch(type) {
        case 1: basePoints = 10; break;
        case 2: basePoints = 20; break;
        case 3: basePoints = 30; break;
        case 4: basePoints = 50; break;
        case 5: basePoints = 100; break;
        default: basePoints = 10;
    }
    
    // Scale points with wave number
    return basePoints * (1 + (waveNumber - 1) * 0.2);
}

/** Shooting Mechanism */
function keyPressed() {
    console.log("Key pressed:", keyCode, "ENTER key code is:", ENTER);
    
    // If keyboard handling is disabled, don't process any key events
    if (p5KeyboardHandlingDisabled) {
        console.log("Keyboard handling disabled, ignoring key press");
        return false;
    }
    
    // Don't capture keyboard events when modals are open
    if (document.getElementById('score-modal') && 
        document.getElementById('score-modal').style.display === 'block') {
        console.log("Modal open, ignoring key press");
        return false;
    }
    
    if (document.getElementById('leaderboard-modal') && 
        document.getElementById('leaderboard-modal').style.display === 'block') {
        console.log("Leaderboard modal open, ignoring key press");
        return false;
    }
    
    // Start game on Enter key (keyCode 13)
    if (!gameStarted && (keyCode === ENTER || keyCode === 13)) {
        console.log("Starting game with Enter key");
        gameStarted = true;
        window.gameStarted = true;
        resetGame();
        return false;
    }
    
    // Restart game on Enter key when game over
    if (gameOver && (keyCode === ENTER || keyCode === 13)) {
        console.log("Restarting game with Enter key");
        resetGame();
        return false;
    }
    
    // Toggle control scheme with 'C' key
    if (keyCode === 67) { // 'C' key
        controlScheme = controlScheme === "arrows" ? "wasd" : "arrows";
        // Show control scheme change notification
        let notification = {
            text: "Controls: " + (controlScheme === "arrows" ? "Arrows + Space" : "WASD + Space"),
            position: createVector(width/2, height/2),
            life: 60,
            color: color(255, 255, 0)
        };
        notifications.push(notification);
    }
    
    // Shoot on spacebar
    if (keyCode === 32) { // Spacebar
        // Check shot delay
        let currentTime = millis();
        if (currentTime - lastShotTime > shotDelay) {
            // Create projectile
            let projectileSpeed = 10;
            
            // Track shots fired for accuracy calculation
            playerPerformance.shotsFired++;
            
            if (activePowerUp === 2) {
                // Triple shot power-up
                for (let i = -1; i <= 1; i++) {
                    let angle = player.angle + radians(i * 15);
                    bullets.push(new Projectile(
                        player.position.x, 
                        player.position.y,
                        angle
                    ));
                }
            } else {
                // Normal shot
                bullets.push(new Projectile(
                    player.position.x, 
                    player.position.y,
                    player.angle
                ));
            }
            
            // Update last shot time
            lastShotTime = currentTime;
        }
    }
}

function spawnEnemy() {
    // Higher chance of advanced enemies in later waves
    let typeChance = 0.7 - (waveNumber * 0.05);
    typeChance = max(typeChance, 0.3); // Minimum 30% chance for basic enemies
    
    let type = random(1) < typeChance ? floor(random(1, 4)) : floor(random(1, 4) + level/2);
    let x = random(width);
    let y = -20;
    
    // Cap enemy type at 5, but increase health and speed for higher waves
    let enemy = new Enemy(x, y, min(type, 5));
    
    // Scale enemy properties with wave number and adaptive difficulty
    enemy.speed *= (1 + (waveNumber - 1) * 0.1) * playerPerformance.difficultyMultiplier;
    enemy.health += floor((waveNumber - 1) / 2);
    
    // Adjust health based on difficulty (cap at 1 for basic enemies)
    if (enemy.type === 1) {
        enemy.health = max(1, floor(enemy.health * playerPerformance.difficultyMultiplier));
    } else {
        enemy.health = max(enemy.type, floor(enemy.health * playerPerformance.difficultyMultiplier));
    }
    enemy.maxHealth = enemy.health;
    
    enemies.push(enemy);
}

function spawnPowerUp() {
    let type = floor(random(1, 4));
    let x = random(width);
    let y = random(100, 200);
    powerups.push(new PowerUp(x, y, type));
}

function checkLevelUp() {
    levelScore += 1;
    console.log("Level score incremented to:", levelScore, "Threshold:", levelThreshold);
    
    if (levelScore >= levelThreshold) {
        level++;
        console.log("Level up! New level:", level);
        levelScore = 0;
        levelThreshold = 100 + (level * 50);
        console.log("New level threshold:", levelThreshold);
        
        // Visual feedback for level up
        for (let i = 0; i < 20; i++) {
            let angle = random(TWO_PI);
            let dist = random(50, 100);
            let x = width/2 + cos(angle) * dist;
            let y = height/2 + sin(angle) * dist;
            particles.push(new Explosion(x, y, color(0, 255, 255)));
        }
        // Play level up sound (commented out)
        // if (levelUpSound) levelUpSound.play();
    }
}

function activatePowerUp(type) {
    // Deactivate current power-up if any
    if (activePowerUp !== null) {
        deactivatePowerUp();
    }
    
    // Set new power-up
    activePowerUp = type;
    
    // Power-up duration scaled by difficulty (easier for struggling players)
    let baseDuration = 600; // 10 seconds at 60fps
    let durationMultiplier = 1 + (1 - playerPerformance.difficultyMultiplier) * 0.5;
    playerPowerUpTime = baseDuration * durationMultiplier;
    
    switch(type) {
        case 1: // Rapid fire
            shotDelay = 100; // Faster shooting
            break;
        case 2: // Triple shot
            // No additional setup needed
            break;
        case 3: // Shield
            playerShield = 3; // 3 hits of protection
            break;
    }
    
    // Play sound (commented out)
    // if (powerUpSound) powerUpSound.play();
}

function deactivatePowerUp() {
    if (activePowerUp === "speed boost") {
        player.maxSpeed = 5;
    }
    activePowerUp = null;
}

function mousePressed() {
    // If game hasn't started, return false to allow default browser behavior
    if (!gameStarted) {
        return false;
    }
    
    // Check if game is over and if submit score button is clicked
    if (gameOver) {
        // Submit score button dimensions
        let btnX = width/2;
        let btnY = height/2 + 170;
        let btnWidth = 200;
        let btnHeight = 50;
        
        // Check if submit score button is clicked
        if (mouseX > btnX - btnWidth/2 && mouseX < btnX + btnWidth/2 &&
            mouseY > btnY - btnHeight/2 && mouseY < btnY + btnHeight/2) {
            
            console.log("Submit score button clicked!");
            
            // Only allow submission if score is greater than 0
            if (score > 0) {
                // Store the score and related data in localStorage
                localStorage.setItem('gameScore', score);
                localStorage.setItem('gameLevel', level);
                localStorage.setItem('gameWave', waveNumber);
                
                // Disable p5.js keyboard handling
                window.p5KeyboardHandlingDisabled = true;
                
                // Pause the game loop
                noLoop();
                
                // Redirect to the score submission page
                window.location.href = 'submit-score.html';
            } else {
                alert("You need to score at least 1 point to submit your score!");
            }
        }
        
        // Note: Help and leaderboard buttons are now handled in drawGameOverScreen
        
        return false;
    }
    
    // Handle shooting
    if (!gameOver && gameStarted) {
        player.shoot();
    }
    
    return false;
}

function resetGame() {
    console.log("Resetting game. Previous state:", {
        score: score,
        level: level,
        waveNumber: waveNumber,
        gameOver: gameOver,
        playerLives: playerLives
    });
    
    // Capture stack trace for debugging
    console.log("Reset game called from:", new Error().stack);
    
    // Reset game state
    score = 0;
    level = 1;
    waveNumber = 1;
    gameOver = false;
    window.gameOver = false; // Ensure window object is also updated
    gameStarted = true;
    
    // Reset player lives
    playerLives = 3;
    console.log("Player lives reset to:", playerLives);
    playerShield = 0;
    activePowerUp = null;
    playerPowerUpTime = 0;
    
    // Reset high score state
    isHighScore = false;
    highScoreRank = 0;
    highScoreChecked = false;
    fireworks = [];
    
    // Ensure window object is in sync with game state
    window.waveNumber = waveNumber;
    window.gameOver = gameOver;
    window.gameStarted = gameStarted;
    
    console.log("Game reset complete - New state:", {
        score: score,
        level: level,
        waveNumber: waveNumber,
        gameOver: gameOver,
        gameStarted: gameStarted
    });
    
    // Reset player with position at center of screen
    player = new Player(width/2, height/2);
    
    // Clear entities
    enemies = [];
    bullets = [];
    particles = [];
    powerups = [];
    
    // Reset wave
    enemiesThisWave = 5;
    
    // Start the game loop if it was paused
    loop();
}

// Expose resetGame to the window object
window.resetGame = resetGame;

// Expose showScoreSubmission function to the window object
window.showScoreSubmission = function(score, level, wave) {
    // This function will be overridden by the one in index.html
    console.log("Score submission requested:", score, level, wave);
};

// Draw wave completed screen
function drawWaveCompletedScreen() {
    // CRITICAL DEBUG: Check if we're showing the wave 2 completion screen
    if (waveNumber === 2) {
        console.log("CRITICAL: Showing wave 2 completion screen. Current state:", {
            score: score,
            level: level,
            waveNumber: waveNumber,
            gameOver: gameOver,
            gameStarted: gameStarted,
            waveActive: waveActive,
            waveCompleted: waveCompleted,
            frameCount: frameCount,
            waveCompletedTime: waveCompletedTime,
            wavePauseTime: wavePauseTime,
            timeRemaining: wavePauseTime - (frameCount - waveCompletedTime)
        });
        
        // CRITICAL FIX: Ensure we're not accidentally resetting the game
        // This is a safeguard to prevent any unexpected resets
        gameOver = false;
        window.gameOver = false;
        gameStarted = true;
        window.gameStarted = true;
    }
    
    push();
    textAlign(CENTER, CENTER);
    textSize(40);
    fill(0, 255, 255);
    text("WAVE " + waveNumber + " COMPLETE!", width/2, height/2 - 50);
    
    textSize(24);
    fill(255);
    text("Prepare for Wave " + (waveNumber + 1), width/2, height/2);
    
    // Show difficulty increase
    textSize(18);
    fill(255, 200, 0);
    text("Enemy Speed ↑   Enemy Health ↑   Score Rewards ↑", width/2, height/2 + 50);
    
    // Show countdown
    let countdown = ceil((wavePauseTime - (frameCount - waveCompletedTime)) / 60);
    textSize(30);
    fill(255);
    text("Starting in: " + countdown, width/2, height/2 + 100);
    
    // Show player performance stats
    textSize(16);
    fill(200, 200, 255);
    let accuracy = playerPerformance.shotsFired > 0 ? 
        floor((playerPerformance.shotsHit / playerPerformance.shotsFired) * 100) : 0;
    text("Accuracy: " + accuracy + "%   Kills: " + playerPerformance.killsPerWave, width/2, height/2 + 140);
    
    pop();
}

// Start a new wave
function startWave() {
    console.log("Starting wave:", waveNumber, "at level:", level);
    
    waveActive = true;
    enemiesThisWave = 10 + (waveNumber - 1) * 5; // Increase enemies per wave
    console.log("Initial enemies in wave:", enemiesThisWave);
    
    // Apply adaptive difficulty based on player performance
    updateAdaptiveDifficulty();
    
    // Adjust enemy count based on difficulty
    enemiesThisWave = floor(enemiesThisWave * playerPerformance.difficultyMultiplier);
    enemiesRemaining = enemiesThisWave;
    console.log("Final enemies in wave after difficulty adjustment:", enemiesThisWave);
    
    // Reset wave performance stats
    playerPerformance.killsPerWave = 0;
    playerPerformance.deathsPerWave = 0;
    playerPerformance.shotsFired = 0;
    playerPerformance.shotsHit = 0;
}

// Complete current wave
function completeWave() {
    console.log("Attempting to complete wave:", waveNumber);
    console.log("Kills this wave:", playerPerformance.killsPerWave);
    
    // CRITICAL DEBUG: Check if we're completing wave 2
    if (waveNumber === 2) {
        console.log("CRITICAL: Completing wave 2. Current state:", {
            score: score,
            level: level,
            waveNumber: waveNumber,
            gameOver: gameOver,
            gameStarted: gameStarted,
            waveActive: waveActive,
            waveCompleted: waveCompleted,
            enemiesRemaining: enemiesRemaining,
            enemies: enemies.length,
            killsThisWave: playerPerformance.killsPerWave
        });
    }
    
    // CRITICAL DEBUG: Check if we're completing wave 4
    if (waveNumber === 4) {
        console.log("CRITICAL: Completing wave 4. Current state:", {
            score: score,
            level: level,
            waveNumber: waveNumber,
            gameOver: gameOver,
            gameStarted: gameStarted,
            waveActive: waveActive,
            waveCompleted: waveCompleted,
            enemiesRemaining: enemiesRemaining,
            enemies: enemies.length,
            killsThisWave: playerPerformance.killsPerWave
        });
    }
    
    // Only complete the wave if the player has destroyed some enemies
    // This prevents progressing through waves without scoring
    if (playerPerformance.killsPerWave > 0) {
        console.log("Wave completed successfully");
        waveCompleted = true;
        waveCompletedTime = frameCount;
        
        // CRITICAL FIX: Ensure we're not accidentally resetting the game
        // This is a safeguard to prevent any unexpected resets
        if (waveNumber === 2) {
            console.log("CRITICAL: Just completed wave 2. Ensuring game state is preserved.");
            // Force the game to continue without resetting
            gameOver = false;
            window.gameOver = false;
            gameStarted = true;
            window.gameStarted = true;
        }
        
        // CRITICAL FIX: Ensure we're not accidentally resetting the game at wave 4
        if (waveNumber === 4) {
            console.log("CRITICAL: Just completed wave 4. Ensuring game state is preserved.");
            // Force the game to continue without resetting
            gameOver = false;
            window.gameOver = false;
            gameStarted = true;
            window.gameStarted = true;
        }
        
        // Visual feedback for wave completion
        for (let i = 0; i < 30; i++) {
            let angle = random(TWO_PI);
            let dist = random(100, 200);
            let x = width/2 + cos(angle) * dist;
            let y = height/2 + sin(angle) * dist;
            particles.push(new Explosion(x, y, color(0, 255, 255)));
        }
    } else {
        console.log("Wave not completed - no enemies killed");
        // If no enemies were killed, don't complete the wave
        // Instead, spawn more enemies
        enemiesRemaining = min(5, enemiesThisWave);
        waveActive = true;
    }
}

// Start the next wave
function startNextWave() {
    // CRITICAL DEBUG: Check if we're about to start wave 3 (after completing wave 2)
    if (waveNumber === 2) {
        console.log("CRITICAL: About to start wave 3 (after wave 2). Current state:", {
            score: score,
            level: level,
            waveNumber: waveNumber,
            gameOver: gameOver,
            gameStarted: gameStarted,
            waveActive: waveActive,
            waveCompleted: waveCompleted,
            enemiesRemaining: enemiesRemaining,
            enemies: enemies.length
        });
    }
    
    // CRITICAL DEBUG: Check if we're about to start wave 5 (which was causing resets)
    if (waveNumber === 4) {
        console.log("CRITICAL: About to start wave 5. Current state:", {
            score: score,
            level: level,
            waveNumber: waveNumber,
            gameOver: gameOver,
            gameStarted: gameStarted,
            waveActive: waveActive,
            waveCompleted: waveCompleted,
            enemiesRemaining: enemiesRemaining,
            enemies: enemies.length
        });
    }
    
    waveNumber++;
    window.waveNumber = waveNumber;  // Update the window object
    
    // Debug logging
    console.log("Starting next wave:", waveNumber);
    console.log("Current level before increment:", level);
    
    // Only increment level if player has scored points
    // This ensures players can't reach high levels with 0 score
    if (score > 0) {
        level++;
        console.log("Level incremented to:", level);
    } else {
        console.log("Level not incremented, score is:", score);
    }
    
    waveCompleted = false;
    waveActive = false;
    
    // Increase difficulty with each wave
    levelThreshold = 100 + (level * 50);
    console.log("New level threshold:", levelThreshold);
    
    // CRITICAL FIX: Ensure we're not accidentally resetting the game
    // This is a safeguard to prevent any unexpected resets
    if (waveNumber === 3) {
        console.log("CRITICAL: Just started wave 3. Ensuring game state is preserved.");
        // Force the game to continue without resetting
        gameOver = false;
        window.gameOver = false;
        gameStarted = true;
        window.gameStarted = true;
    }
    
    // CRITICAL FIX: Prevent reset at wave 5
    if (waveNumber === 5) {
        console.log("CRITICAL: Just started wave 5. Ensuring game state is preserved.");
        // Force the game to continue without resetting
        gameOver = false;
        window.gameOver = false;
        gameStarted = true;
        window.gameStarted = true;
    }
}

// Update adaptive difficulty based on player performance
function updateAdaptiveDifficulty() {
    // Calculate accuracy
    let accuracy = playerPerformance.shotsFired > 0 ? 
        playerPerformance.shotsHit / playerPerformance.shotsFired : 0;
    
    // Calculate kill efficiency (kills vs deaths)
    let killEfficiency = playerPerformance.deathsPerWave > 0 ? 
        playerPerformance.killsPerWave / playerPerformance.deathsPerWave : 
        playerPerformance.killsPerWave;
    
    // Normalize kill efficiency (cap at 10)
    killEfficiency = min(killEfficiency, 10);
    
    // Calculate performance score (0.0 to 1.0, higher is better)
    let performanceScore = (accuracy * 0.4) + (killEfficiency / 10 * 0.6);
    
    // Adjust difficulty multiplier based on performance
    // Range: 0.7 (easier) to 1.3 (harder)
    playerPerformance.difficultyMultiplier = map(performanceScore, 0, 1, 0.7, 1.3);
    
    console.log("Player performance:", performanceScore, "Difficulty:", playerPerformance.difficultyMultiplier);
}

// Draw notifications
function drawNotifications() {
    for (let i = notifications.length - 1; i >= 0; i--) {
        let notification = notifications[i];
        
        push();
        textAlign(CENTER, CENTER);
        textSize(20);
        fill(notification.color);
        text(notification.text, notification.position.x, notification.position.y);
        pop();
        
        notification.life--;
        if (notification.life <= 0) {
            notifications.splice(i, 1);
        }
    }
}

// Helper function to draw a star
function star(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1;
        sy = y + sin(a + halfAngle) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
}

// Add these functions for the fireworks effect

// Create multiple fireworks
function createFireworks(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            let x = random(width * 0.2, width * 0.8);
            let y = random(height * 0.2, height * 0.6);
            createFirework(x, y);
        }, i * 300); // Stagger the fireworks
    }
}

// Create a single firework
function createFirework(x, y) {
    let color = {
        r: random(150, 255),
        g: random(150, 255),
        b: random(150, 255)
    };

    // Create explosion particles
    for (let i = 0; i < 50; i++) {
        let angle = random(TWO_PI);
        let speed = random(2, 6);
        let size = random(2, 5);
        let life = random(30, 60);
        
        fireworks.push({
            x: x,
            y: y,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            size: size,
            color: color,
            life: life,
            maxLife: life
        });
    }

    // Play sound if available
    // if (explosionSound) explosionSound.play();
}

// Update and draw fireworks
function updateFireworks() {
    for (let i = fireworks.length - 1; i >= 0; i--) {
        let f = fireworks[i];
        
        // Update position
        f.x += f.vx;
        f.y += f.vy;
        
        // Apply gravity
        f.vy += 0.05;
        
        // Decrease life
        f.life--;
        
        // Remove dead particles
        if (f.life <= 0) {
            fireworks.splice(i, 1);
            continue;
        }
        
        // Draw particle
        let alpha = map(f.life, 0, f.maxLife, 0, 255);
        fill(f.color.r, f.color.g, f.color.b, alpha);
        noStroke();
        ellipse(f.x, f.y, f.size);
    }
}

// Add a proper implementation of the checkHighScore function
async function checkHighScore() {
    console.log("Checking for high score...");
    
    // Mark as checked to prevent multiple checks
    highScoreChecked = true;
    
    try {
        // Only proceed if supabaseClient is defined
        if (typeof supabaseClient === 'undefined') {
            console.log("Supabase client not available, skipping high score check");
            return;
        }
        
        // Get current top 10 scores
        const { data, error } = await supabaseClient
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error("Error fetching leaderboard:", error);
            return;
        }
        
        // Check if current score would make it into the top 10
        if (data.length < 10 || score > data[data.length - 1].score) {
            console.log("New high score achieved!");
            isHighScore = true;
            
            // Calculate rank
            let rank = 1;
            for (let i = 0; i < data.length; i++) {
                if (score <= data[i].score) {
                    rank++;
                }
            }
            
            highScoreRank = rank;
            
            // Create fireworks to celebrate
            createFireworks(5);
            
            return true;
        } else {
            console.log("Score not high enough for leaderboard");
            return false;
        }
    } catch (e) {
        console.error("Error in checkHighScore:", e);
        return false;
    }
}
