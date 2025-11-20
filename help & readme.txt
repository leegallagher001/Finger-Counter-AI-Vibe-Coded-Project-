To run this application locally on your computer, you cannot simply open the index.html file. Modern web applications like this one use TypeScript (.tsx files) and ES Modules, which browsers cannot execute directly from the file system (due to security restrictions and the need for compilation).
You need a "Build Tool" and a local server. The industry standard is Vite.
Here is a step-by-step guide to getting this running on your machine:
1. Install Node.js
Ensure you have Node.js installed (Version 18 or higher). Download it from nodejs.org.
2. Create a New Project
Open your terminal (Command Prompt, PowerShell, or Terminal) and run the following commands to create a scaffold:
code
Bash
npm create vite@latest finger-counter -- --template react-ts
cd finger-counter
npm install
3. Install Dependencies
Install the specific libraries used in this app:
code
Bash
npm install lucide-react @google/genai @mediapipe/tasks-vision
(Note: Tailwind CSS is currently loaded via a CDN script in your index.html, so you don't strictly need to install it via npm for this to work, though it is recommended for production).
4. Move Your Files
You need to copy the code from the files provided here into the new finger-counter folder structure created by Vite.
index.html: Replace the content of the index.html in the root folder with the one provided.
Crucial Change locally: Change <script type="module" src="/index.tsx"></script> to <script type="module" src="/src/main.tsx"></script> (Vite usually names the entry point main.tsx).
src/App.tsx: Copy the content of App.tsx here.
src/types.ts: Create this file in src/ and paste the content.
src/services/: Create a folder named services inside src.
Create geminiService.ts inside it.
Create mediaPipeService.ts inside it.
Create soundService.ts inside it.
src/components/: Create a folder named components inside src.
Create WebcamView.tsx inside it.
Create ResultsPanel.tsx inside it.
src/main.tsx: (Or index.tsx if you renamed it). Ensure it looks like the index.tsx provided, but typically Vite generates a main.tsx that imports App.tsx.
5. Configure the API Key (Important)
The code uses process.env.API_KEY. In a local Vite environment, process.env does not exist in the browser. You have two options:
Option A (Quickest):
Open src/services/geminiService.ts and replace process.env.API_KEY with your actual API key string:
code
TypeScript
const ai = new GoogleGenAI({ apiKey: "YOUR_ACTUAL_GEMINI_API_KEY" });
Option B (Professional):
Create a file named .env in the root of your project.
Add this line: VITE_API_KEY=your_actual_key_here
In src/services/geminiService.ts, change process.env.API_KEY to import.meta.env.VITE_API_KEY.
6. Run the App
Back in your terminal, run:
code
Bash
npm run dev
It will provide a local URL (usually http://localhost:5173). Open that in your browser, and the app will work!