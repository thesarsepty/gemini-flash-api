const { GoogleGenerativeAI } = require("@google/generative-ai");

// requirements
const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// preparations
dotenv.config();
const app = express();
app.use(express.json());

// insitialize
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

// setting multer
const upload = multer({ dest: "uploads/" });

// endpoint for generate text with gemini API
app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    let result = await model.generateContent(prompt);
    let response = result.response;
    // console.log(response.text());
    res.status(200).json({ output: response.text() });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// define type for generate image enpoint
const imageGeneratePart = (filePath) => ({
  inlineData: {
    data: fs.readFileSync(filePath).toString("base64"),
    mimeType: "image/png",
  },
});

// enpoint for generate image
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const prompt = req.body.prompt || `descirbe the picture`;
  const image = imageGeneratePart(req.file.path);

  try {
    let result = await model.generateContent([prompt, image]);
    let response = result.response;

    res.status(200).json({ output: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// endpoint for generate docs
app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const prompt = req.body.prompt || `analyze this document`;
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const documentPart = {
      inlineData: {
        data: base64,
        mimeType,
      },
    };

    try {
      let result = await model.generateContent([prompt, documentPart]);
      let response = result.response;

      res.status(200).json({ output: response.text() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      fs.unlinkSync(req.file.path);
    }
  }
);

// endpoint for generate audio
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const prompt = req.body.prompt || `analyze this audio`;
  const mimeType = req.file.mimetype;

  const documentPart = {
    inlineData: {
      data: base64,
      mimeType,
    },
  };

  try {
    let result = await model.generateContent([prompt, documentPart]);
    let response = result.response;

    res.status(200).json({ output: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`this gemini api running on localhost ${PORT}`);
});
