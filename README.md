📚 Quiztopia API

🔹 Beskrivning

Quiztopia API är en serverless backend byggd på AWS Lambda, API Gateway och DynamoDB.
Användare kan registrera sig, logga in, skapa quiz, lägga till frågor, ta bort quiz, spela quiz och få poäng på en leaderboard.

Projektet är en del av examinationen i kursen och uppfyller både G-krav och VG-krav.

🔹 Tekniker

Node.js 18 (ESM)

Serverless Framework

AWS Lambda

DynamoDB

API Gateway (HTTP API)

Middy (för hantering av events – om du vill lägga till senare)

JWT (JSON Web Token) för auth

🔹 Setup

Klona repo:

git clone <repo-url>
cd quiztopia


Installera dependencies:

npm install


Deploya till AWS:

sls deploy


Din bas-URL visas efter deploy, t.ex.

https://kqevgy6be0.execute-api.eu-north-1.amazonaws.com

🔹 Environment Variables

Serverless konfigurerar dessa automatiskt i serverless.yml:

USERS_TABLE=Users

QUIZZES_TABLE=Quizzes

SCORES_TABLE=Scores

JWT_SECRET=<hemlig_nyckel>

🔹 Endpoints
Auth

POST /register → skapa användare

POST /login → logga in och få JWT

Quiz

POST /quizzes → skapa quiz (kräver JWT)

GET /quizzes → hämta alla quiz

DELETE /quizzes/{quizId} → ta bort quiz (endast ägare, kräver JWT)

Questions

POST /quizzes/{quizId}/questions → lägg till fråga (kräver JWT och att du äger quizet)

GET /quizzes/{quizId}/questions → hämta frågor för quiz

Scores

POST /quizzes/{quizId}/score → registrera poäng för inloggad användare

GET /quizzes/{quizId}/leaderboard → hämta leaderboard för quiz

🔹 Postman

En färdig Postman Collection finns inkluderad i repo:

quiztopia.postman_collection.json

Importera den i Postman för att snabbt testa alla endpoints.
Vi använder två environment-variabler i collection:

{{token}} → sätts vid login

{{quizId}} → sätts vid createQuiz

🔹 Exempel på flöde

Register → POST /register

Login → POST /login (spara token)

Skapa quiz → POST /quizzes (spara quizId)

Lägg till fråga → POST /quizzes/{{quizId}}/questions

Hämta frågor → GET /quizzes/{{quizId}}/questions

Registrera score → POST /quizzes/{{quizId}}/score

Leaderboard → GET /quizzes/{{quizId}}/leaderboard

Ta bort quiz → DELETE /quizzes/{{quizId}}
