import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import { getUserFromToken } from "../utils/authhelper.js";

const dynamo = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

async function createQuizHandler(event) {
  const user = getUserFromToken(event);
  const { title } = event.body;

  if (!title) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing quiz title" }, null, 2) };
  }

  const quiz = {
    quizId: uuidv4(),
    title,
    creatorId: user.userId,
  };

  await dynamo.put({ TableName: QUIZZES_TABLE, Item: quiz }).promise();

  return { statusCode: 201, body: JSON.stringify({ message: "Quiz created", quiz }, null, 2) };
}

async function getQuizzesHandler() {
  const result = await dynamo.scan({ TableName: QUIZZES_TABLE }).promise();

  const quizzes = result.Items.map((q) => ({
    quizId: q.quizId,
    title: q.title,
    creatorId: q.creatorId,
  }));

  return { statusCode: 200, body: JSON.stringify(quizzes, null, 2) };
}

async function deleteQuizHandler(event) {
  const user = getUserFromToken(event);
  const quizId = event.pathParameters.quizId;

  const quizResult = await dynamo
    .get({ TableName: QUIZZES_TABLE, Key: { quizId } })
    .promise();

  if (!quizResult.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: "Quiz not found" }, null, 2) };
  }

  if (quizResult.Item.creatorId !== user.userId) {
    return { statusCode: 403, body: JSON.stringify({ error: "Not allowed" }, null, 2) };
  }

  await dynamo.delete({ TableName: QUIZZES_TABLE, Key: { quizId } }).promise();

  return { statusCode: 200, body: JSON.stringify({ message: "Quiz deleted" }, null, 2) };
}

export const createQuiz = middy(createQuizHandler).use(httpJsonBodyParser()).use(httpErrorHandler());
export const getQuizzes = middy(getQuizzesHandler).use(httpErrorHandler());
export const deleteQuiz = middy(deleteQuizHandler).use(httpErrorHandler());
