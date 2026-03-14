# Arivu: Educational Video Filtering Extension

**Arivu** is a browser extension prototype designed to streamline the student learning experience by filtering YouTube search results through the power of Artificial Intelligence.

## 🚀 Features
* **AI-Powered Analysis**: Utilizes the Google Gemini 1.5 Flash model to provide grounded summaries of video content.
* **Intelligent Filtering**: Refines search results based on specific educational subjects, grades, and keywords.
* **Clean Interface**: A minimalist UI developed to ensure a distraction-free environment for students.

## 🛠️ Security Setup
Before running the extension, you must set up your local configuration file. This file is excluded from GitHub via `.gitignore` to keep your API keys private.

1. Create a file named `config.js` in the root directory.
2. Add your YouTube and Gemini API keys:
   ```javascript
   const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY_HERE";
   const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
   📦 Installation & Browser Setup
Since this is a developer prototype, you must load it as an "unpacked" extension:

1. Download the Project
Clone the repository: git clone https://github.com/MatamAkshith/Arivu-prototype-4.git

Or download and extract the ZIP file to your local machine.

2. Enable Developer Mode
Open Google Chrome (or any Chromium browser like Edge/Brave).

Navigate to chrome://extensions/ in the address bar.

In the top-right corner, toggle Developer mode to ON.

3. Load the Extension
Click the Load unpacked button in the top-left.

Select the Arivu-prototype-4 folder (the directory containing manifest.json).

The extension will now appear in your browser.

4. Start Searching
Click the Extensions (puzzle piece) icon in your toolbar.

Open Arivu and enter your subject or grade to find AI-filtered educational content.

📝 Project Information
Version: Prototype 4

Developed For: TEP (Technical Education Project)

Technologies: JavaScript (ES6+), HTML5, Tailwind CSS (libs), YouTube Data API v3, Google Gemini API
