const email = "arq-ti@umine.com";
const role = "ARQUITECTO";
const client_key = "UMINE";
const core_key = "smart-customers";
const secret = "lotus";

const data = { email, role, client_key, core_key };
const jsonStr = JSON.stringify(data);

let encrypted = "";
for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
    encrypted += String.fromCharCode(charCode);
}

const token = Buffer.from(encrypted, 'binary').toString('base64');
console.log("-----------------------------------------");
console.log("GENERATED SECURE TOKEN (v2 with core_key)");
console.log("-----------------------------------------");
console.log(`Email: ${email}`);
console.log(`Role: ${role}`);
console.log(`Client Key: ${client_key}`);
console.log(`Core Key: ${core_key}`);
console.log("-----------------------------------------");
console.log(`Token: ${token}`);
console.log("-----------------------------------------");
console.log(`URL Example: http://localhost:5173/?token=${token}`);
console.log("-----------------------------------------");
