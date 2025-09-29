import AWS from "aws-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const dynamo = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

export async function register(event) {
  try {
    const body = JSON.parse(event.body);

    if (!body.username || !body.password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing username or password" }, null, 2),
      };
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = {
      userId: uuidv4(),
      username: body.username,
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
  } catch (err) {
    console.error("Register error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }, null, 2),
    };
  }
}

export async function login(event) {
  try {
    const body = JSON.parse(event.body);

    if (!body.username || !body.password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing username or password" }, null, 2),
      };
    }

    const result = await dynamo
      .scan({
        TableName: USERS_TABLE,
        FilterExpression: "username = :u",
        ExpressionAttributeValues: { ":u": body.username },
      })
      .promise();

    if (result.Items.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }, null, 2),
      };
    }

    const user = result.Items[0];
    const valid = await bcrypt.compare(body.password, user.passwordHash);

    if (!valid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid credentials" }, null, 2),
      };
    }

    const token = jwt.sign(
      { userId: user.userId, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { statusCode: 200, body: JSON.stringify({ token }, null, 2) };
  } catch (err) {
    console.error("Login error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }, null, 2),
    };
  }
}
