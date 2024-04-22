const multer = require("multer");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase.json");

const fs = require("fs");
const archiver = require("archiver");
const path = require("path");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://final-project-ad786.appspot.com", // Specify your Firebase Storage bucket name here
  });
  console.log("connected to FIREBASE");
} catch (err) {
  console.log(err);
}

// Initialize Firebase Storage
const bucket = admin.storage().bucket();
// const uuid = require('uuid');

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const urlCache = {}; // Simple cache object

async function getCachedViewLink(imagePath) {
  const now = Date.now();
  if (urlCache[imagePath] && urlCache[imagePath].expires > now) {
    console.log("cache");
    return urlCache[imagePath].url;
  } else {
    try {
      const signedUrl = await getViewLink(imagePath);
      urlCache[imagePath] = {
        url: signedUrl,
        expires: now + 60 * 60 * 1000, // Cache expiry time (1 hour)
      };
      return signedUrl;
    } catch (error) {
      console.error("Error getting cached view link:", error);
      throw error;
    }
  }
}

async function getViewLink(imagePath) {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(imagePath);
    // Get a signed URL for the file with a maximum validity of 1 hour
    const signedUrl = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // Link expiration time (1 hour)
    });
    return signedUrl[0];
  } catch (error) {
    console.error("Error getting view link:", error);
    throw error;
  }
}

/////
async function downloadFile(imagePath, destination) {
  const file = bucket.file(imagePath);
  await file.download({ destination });
}
async function downloadAndZipFiles(submissions, zipName) {
  const tempDir = "./src/temp"; // Temporary directory to store downloaded files
  const outputDir = "./src/temp"; // Directory to store the zip file
  const zipFilePath = path.join(outputDir, zipName); // Path for the zip file

  // Create temporary and output directories if they don't exist
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const downloadPromises = submissions.map(async (submission) => {
    const tempSubDir = path.join(tempDir, submission.title+" submitted by "+submission.student.fullName);
    // Create a directory for each submission title
    if (!fs.existsSync(tempSubDir)) fs.mkdirSync(tempSubDir);
    
    const imgPath = path.join(tempSubDir, path.basename(submission.imagePath));
    const docPath = path.join(tempSubDir, path.basename(submission.documentPath));
    
    // Download image and document files
    await Promise.all([
      downloadFile(submission.imagePath, imgPath),
      downloadFile(submission.documentPath, docPath)
    ]);

    return tempSubDir;
  });

  // Wait for all files to be downloaded
  const downloadedDirs = await Promise.all(downloadPromises);

  // Create a zip file and add downloaded files to it
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Sets the compression level
  });

  archive.pipe(output);

  downloadedDirs.forEach((dir) => {
    const title = path.basename(dir);
    archive.directory(dir, title); // Add each directory to the zip file with its title
  });

  await archive.finalize();

  // Delete temporary directories after creating the zip file
  downloadedDirs.forEach((dir) => {
    fs.rmdirSync(dir, { recursive: true });
    // fs.rm(dir, { recursive: true })
  });

  return zipFilePath;
}
// Usage example
async function downloadAndGenerateLink(filePaths) {
  try {
    const zipName = "downloaded_files.zip";
    const zipFilePath = await downloadAndZipFiles(filePaths, zipName);
    // Return the download link for the zip file
    return `/${zipName}`;
  } catch (error) {
    console.error("Error downloading files:", error);
    throw error;
  }
}
module.exports = { upload, bucket, admin, getCachedViewLink ,downloadAndGenerateLink};
