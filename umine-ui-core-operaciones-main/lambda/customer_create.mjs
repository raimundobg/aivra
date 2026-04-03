import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

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

    const {
        id, // Optional, can be institutionId
        name,
        otic,
        status,
        clientType,
        segment,
        comercialManager,
        comercialContact,
        coordinatorManager,
        coordinatorContact,
        platformType,
        domain,
        adminUsername,
        password,
        appName,
        contactName,
        contactPosition,
        contactEmail,
        contactPhone,
        reportUrl,
        institutionId
    } = body;

    if (!name) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required field: name" })
        };
    }

    const customerId = id || institutionId || `cust_${Date.now()}`;

    const item = {
        id: customerId,
        institutionId: institutionId || customerId,
        name,
        otic: otic || "",
        status: status || "CLIENTE ACTIVO",
        clientType: clientType || "Cliente Plataforma",
        segment: segment || "",
        comercialManager: comercialManager || "",
        comercialContact: comercialContact || "",
        coordinatorManager: coordinatorManager || "",
        coordinatorContact: coordinatorContact || "",
        platformType: platformType || "PLATAFORMA PROPIA",
        domain: domain || "",
        adminUsername: adminUsername || "",
        password: password || "",
        appName: appName || "",
        contactName: contactName || "",
        contactPosition: contactPosition || "",
        contactEmail: contactEmail || "",
        contactPhone: contactPhone || "",
        reportUrl: reportUrl || "",
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    try {
        await ddbDocClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Customer created successfully", customerId: item.id })
        };
    } catch (error) {
        console.error("Error creating customer:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Could not create customer", details: error.message })
        };
    }
};
