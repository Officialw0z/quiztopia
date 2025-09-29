# 📚 Quiztopia API  

## ✨ Beskrivning  
**Quiztopia API** är en serverless backend byggd på **AWS Lambda**, **API Gateway** och **DynamoDB**.  

👉 Funktioner:  
- 📝 Registrera användare & logga in med **JWT**  
- 📘 Skapa quiz & lägga till frågor  
- ❌ Ta bort quiz *(endast ägare)*  
- 🏆 Leaderboard för poäng  

---

## 🛠️ Tekniker  
- ⚡ **Node.js 18 (ESM)**  
- ⚙️ **Serverless Framework**  
- ☁️ **AWS Lambda**  
- 🗄️ **DynamoDB**  
- 🌐 **API Gateway (HTTP API)**  
- 🔑 **JWT (JSON Web Token)**  

---

## 🚀 Setup  

### 1️⃣ Klona repo 
```bash
git clone https://github.com/
<ditt-användarnamn>/quiztopia.git
cd quiztopia

2️⃣ Installera dependencies

npm install

3️⃣ Deploya till AWS

sls deploy

Efter deploy får du en bas-URL, t.ex.
https://kqevgy6be0.execute-api.eu-north-1.amazonaws.com

🔧 Environment Variables

Dessa sätts via serverless.yml:

USERS_TABLE=Users
QUIZZES_TABLE=Quizzes
SCORES_TABLE=Scores
JWT_SECRET=<hemlig_nyckel>
```
## 📌 Endpoints
### 🧑 Auth

POST /register → Skapa användare

POST /login → Logga in & få JWT

### ❓Quiz

POST /quizzes → Skapa quiz (kräver JWT)

GET /quizzes → Hämta alla quiz

DELETE /quizzes/{quizId} → Ta bort quiz (endast ägare, kräver JWT)

### 📝 Questions

POST /quizzes/{quizId}/questions → Lägg till fråga (kräver JWT och ägarskap)

GET /quizzes/{quizId}/questions → Hämta frågor för quiz

### 🏆 Scores

POST /quizzes/{quizId}/score → Registrera poäng

GET /quizzes/{quizId}/leaderboard → Hämta leaderboard

### 📬 Postman

En färdig Postman Collection finns i repo:

📂 quiztopia.postman_collection.json

👉 Importera den i Postman för att snabbt testa API:et.
Vi använder två environment-variabler:

{{token}} → sätts vid login

{{quizId}} → sätts vid createQuiz

### 🖇️ Exempel-flöde

- Register → POST /register
- Login → POST /login (spara token)
- Skapa quiz → POST /quizzes (spara quizId)
- Lägg till fråga → POST /quizzes/{{quizId}}/questions
- Hämta frågor → GET /quizzes/{{quizId}}/questions
- Registrera score → POST /quizzes/{{quizId}}/score
- Leaderboard → GET /quizzes/{{quizId}}/leaderboard
- Ta bort quiz → DELETE /quizzes/{{quizId}}
