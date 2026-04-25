# HerLock

An AI-powered evidence locker for women in unsafe environments, disguised as an ordinary calculator app. 

Built for a 5-hour hackathon.

## Features
- **Disguise Mode:** Looks and functions like a standard calculator.
- **Hidden Vault:** Accessed via a secret PIN (`2025=`).
- **Voice Capture:** Uses the Web Speech API to discreetly record audio.
- **AI Threat Classification:** Uses the Groq API (`llama3-8b-8192`) to parse the transcript, extract threat levels, and generate a redacted summary.
- **Secure Local Storage:** Evidence logs are stored in the browser's `localStorage`.
- **PDF Export:** Generates court-admissible PDF reports locally using `html2canvas` and `jsPDF`.

## Setup & Local Development

This is a completely static frontend application (HTML/CSS/JS). No build step or backend server is required.

1. Clone the repository.
2. Open `index.html` in any modern web browser (Chrome/Edge recommended for Web Speech API support).
   - *Note: Some browsers require the file to be served over `http://` rather than `file://` for microphone permissions. You can use a simple local server like `npx serve` or VS Code Live Server.*
3. Open the vault by typing `2025=` on the calculator.
4. Click the **Settings (gear icon)** in the top right to enter your **Groq API Key**.
5. Start recording!

## Deployment (GitHub Pages)

HerLock is designed to be easily hosted for free on GitHub Pages.

1. **Create a GitHub Repository:** Create a new public repository and push these files to the `main` branch.
2. **Enable GitHub Pages:**
   - Go to your repository's **Settings**.
   - Navigate to **Pages** on the left sidebar.
   - Under **Build and deployment**, set the **Source** to `Deploy from a branch`.
   - Select the `main` branch and `/ (root)` folder, then click **Save**.
3. **Access Your App:** After a minute or two, your site will be live at `https://<your-username>.github.io/<repo-name>`.

### Note on API Keys & Security
Because this is a static site hosted on GitHub Pages, **do not hardcode your Groq API key in the `app.js` file.** Hardcoding it will expose it to anyone who views the source code.

Instead, HerLock uses a built-in settings modal that saves the API key directly to the user's browser `localStorage`. For demo purposes, you can provide the API key to the judges to enter via the UI.

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Styling: Tailwind CSS (via Play CDN)
- Speech Recognition: Web Speech API (`webkitSpeechRecognition`)
- AI Inference: [Groq API](https://console.groq.com/)
- PDF Generation: `jsPDF` + `html2canvas`
- Icons: Font Awesome
