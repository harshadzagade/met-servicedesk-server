const fs = require('fs');
const path = require('path');

// Function to log a message to a text file
const logMessage = (message) => {
  // Create a timestamp for the log entry
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: ${message}\n`;

  // Define the file path where you want to store the logs
  const logFilePath = path.join(__dirname, 'logs.txt');

  // Append the log entry to the file
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    } else {
      console.log('Log entry added:', logEntry);
    }
  });
}

module.exports = logMessage;