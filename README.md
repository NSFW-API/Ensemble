# Ensemble - A Collaborative GUI for Oxen Repositories

Ensemble is a simple web-based interface that lets you view and collaborate on [Oxen](https://oxen.ai/) repositories.  
You can see a file list, preview certain file types, view rendered README content, and optionally download entire repos or individual files.

This project was initially built for the NSFW API community to collaborate on adult datasets, but it is open and welcoming to any project or repository.

## Features

- A React-based web interface for listing repositories and viewing contents.
- Optional in-browser previews (for text, Markdown, etc.).
- Download individual files or an entire repository as a ZIP.
- Displays README.md at the bottom of the page when viewing the repo root.

## Prerequisites

1. Python 3.7+
2. [Node.js](https://nodejs.org/) (preferably latest LTS)
3. [Oxen](https://oxen.ai/) (the Python API is installed via `pip`)

## Getting Started

1. **Clone or download this repository.**

2. **Server Setup (Python/Flask):**  
   • Navigate to the `server` folder.  
   • (Optional) Create and activate a virtual environment:
     ```
     python3 -m venv venv
     source venv/bin/activate  # (Linux/macOS)
     # or on Windows
     venv\Scripts\activate
     ```
   • Install required Python packages:
     ```
     pip install -r requirements.txt
     ```
   • Run the Flask server:
     ```
     python app.py
     ```
   By default, it will run on http://127.0.0.1:5000

3. **Client Setup (React):**  
   • Open a new terminal window and navigate to the `client` folder.  
   • Install the npm modules:
     ```
     npm install
     ```
   • Start the React development server:
     ```
     npm start
     ```
   By default, React runs on http://127.0.0.1:3000

## Usage

1. **Open the App**  
   • Visit http://127.0.0.1:3000/ in your web browser.

2. **Log In**  
   • On the main page, paste your Oxen API key into the text field.  
   • Click "Log In."  
   • Your API key is only stored in your local session (in-memory) as long as the server runs.

3. **Browse Your Repos**  
   • After logging in, you’ll be redirected to a simple “My Oxen Repositories” page.  
   • By default, it may show a small list of example repos you have (or just placeholders).

4. **Open a Repository**  
   • Click on any listed repository, or manually enter one in the “namespace/repo” format (e.g., `ox/CatDogBBox`).  
   • The app will load the file listing for the main branch by default.

5. **View Files & Readme**  
   • The file listing shows directories and files.  
   • Click on a directory name to navigate into it.  
   • If a README.md is found at the top-level directory, it’s rendered at the bottom of the page.

6. **Inline Previews & Downloading**  
   • For some file types (like text or Markdown), you can click “Preview” to see them inline.  
   • You can download individual files by clicking “Download.”  
   • Or download the entire repository as a ZIP with the “Download Entire Repo” button.

## Notes

• Ensemble’s Flask server proxies your Oxen API requests locally. Your API key is only stored in an in-memory variable (for this MVP).  
• This project is a simple starting point. Feel free to contribute or customize!

## Contributing

We welcome pull requests and suggestions. If you find any bugs or have feature requests, please open an issue or PR.

## License

This project is licensed under the MIT License.