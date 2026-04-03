
import * as fs from 'fs';
import * as path from 'path';

// Define the Session interface based on what we save
interface SessionRecord {
    pk: string;
    sk: string;
    rutOtec: string;
    codSence: string;
    runAlumno: string;
    startTime: string;
    endTime?: string;
    status: string;
}

const DB_FILE = path.join(process.cwd(), '.local_db.json');
const REPORT_FILE = path.join(process.cwd(), 'attendance_report.csv');

const generateReport = () => {
    if (!fs.existsSync(DB_FILE)) {
        console.error('No local database found. Run some tests first!');
        return;
    }

    const sessions: SessionRecord[] = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    console.log(`Found ${sessions.length} total sessions.`);

    // Aggregate by Student + Course
    const attendanceMap = new Map<string, number>();

    sessions.forEach(session => {
        // key = StudentID|CourseCode
        const key = `${session.runAlumno}|${session.codSence}`;
        const currentCount = attendanceMap.get(key) || 0;
        attendanceMap.set(key, currentCount + 1);
    });

    // Generate CSV
    const header = 'Run Alumno,Codigo Sence,Total Sesiones,Asistencia (>1) [1=Yes 0=No]\n';
    let csvContent = header;

    attendanceMap.forEach((count, key) => {
        const [student, course] = key.split('|');
        const isVerified = count > 1 ? 1 : 0;
        csvContent += `${student},${course},${count},${isVerified}\n`;
    });

    fs.writeFileSync(REPORT_FILE, csvContent);
    console.log(`Report generated successfully: ${REPORT_FILE}`);
    console.log('---------------------------------------------------');
    console.log(csvContent);
    console.log('---------------------------------------------------');
};

generateReport();
