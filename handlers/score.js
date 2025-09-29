import AWS from "aws-sdk";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import { getUserFromToken } from "../utils/authhelper.js";

const dynamo = new AWS.DynamoDB.DocumentClient();
const SCORES_TABLE = process.env.SCORES_TABLE;

async function addScoreHandler(event) {
  const user = getUserFromToken(event);
  const quizId = event.pathParameters.quizId;
  const { score } = event.body;

  if (!score || typeof score !== "number") {
    return { statusCode: 400, body: JSON.stringify({ error: "Score must be a number" }, null, 2) };
  }

  await dynamo
    .put({
      TableName: SCORES_TABLE,
      Item: {
        quizId,
        userId: user.userId,
        username: user.username,
        score,
      },
    })
    .promise();

  return { statusCode: 201, body: JSON.stringify({ message: "Score added" }, null, 2) };
}

async function getLeaderboardHandler(event) {
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
}

export const addScore = middy(addScoreHandler).use(httpJsonBodyParser()).use(httpErrorHandler());
export const getLeaderboard = middy(getLeaderboardHandler).use(httpErrorHandler());
