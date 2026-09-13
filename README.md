🟢 Ahli Challenge | تحدي الأهلي

Ahli Challenge is an interactive Arabic quiz game dedicated to Al-Ahli Saudi Club fans.

Test your knowledge of the club’s history, players, championships, unforgettable moments, and Asian competitions. Play alone, challenge another player, compete in teams, or create a private room with your friends.

اختبر معرفتك بالملكي 👑💚

⸻

🎮 Game Modes

Ahli Challenge currently supports multiple game modes:

👤 Solo

Play alone and test your Al-Ahli knowledge.

* 10 random questions per match
* Score points for correct answers
* Try to achieve the highest possible score

⚔️ 1 vs 1

Search for another online player and compete in a real-time quiz match.

* Automatic matchmaking
* Same questions for both players
* Real-time synchronized gameplay
* Final score determines the winner

👥 2 vs 2

Join a team and compete against another team.

* 4 players in one match
* Two players per team
* Each player earns individual points
* The team score is calculated from the combined points of both players

🔐 Private Rooms

Create a private room and invite your friends using a room code.

Private rooms currently support:

* 2 players
* 4 players
* Ready system before starting
* Host-controlled game start
* Real-time room synchronization

Players can also join an existing room using its code.

⸻

❓ Question System

The project currently contains a bank of approximately 100 Al-Ahli questions.

Each match randomly selects 10 questions, which makes every game different.

The question bank includes topics such as:

* 🏆 Al-Ahli history
* 🇸🇦 Saudi competitions
* 🌏 AFC Champions League
* ⭐ Famous Al-Ahli players
* ⚽ Omar Al Somah era
* 🏆 AFC Champions League Elite
* 📅 Historic matches and achievements

Questions are stored inside:

js/questions.js

⸻

🧠 How the Game Works

1. The player enters a name.
2. The player selects a game mode.
3. For multiplayer modes, the system creates or finds a room.
4. Players enter the lobby.
5. All required players become Ready.
6. The match starts.
7. Ten questions are selected randomly from the question bank.
8. Players answer before the timer ends.
9. Correct and faster answers earn points.
10. The final leaderboard displays the winner.

For 2 vs 2, the final result is based on the total score of each team.

⸻

⚡ Real-Time Multiplayer

Online multiplayer is powered by Firebase.

The project uses:

* Firebase Authentication
* Anonymous Authentication
* Firebase Realtime Database

Firebase is responsible for synchronizing:

* Players
* Rooms
* Matchmaking queues
* Ready status
* Questions
* Answers
* Scores
* Match state

⸻

🛠️ Technologies

The project was built using:

* HTML5
* CSS3
* JavaScript
* Firebase Authentication
* Firebase Realtime Database

No frontend framework is required.

⸻

📁 Project Structure

ahliChallnge-Q/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── questions.js
│   └── ...
│
└── README.md

index.html

Contains the main game interface and screens.

css/style.css

Contains the full visual design, responsive layout, animations, game cards, lobby, and gameplay styling.

js/questions.js

Contains the Al-Ahli question bank used by the game.

JavaScript files

Handle the game logic, Firebase connection, matchmaking, rooms, scoring, timers, and multiplayer synchronization.

⸻

🚀 Running the Project

Clone the repository:

git clone https://github.com/khalidAlmutairii/ahliChallnge-Q.git

Open the project folder:

cd ahliChallnge-Q

Then run the project using a local web server.

For example, with VS Code Live Server:

1. Open the project in VS Code.
2. Install the Live Server extension.
3. Right-click index.html.
4. Select Open with Live Server.

⸻

🔥 Firebase Setup

To use the online multiplayer features, Firebase must be configured.

The project requires:

Firebase Authentication
→ Anonymous Authentication
Firebase Realtime Database
→ Rooms
→ Matchmaking
→ Players
→ Game State

For development and testing, authenticated users need permission to read and write the necessary game data.

⚠️ Development Firebase rules should not be used as production security rules without proper restrictions and validation.

⸻

🎯 Current Features

* ✅ Solo mode
* ✅ Random 1v1 matchmaking
* ✅ Random 2v2 matchmaking
* ✅ Private rooms
* ✅ Join using room code
* ✅ Player Ready system
* ✅ Host controls
* ✅ Real-time multiplayer
* ✅ Random question selection
* ✅ 100-question bank
* ✅ Timed questions
* ✅ Speed-based scoring
* ✅ Individual scores
* ✅ Team scores
* ✅ Final match results
* ✅ Arabic RTL interface
* ✅ Responsive design

⸻

🚧 Planned Features

The project is still being developed.

Future updates may include:

* 🖼️ Image questions
* 🔊 Audio questions
* 🏅 Global leaderboard
* 👤 Player profiles
* 📊 Player statistics
* 🔥 Win streaks
* 🏆 Ranking system
* 🎖️ Achievements
* 📱 Improved mobile experience
* 🛡️ Admin dashboard
* ➕ Add and edit questions without modifying the source code
* 🎯 More Al-Ahli questions and categories

⸻

💡 Project Goal

The goal of Ahli Challenge is to create a fun competitive platform for Al-Ahli supporters where fans can test their knowledge and compete with friends and other supporters.

Instead of being a traditional static quiz, the project focuses on:

Competition + Speed + Football Knowledge + Multiplayer

⸻

🟢 About Al-Ahli Challenge

Ahli Challenge — تحدي الأهلاويين

A fan-made project inspired by the history and supporters of Al-Ahli Saudi Club.

This project is not an official product of Al-Ahli Saudi Club.

⸻

👨‍💻 Developer

Developed by Khalid Almutairi

GitHub:
@khalidAlmutairii

⸻

⭐ Support

If you like the project, consider giving the repository a ⭐ on GitHub.

كن قد التحدي واختبر معرفتك بالملكي 💚👑