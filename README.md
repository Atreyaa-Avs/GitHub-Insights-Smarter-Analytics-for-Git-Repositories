# GitHub Insights – Smarter Analytics for Your Repositories

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

GitHub Insights provides powerful and real-time analytics for your GitHub repositories. Track stars, forks, issues, and activity trends to gain a deeper understanding of your projects. Whether you're a developer, team lead, or open-source contributor, GitHub Insights helps you make data-driven decisions to grow and optimize your codebase.

## Features

- Real-time repository analytics
- Star and fork tracking
- Issue and pull request insights
- Language usage statistics
- Activity trends over time
- Clean and responsive user interface
- Optimized for both personal and team projects
- AI-Powered Resume-to-Issue Skill Matching System

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- Git installed on your system
- A GitHub personal access token

### Clone the Repository

```bash
git clone https://github.com/Atreyaa-Avs/GitHub-Insights-Smarter-Analytics-for-Git-Repositories.git
cd GitHub-Insights-Smarter-Analytics-for-Git-Repositories
```

### Install Dependencies

```bash
npm install
cd client
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory with the following content:
(Refer to the `.env.example` file for creating API keys)

```env
GITHUB_ACCESS_TOKEN=your_github_access_token_here  // Get from your github profile developer settings
A4F_API_KEY=your_a4f_api_key_here  // Get this from a4f.co website
A4F_API_KEY2=your_a4f_api_key2_here
OPENROUTER_API_KEY=your_openrouter_api_key_here     // Get this from OpenRouter Website
DATABASE_URL=your_postgres_database_url_here        // You can put local postgres server or any serverless postgres db services (Ex: Neon,etc.)
GEMINI_API_KEY=your_gemini_api_key_here    // Get this from google gemini AI studio (ai.dev)
OCR_SPACE_API_KEY=your_ocr_space_api_key_here // Get this from ocr.space website this is for parsing the resume pdf.
```

> Replace `your_github_personal_access_token_here` with your actual GitHub token.  
> This is required to authenticate with the GitHub API and access extended rate limits or private repositories.

### Run the Development Server

#### Run the Frontend (Next.js)

```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Run Inngest server locally (dev server)

```bash
cd client
npx inngest-cli dev
```
Open [http://localhost:8288/runs](http://localhost:8288/runs) in your browser.
Inngest is for running, orchestrating and automating the whole data worklow of this project.

## Project Structure

```
GitHub-Insights-Smarter-Analytics-for-Git-Repositories/
├── client/              # Next.js frontend application
├── server/              # API and backend logic
├── README.md            # Project documentation
```

## Contributing

Contributions are always welcome! Whether it's improving the UI, fixing bugs, or adding new features:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to your fork
5. Open a pull request

Please make sure to follow the existing code style and include tests where applicable.

## License

This project is open-source and available under the MIT License.

---

## Contact

For questions, feature requests, or feedback, feel free to open an issue or reach out on GitHub.

---

Thanks for visiting this GitHub project! Would love your feedback if you have any.
