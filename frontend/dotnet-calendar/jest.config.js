// Jest configuration file
module.exports = {
  // Use modern settings for newer React versions
  testEnvironment: 'jsdom',
  
  // Transform files
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  
  // Configure transformIgnorePatterns to not ignore axios
  // This is necessary because axios uses ES modules syntax
  transformIgnorePatterns: [
    "/node_modules/(?!axios).+\\.js$"
  ],
  
  // Set up test coverage settings
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.js",
    "!src/reportWebVitals.js",
    "!src/setupTests.js"
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    "<rootDir>/src/setupTests.js"
  ],
  
  // Mock file formats that Jest doesn't understand
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js"
  }
};
