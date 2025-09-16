# Tutedude - **Focus & Object Detection in Video Interviews**

## Project Summary
Tutedude is a powerful application designed to enhance video interviews by integrating focus and object detection functionalities. It addresses the challenge of maintaining candidate engagement and attention during interviews, providing real-time feedback on their focus levels and detected objects. This tool is especially useful for interviewers seeking to gain insights into candidate behavior and attention patterns.

## Key Features
- **Focus Detection**: Monitors the candidate's gaze and attention during video interviews.
- **Object Detection**: Identifies and logs various objects present in the interview environment to assess distractions.
- **Real-time Feedback**: Provides immediate insights and reports based on detected focus and objects during the interview.
- **User-friendly Interface**: Built with React and Vite, ensuring a smooth and engaging user experience.
- **RESTful API**: A robust backend using Express.js to handle data requests and responses efficiently.
- **Socket.IO Integration**: Enables real-time communication between the client and server for instant updates.
- **Custom Scoring System**: Evaluates candidate performance based on focus and distraction metrics.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Mediapipe, TensorFlow, Axios, Framer Motion, socket.io - clint & jsPdf
- **Backend**: Node.js, Express, mongoose, cors & socket.io
- **Database**: MongoDB
- **Deployment**: render

## Getting Started
### Prerequisites
- Node.js (version 14 or higher)
- MongoDB (URL: `<your-mongodb-connection-string>`)

### Installation Commands
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Tutedude
   ```
2. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables
- Create a `.env` file in the backend directory with the following content:
  ```plaintext
  MONGODB_URL=<your-mongodb-connection-string>
  PORT=3002
  ```

### Starting Frontend and Backend
- In terminal write this common to start the server and the frontend
  ```plaintext
  npm run dev
  ```

## Project Structure
```
Tutedude/
├── backend/
│   ├── controllers/
│   │   ├── fetchReportController.js // Controller to fetch candidate reports
│   │   ├── durationMeeting.js // Utility for calculating meeting duration
│   │   └── scoreCal.js // Scoring logic based on candidate behavior
│   ├── routes/
│   │   └── reportsRoutes.js // Routes for fetching reports
│   ├── server.js // Main server file to initialize Express and Socket.io
│   └── package.json // Backend dependencies and scripts
└── frontend/
    ├── src/
    │   ├── App.jsx // Main application component with routing
    │   └── pages/ // Contains all page components
    ├── vite.config.js // Configuration for Vite
    └── package.json // Frontend dependencies and scripts
```

## Contributing
We welcome contributions to Tutedude! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## Contact
For any inquiries or feedback, please reach out to [thakralgarvit1@gmail.com].

## Thank You
Thank you for checking out Tutedude! We hope you find it useful and enjoy using it. Your feedback and contributions are highly appreciated!

Created with ❤️ by ThakralGarvit (for SDE Assignment): [GitHub Repository](https://github.com/garvitthakral)