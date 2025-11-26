const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.error('API Key not found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
    try {
        console.log('Testing gemini-2.5-flash with @google/generative-ai...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = 'Explain how AI works in a few words';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Response text:', text);
        console.log('Full response object:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testGemini();
