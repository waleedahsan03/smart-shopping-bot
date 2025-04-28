# Smart Shopping Assistant Bot

An intelligent shopping assistant that recommends products based on **text**, **voice**, and **image** inputs. Built using **Node.js** and **Azure AI Services** (OpenAI, Computer Vision, and Speech), deployed via Azure App Service.

---

## 🚀 Features

- **Text Query Support**: Type your product needs (e.g., "Suggest running shoes under $200").
- **Voice Interaction**: Speak commands to search for products (e.g., "Show me sunglasses").
- **Image-Based Search**: Upload a product image to find similar items.
- **Memory Handling**: Remembers user preferences like budget and favorite brands during conversation.
- **Multimodal AI Integration**: Seamlessly connects text, speech, and vision AI models.


## 🛠️ Technologies Used

- **Node.js** (Backend)
- **Express.js** (Web server)
- **Azure OpenAI Service** (GPT-4.1)
- **Azure Computer Vision API**
- **Azure Speech Service** (Speech-to-Text and Text-to-Speech)


## 🏗️ Architecture Overview

1. **Input Handling**: Accepts text, microphone input, or image upload.
2. **AI Processing**:
    - Voice: Azure Speech-to-Text ➔ Text input.
    - Image: Azure Computer Vision ➔ Extracts product tags.
    - Text: Sent directly to Azure OpenAI GPT-4.1.
3. **Response Generation**:
    - Personalized recommendations based on past interactions.
    - Responses can be both displayed and spoken back.


## ⚙️ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/smart-shopping-bot.git
cd smart-shopping-bot

# Install dependencies
npm install

# Set up environment variables
# Create a .env file based on .env.example and add your Azure keys

# Start the server
npm start
```

Then open your terminal or connect your frontend to interact with the bot!


## 🌐 Deployment

- Deployed on **Azure App Service**
- Environment variables securely configured via Azure App Settings
- Zip deployment using Kudu


## 📸 Sample Interactions

- Text: `"Find sneakers under $150"`
- Voice: Speak: `"Show me summer dresses"`
- Image: Upload an image of a product ➔ Bot suggests similar items.


## 📈 Future Enhancements

- Add a simple frontend (React.js or HTML)
- Integrate CosmosDB to persist user history
- Improve visual search with image embeddings


## ✨ Acknowledgments

- [Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure Computer Vision Documentation](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview)
- [Azure Speech Services Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
