import AWS from "aws-sdk";
import jwt from "jsonwebtoken";

const dynamo = new AWS.DynamoDB.DocumentClient();
const SCORES_TABLE = process.env.SCORES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

function getUserFromToken(event) {
  const authHeader = event.headers?.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("Missing token");
  return jwt.verify(token, JWT_SECRET);
}

// POST /quizzes/{quizId}/score
export async function addScore(event) {
  try {
    const user = getUserFromToken(event);
    const quizId = event.pathParameters.quizId;
    const body = JSON.parse(event.body);

    if (!body.score || typeof body.score !== "number") {
      return { statusCode: 400, body: JSON.stringify({ error: "Score must be a number" }, null, 2) };
    }

    await dynamo
      .put({
        TableName: SCORES_TABLE,
        Item: {
          quizId,
          userId: user.userId,
          username: user.username,
          score: body.score,
        },
      })
      .promise();

    return { statusCode: 201, body: JSON.stringify({ message: "Score added" }, null, 2) };
  } catch (err) {
    console.error("AddScore error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }, null, 2) };
  }
}

// GET /quizzes/{quizId}/leaderboard
export async function getLeaderboard(event) {
  try {
    const quizId = event.pathParameters.quizId;

    const result = await dynamo
      .query({
        TableName: SCORES_TABLE,
        KeyConditionExpression: "quizId = :q",
        ExpressionAttributeValues: { ":q": quizId },
      })
      .promise();

    const leaderboard = result.Items.sort((a, b) => b.score - a.score);

    return { statusCode: 200, body: JSON.stringify(leaderboard, null, 2) };
  } catch (err) {
    console.error("GetLeaderboard error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }, null, 2) };
  }
}