import { DynamoDB } from 'aws-sdk';
import { SessionRecord } from '../types';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE || '';

import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(process.cwd(), '.local_db.json');

// Helper to read local DB
const readLocalDb = (): SessionRecord[] => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        return [];
    }
};

// Helper to write local DB
const writeLocalDb = (data: SessionRecord[]) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export const DynamoService = {
    async saveSession(session: SessionRecord): Promise<void> {
        if (process.env.IS_OFFLINE) {
            console.log('[OFFLINE] Saving to local DB:', session.pk);
            const db = readLocalDb();
            // Remove existing if any (upsert)
            const newDb = db.filter(item => item.pk !== session.pk);
            newDb.push(session);
            writeLocalDb(newDb);
            return;
        }
        await dynamoDb.put({
            TableName: TABLE_NAME,
            Item: session,
        }).promise();
    },

    async getSession(idSesionAlumno: string): Promise<SessionRecord | undefined> {
        if (process.env.IS_OFFLINE) {
            const db = readLocalDb();
            const session = db.find(item => item.pk === `SESSION#${idSesionAlumno}`);
            console.log('[OFFLINE] Read from local DB:', session ? 'FOUND' : 'NOT FOUND');
            return session || {
                pk: `SESSION#${idSesionAlumno}`,
                sk: 'METADATA',
                rutOtec: 'MOCK-OTEC',
                codSence: 'MOCK-SENCE',
                runAlumno: 'MOCK-RUN',
                startTime: new Date().toISOString(),
                status: 'ACTIVE'
            } as SessionRecord;
        }
        const result = await dynamoDb.get({
            TableName: TABLE_NAME,
            Key: {
                pk: `SESSION#${idSesionAlumno}`,
                sk: 'METADATA',
            },
        }).promise();
        return result.Item as SessionRecord;
    },

    async updateSessionEnd(idSesionAlumno: string, endTime: string): Promise<void> {
        if (process.env.IS_OFFLINE) {
            console.log('[OFFLINE] Updating session end:', idSesionAlumno);
            const db = readLocalDb();
            const index = db.findIndex(item => item.pk === `SESSION#${idSesionAlumno}`);
            if (index !== -1) {
                db[index].endTime = endTime;
                db[index].status = 'COMPLETED';
                writeLocalDb(db);
            }
            return;
        }
        await dynamoDb.update({
            TableName: TABLE_NAME,
            Key: {
                pk: `SESSION#${idSesionAlumno}`,
                sk: 'METADATA',
            },
            UpdateExpression: 'set endTime = :e, #status = :s',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':e': endTime,
                ':s': 'COMPLETED',
            },
        }).promise();
    },
};
