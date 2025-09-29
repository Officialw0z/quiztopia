import AWS from "aws-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";

const dynamo = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

async function registerHandler(event) {
  const { username, password } = event.body;

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing username or password" }, null, 2),
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    userId: uuidv4(),
    username,
    passwordHash: hashedPassword,
  };

  await dynamo.put({ TableName: USERS_TABLE, Item: user }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify(
      {
        message: "User created",
        userId: user.userId,
      },
      null,
      2
    ),
  };
}

async function loginHandler(event) {
  const { username, password } = event.body;

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing username or password" }, null, 2),
    };
  }

  const result = await dynamo
    .scan({
      TableName: USERS_TABLE,
      FilterExpression: "username = :u",
      ExpressionAttributeValues: { ":u": username },
    })
    .promise();

  if (result.Items.length === 0) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid credentials" }, null, 2),
    };
  }

  const user = result.Items[0];
  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid credentials" }, null, 2),
    };
  }

  const token = jwt.sign({ userId: user.userId, username: user.username }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { statusCode: 200, body: JSON.stringify({ token }, null, 2) };
}

export const register = middy(registerHandler).use(httpJsonBodyParser()).use(httpErrorHandler());
export const login = middy(loginHandler).use(httpJsonBodyParser()).use(httpErrorHandler());
