import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const dynamo = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

// helper för att verifiera användare
function getUserFromToken(event) {
  const authHeader = event.headers?.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("Missing token");
  return jwt.verify(token, JWT_SECRET);
}

// POST /quizzes/{quizId}/questions
export async function addQuestion(event) {
  try {
    const user = getUserFromToken(event);
    const quizId = event.pathParameters.quizId;
    const body = JSON.parse(event.body);

    if (!body.question || !body.answer || !body.lat || !body.long) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing question, answer, lat, or long" }, null, 2),
      };
    }

    // hämta quiz för att kolla att användaren är ägare
    const quizResult = await dynamo
      .get({ TableName: QUIZZES_TABLE, Key: { quizId } })
      .promise();

    if (!quizResult.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Quiz not found" }, null, 2) };
    }
    if (quizResult.Item.creatorId !== user.userId) {
      return { statusCode: 403, body: JSON.stringify({ error: "Not allowed" }, null, 2) };
    }

    // fråga sparas som array i quizet
    const question = {
      questionId: uuidv4(),
      question: body.question,
      answer: body.answer,
      lat: body.lat,
      long: body.long,
    };

    // uppdatera quizet
    await dynamo
      .update({
        TableName: QUIZZES_TABLE,
        Key: { quizId },
        UpdateExpression:
          "SET questions = list_append(if_not_exists(questions, :emptyList), :q)",
        ExpressionAttributeValues: {
          ":q": [question],
          ":emptyList": [],
        },
        ReturnValues: "UPDATED_NEW",
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Question added", question }, null, 2),
    };
  } catch (err) {
    console.error("AddQuestion error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }, null, 2) };
  }
}

// GET /quizzes/{quizId}/questions
export async function getQuestions(event) {
  try {
    const quizId = event.pathParameters.quizId;

    const quizResult = await dynamo
      .get({ TableName: QUIZZES_TABLE, Key: { quizId } })
      .promise();

    if (!quizResult.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Quiz not found" }, null, 2) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(quizResult.Item.questions || [], null, 2),
    };
  } catch (err) {
    console.error("GetQuestions error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }, null, 2) };
  }
}
