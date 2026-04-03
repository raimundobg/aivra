
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://localhost:4000/dev/sence/start-session';
const MOCKS_DIR = path.join(process.cwd(), 'tests', 'mocks');

const mocks = [
    'start-session.json', // Student A, Session 1
    'student-a-2.json',   // Student A, Session 2
    'student-a-3.json',   // Student A, Session 3
    'student-b.json'      // Student B, Session 1
];

const seedData = async () => {
    console.log(`🌱 Seeding data to ${API_URL}...`);

    for (const mockFile of mocks) {
        const filePath = path.join(MOCKS_DIR, mockFile);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Mock file not found: ${mockFile}`);
            continue;
        }

        const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        try {
            const response = await axios.post(API_URL, payload);
            console.log(`✅ [${mockFile}] Success:`, response.data.sessionId);
        } catch (error: any) {
            console.error(`❌ [${mockFile}] Failed:`, error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error('   -> Is the local server running? (npx serverless offline --httpPort 4000 --lambdaPort 4002)');
                process.exit(1);
            }
        }
    }
    console.log('✨ Seeding complete! Now run: npm run demo:report');
};

seedData();
