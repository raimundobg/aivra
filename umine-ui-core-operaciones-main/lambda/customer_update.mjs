import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "umine-customers";

export const handler = async (event) => {
    let body;
    try {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event;
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid JSON body" })
        };
    }

    const { id, ...updateFields } = body;

    if (!id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required field: id" })
        };
    }

    // Build update expression dynamically
    const updateExpressionParts = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.entries(updateFields).forEach(([key, value]) => {
        if (key === "id" || key === "createdAt") return; // Protection

        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;

        updateExpressionParts.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
    });

    // Always update updatedAt
    updateExpressionParts.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = Date.now();

    const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

    try {
        await ddbDocClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Customer updated successfully" })
        };
    } catch (error) {
        console.error("Error updating customer:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Could not update customer", details: error.message })
        };
    }
};
