const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
async function run() {
    const models = await groq.models.list();
    console.log(models.data.map(m => m.id).join('\n'));
}
run();
