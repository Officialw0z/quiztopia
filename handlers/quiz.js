import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const dynamo = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

function getUserFromToken(event) {
  const authHeader = event.headers?.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("Missing token");
  return jwt.verify(token, JWT_SECRET);
}

export async function createQuiz(event) {
  try {
    const user = getUserFromToken(event);
    const body = JSON.parse(event.body);

    if (!body.title) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing quiz title" }, null, 2) };
    }

    const quiz = {
      quizId: uuidv4(),
      title: body.title,
      creatorId: user.userId,
    };

    await dynamo.put({ TableName: QUIZZES_TABLE, Item: quiz }).promise();

    return { statusCode: 201, body: JSON.stringify({ message: "Quiz created", quiz }, null, 2) };
  } catch (err) {
    console.error("CreateQuiz error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }, null, 2) };
  }
}

export async function getQuizzes() {
  try {
    const result = await dynamo.scan({ TableName: QUIZZES_TABLE }).promise();

    const quizzes = result.Items.map((q) => ({
      quizId: q.quizId,
      title: q.title,
      creatorId: q.creatorId,
    }));

    return { statusCode: 200, body: JSON.stringify(quizzes, null, 2) };
  } catch (err) {
    console.error("GetQuizzes error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }, null, 2) };
  }
}

export async function deleteQuiz(event) {
  try {
    const user = getUserFromToken(event);
    const quizId = event.pathParameters.quizId;

    // Hämta quizet
    const quizResult = await dynamo
      .get({ TableName: QUIZZES_TABLE, Key: { quizId } })
      .promise();

    if (!quizResult.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Quiz not found" }, null, 2) };
    }

    // Kontrollera att användaren är skaparen
    if (quizResult.Item.creatorId !== user.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: "Not allowed" }, null, 2) };
    }

    // Ta bort quizet
    await dynamo.delete({ TableName: QUIZZES_TABLE, Key: { quizId } }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: "Quiz deleted" }, null, 2) };
  } catch (err) {
    console.error("DeleteQuiz error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }, null, 2) };
  }
}
