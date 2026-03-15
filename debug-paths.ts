import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("CWD:", process.cwd());
console.log("__dirname:", __dirname);

const distPathStatic = path.resolve(__dirname, "..", "dist", "public");
console.log("Resolved distPath (static.ts logic):", distPathStatic);
console.log("Exists:", fs.existsSync(distPathStatic));

const distPathAlternative = path.join(process.cwd(), "dist", "public");
console.log("Resolved distPath (CWD logic):", distPathAlternative);
console.log("Exists:", fs.existsSync(distPathAlternative));

if (fs.existsSync(distPathStatic)) {
    console.log("Contents of distPathStatic:", fs.readdirSync(distPathStatic));
}
