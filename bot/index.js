require('dotenv').config();
const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const sdk = require('microsoft-cognitiveservices-speech-sdk');

// Load environment variables
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const visionApiKey = process.env.AZURE_COMPUTER_VISION_KEY;
const visionEndpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
const speechKey = process.env.AZURE_SPEECH_KEY;
const speechRegion = process.env.AZURE_SPEECH_REGION;

console.log("Loaded OpenAI API Key:", apiKey ? "[Loaded]" : "[Missing]");
console.log("Using deployment:", deploymentName);

// Setup readline to read user input from terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Create an async function to call the Azure OpenAI API
async function getBotResponse(messages) {
    try {
        const response = await axios.post(
            `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=2024-03-01-preview`,
            {
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            },
            {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error with OpenAI API:', error.response ? error.response.data : error.message);
        return "I'm having trouble understanding, please try again.";
    }
}

// Create an async function to analyze images using Azure Computer Vision API
async function analyzeImage(imagePath) {
    try {
        const imageStream = fs.createReadStream(imagePath);

        const response = await axios.post(
            `${visionEndpoint}/vision/v3.2/analyze?visualFeatures=Categories,Description,Tags`,
            imageStream,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': visionApiKey,
                    'Content-Type': 'application/octet-stream'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error with Computer Vision API:", error.response ? error.response.data : error.message);
        return null;
    }
}

// 🔥 Chat history to maintain conversation
const chatHistory = [];

const userMemory = {
    preferredBrand: null,
    budget: null
};


// 🎙️ Function: Recognize Speech
const mic = require('mic'); // Make sure you have this at the top!

// 🎙️ Function: Recognize Speech (Fixed for terminal)
function recognizeSpeech() {
    return new Promise((resolve, reject) => {
        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechRecognitionLanguage = "en-US";

        const pushStream = sdk.AudioInputStream.createPushStream();
        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        const microphone = mic({
            rate: '16000',
            channels: '1',
            bitwidth: '16',
            encoding: 'signed-integer',
            device: 'default'
        });

        const micInputStream = microphone.getAudioStream();

        micInputStream.on('data', function(data) {
            pushStream.write(data.slice());
        });

        micInputStream.on('error', function(err) {
            console.error('Microphone input error: ' + err);
            reject(err);
        });

        micInputStream.on('startComplete', function() {
            console.log('🎤 Microphone started, listening...');
        });

        microphone.start();

        recognizer.recognizeOnceAsync(result => {
            microphone.stop();
            pushStream.close();

            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                const text = result.text.trim();
                if (text) {
                    resolve(text);
                } else {
                    resolve(null);
                }
            } else {
                console.error('Speech not recognized.');
                resolve(null);
            }
        });
    });
}

// 🔊 Function: Speak Bot Response
function speakText(text) {
    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

    const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(text, result => {
        synthesizer.close();
    });
}

function updateMemoryFromText(text) {
    const lowerText = text.toLowerCase();

    const brands = ['nike', 'adidas', 'puma', 'reebok', 'asics', 'under armour', 'new balance'];
    for (const brand of brands) {
        if (lowerText.includes(brand)) {
            userMemory.preferredBrand = brand;
        }
    }

    const budgetMatch = lowerText.match(/(\d{2,5})\s*(dollars|\$)?/);
    if (budgetMatch) {
        const amount = parseInt(budgetMatch[1]);
        if (amount > 10 && amount < 5000) { 
            userMemory.budget = amount;
        }
    }
}

// ✨ Main chat function
function askQuestion() {
    rl.question('Type your message, "voice" to speak, or "image:<path>" to analyze an image:\nYou: ', async (userInput) => {
        const lowerInput = userInput.toLowerCase().trim();

        if (lowerInput === 'exit') {
            console.log('Exiting...');
            rl.close();
            process.exit(0);
        }

        if (lowerInput === 'memory') {
            console.log('📚 Memory Snapshot:');
            console.log(`Preferred Brand: ${userMemory.preferredBrand || 'Not set'}`);
            console.log(`Budget: ${userMemory.budget ? `$${userMemory.budget}` : 'Not set'}`);
            console.log(`Other Info: ${JSON.stringify(userMemory.otherInfo || {}, null, 2)}`);
            askQuestion();
            return;
        }        

        if (lowerInput === 'voice') {
            try {
                const recognizedText = await recognizeSpeech();
        
                if (!recognizedText || recognizedText.trim() === '') {
                    console.log('Bot: Sorry, I could not understand you.');
                    askQuestion();
                    return;
                }
        
                console.log(`Recognized: ${recognizedText}`);
                updateMemoryFromText(recognizedText);

                const cleanRecognized = recognizedText.trim().toLowerCase();
                if (cleanRecognized === 'exit' || cleanRecognized === 'exit.') {
                    console.log('Exiting...');
                    rl.close();
                    process.exit(0);
                }
        
                chatHistory.push({ role: "user", content: recognizedText });
                const botResponse = await getBotResponse(chatHistory);
                console.log('Bot:', botResponse);
                speakText(botResponse);
                chatHistory.push({ role: "assistant", content: botResponse });

            } catch (error) {
                console.error('Error recognizing speech:', error.message);
                console.log('Bot: Sorry, I could not understand you.');
            }

            askQuestion();
            return;
        }                

        if (lowerInput.startsWith('image:')) {
            const imagePath = userInput.substring(6).trim();

            try {
                const analysis = await analyzeImage(imagePath);

                if (!analysis) {
                    console.log('Bot: Sorry, I could not analyze the image. Please try another one.');
                    askQuestion();
                    return;
                }

                const description = analysis.description?.captions?.[0]?.text || 'an image';
                const tags = analysis.tags?.map(tag => tag.name) || [];

                console.log('Bot (Image Analysis):');
                console.log(`I see: ${description}`);
                console.log(`Tags: ${tags.join(', ')}`);

                let recommendation = "Based on the image, here are some product suggestions:\n";

                if (userMemory.preferredBrand) {
                    recommendation += `\n✨ Since you like ${userMemory.preferredBrand}, I'll prioritize that brand!`;
                }
                if (userMemory.budget) {
                    recommendation += `\n💰 Keeping your budget of $${userMemory.budget} in mind!`;
                }

                if (tags.includes('running shoe') || tags.includes('sneaker') || tags.includes('athletic shoe')) {
                    recommendation += "\n- Nike Air Zoom Pegasus 40\n- Adidas Ultraboost 24\n- ASICS Gel-Kayano 30";
                } else if (tags.includes('handbag')) {
                    recommendation += "\n- Michael Kors Jet Set Tote\n- Coach Gallery Tote\n- Kate Spade Margaux Bag";
                } else if (tags.includes('t-shirt') || tags.includes('shirt') || tags.includes('clothing')) {
                    recommendation += "\n- Uniqlo Supima Cotton T-Shirt\n- Zara Slim Fit Shirt\n- H&M Casual Cotton Shirt";
                } else if (tags.includes('watch') || tags.includes('wristwatch')) {
                    recommendation += "\n- Apple Watch Series 9\n- Rolex Submariner\n- Fossil Gen 6 Smartwatch";
                } else if (tags.includes('sunglasses') || tags.includes('glasses') || tags.includes('eyewear')) {
                    recommendation += "\n- Ray-Ban Wayfarer\n- Oakley Holbrook\n- Persol PO0714 Sunglasses";
                } else if (tags.includes('laptop') || tags.includes('electronics')) {
                    recommendation += "\n- Apple MacBook Air M3\n- Dell XPS 13\n- Microsoft Surface Laptop 6";
                } else {
                    recommendation += "\n- Explore our popular items in shoes, bags, clothes, and electronics!";
                }

                console.log('Bot:', recommendation);
                speakText(recommendation);

            } catch (error) {
                console.error('Error analyzing image:', error.message);
                console.log('Bot: Sorry, I could not analyze the image. Please try another one.');
            }

            askQuestion();
            return;
        }

        // Regular text chat
        updateMemoryFromText(userInput);
        chatHistory.push({ role: "user", content: userInput });

        const botResponse = await getBotResponse(chatHistory);
        console.log('Bot:', botResponse);
        speakText(botResponse);
        chatHistory.push({ role: "assistant", content: botResponse });

        askQuestion();
    });
}

// 🚀 Start the conversation
console.log("👟 Welcome to the Smart Shopping Assistant!");
console.log("You can:");
console.log("- Type a message to chat with the bot 💬");
console.log("- Say 'voice' to start talking 🎤");
console.log("- Upload an image by typing: image:<path> 🖼️");
console.log("- Type 'exit' anytime to leave ❌");
console.log("\nLet's get started!\n");

askQuestion();
