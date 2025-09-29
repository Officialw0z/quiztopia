import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import { getUserFromToken } from "../utils/authhelper.js";

const dynamo = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

async function addQuestionHandler(event) {
  const user = getUserFromToken(event);
  const quizId = event.pathParameters.quizId;
  const { question, answer, lat, long } = event.body;

  if (!question || !answer || !lat || !long) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing question, answer, lat, or long" }, null, 2),
    };
  }

  const quizResult = await dynamo.get({ TableName: QUIZZES_TABLE, Key: { quizId } }).promise();

  if (!quizResult.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: "Quiz not found" }, null, 2) };
  }
  if (quizResult.Item.creatorId !== user.userId) {
    return { statusCode: 403, body: JSON.stringify({ error: "Not allowed" }, null, 2) };
  }

  const questionObj = {
    questionId: uuidv4(),
    question,
    answer,
    lat,
    long,
  };

  await dynamo
    .update({
      TableName: QUIZZES_TABLE,
      Key: { quizId },
      UpdateExpression: "SET questions = list_append(if_not_exists(questions, :emptyList), :q)",
      ExpressionAttributeValues: {
        ":q": [questionObj],
        ":emptyList": [],
      },
      ReturnValues: "UPDATED_NEW",
    })
    .promise();

  return { statusCode: 201, body: JSON.stringify({ message: "Question added", question: questionObj }, null, 2) };
}

async function getQuestionsHandler(event) {
  const quizId = event.pathParameters.quizId;

  const quizResult = await dynamo.get({ TableName: QUIZZES_TABLE, Key: { quizId } }).promise();

  if (!quizResult.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: "Quiz not found" }, null, 2) };
  }

  return { statusCode: 200, body: JSON.stringify(quizResult.Item.questions || [], null, 2) };
}

export const addQuestion = middy(addQuestionHandler).use(httpJsonBodyParser()).use(httpErrorHandler());
export const getQuestions = middy(getQuestionsHandler).use(httpErrorHandler());
