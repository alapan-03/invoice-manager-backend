
const express = require("express");
const multer = require("multer");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
require("dotenv").config();
const cors = require("cors");

const xlsx = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// const corsOptions = {
//   // origin: "https://invoice-manager-frontend.onrender.com",
//   origin: "http://localhost:3001",
//   optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


// Configure Multer for file uploads
const upload = multer({
  dest: "./uploads", // Directory to temporarily store uploaded files
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Function to process files with Google Generative AI
async function processFile(filePath, mimeType, displayName, extractionPrompt) {
  try {
    // Initialize Google Generative AI and File Manager
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const fileManager = new GoogleAIFileManager(process.env.API_KEY);

    // Upload the file
    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType: mimeType,
      displayName: displayName,
    });
    const fileUri = uploadResponse.file.uri;

    console.log(`Uploaded file "${displayName}" as: ${fileUri}`);

    // Select the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate structured content
    const result = await model.generateContent([
      { text: extractionPrompt }, // Text prompt as a separate part
      {
        fileData: {
          mimeType: mimeType,
          fileUri: fileUri,
        },
      },
    ]);

    // Return the extracted data as plain text
    return result.response.text();
  } catch (error) {
    console.error("Error processing file:", error.message);
    throw error;
  }
}




// Endpoint to upload and process files
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

// Save to a CSV file or send as plain text
if (!file) {
  return res.status(400).json({ error: "No file uploaded." });
}

// Determine file MIME type and prompt
let mimeType = file.mimetype;
let filePath = file.path;
let displayName = file.originalname;
// let extractionPrompt;
let csvData;

if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const csvData = xlsx.utils.sheet_to_csv(sheet);
  const csvFilePath = filePath.replace(".xlsx", ".csv");
  fs.writeFileSync(csvFilePath, csvData);

  // Update file path and MIME type to CSV
  filePath = csvFilePath;
  mimeType = "text/csv";
  displayName = displayName.replace(".xlsx", ".csv");
}

// Determine the extraction prompt based on MIME type
let extractionPrompt;
if (mimeType === "text/csv") {

  extractionPrompt =
  "Extract and arrange the data into consistent JSON formats as follows: Invoices JSON (case-sensitive, do not write Invoice in lowercase): Create an array of invoices under the Invoices key, with each containing SerialNumber, CustomerName, ProductName, Quantity, Tax, TotalAmount, Date, and additional fields like Subtotal, BillingAddress, PhoneNumber, PaymentInformation (nested: Bank, AccountName, AccountNumber), and DueDate. For multiple invoices or serial numbers, use arrays, and in every product array named `ProductDetails` , there should be a unique no named `productSerialNo`,. for each product also ensuring each invoice has a unique SerialNumber. Customers JSON (case-sensitive, do not write Invoice in lowercase): Create an array under the Customers key, with each customer containing CustomerName, PhoneNumber, Address, and TotalPurchaseAmount, with optional fields for comprehensive profiling. Products JSON (case-sensitive, do not write Invoice in lowercase): Create an array named `ProductDetails` adn generate unique serial nos. of each product under the Products key, with each product containing Name, Quantity, UnitPrice, Tax, PriceWithTax, and Discount and a unique serial no.. Nest product details under the respective Invoices JSON where applicable. General Guidelines: Maintain a consistent JSON structure with camelCase keys (e.g., PhoneNumber). Group related data logically (e.g., payment details under PaymentInformation). Handle multiple invoices or serial numbers using arrays, ensuring uniformity across all categories. Note: Do not generate extra text; provide only the JSON.You dont have to do any calculations, just generate as it is";
} 


    // if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
     else if (mimeType === "application/pdf") {
      extractionPrompt =
        "(all the key name mentioned in the prompt will be same... and maintain one format of json, dont change it on each generation Invoice json(case sensitive, dont write Invoice in small letters): Extract and arrange into appropriate json data: Invoices  (Serial Number, Customer Name, product name, qty,tax, Total Amount and Date Unit Price, Tax, Price with Tax (all required), SerialNumber ( of the invoice number if present in case of multiple invoices).. (All required columns) -with extra information)...if there are multiple serial numbers or multiple invoices , make an array of serial numbers or invoices with its corresponding information in each array in the invoices json, it should not contain any duplicate keys, For multiple invoices or serial numbers, use arrays, and in every product array named `ProductDetails` , there should be a unique no named `productSerialNo`,. for each product also ensuring each invoice has a unique SerialNumber. Customers json(case sensitive, dont write Invoice in small letters):(Customer Name,Phone Number,address  and Total Purchase Amount. Additional fields can be added at your discretion for more comprehensive customer data.. (All required columns) - with extra information ). Products json(case sensitive, dont write Invoice in small letters): Name, Quantity, Unit Price, Tax, Price with Tax (all required), SerialNumber ( of the invoice number if present in case of multiple invoices). The Discount is needed as well...nested product details in invoice will be the lats key...  (Subtotal: 500,Tax,Total Amount,Billing Address, Phone Number, Payment Information Bank,Account Name,Account Number,DueDate put these kind of data at first), keys should be without spaces (eg, PhoneNumber, first letter should be capital and first letter of the next wor written without space will be capitaland dont change the name in every response keep it constant";
    } else if (mimeType.startsWith("image/")) {
      extractionPrompt =
        "(all the key name mentioned in the prompt will be same... and maintain one format of json, dont change it on each generation Invoice json(case sensitive, dont write Invoice in small letters): Extract and arrange into appropriate json data: Invoices  (Serial Number, Customer Name, product name, qty,tax, Total Amount and Date. (All required columns) -with extra information)...if there are multiple serial numbers or multiple invoices , make an array of invoices in the invoices json, Customers json(case sensitive, dont write Invoice in small letters):(Customer Name,Phone Number, address and Total Purchase Amount. Additional fields can be added at your discretion for more comprehensive customer data.. (All required columns) - with extra information ). Products json(case sensitive, dont write Invoice in small letters): Name, Quantity, Unit Price, Tax, Price with Tax (all required). The Discount is needed as well...nested product details in invoice will be the lats key  (Subtotal: 500,Tax,Total Amount,Billing Address, Phone Number, Payment Information Bank,Account Name,Account Number,DueDate put these kind of data at first).... keys should be without spaces , (eg, PhoneNumber, first letter should be capital and first letter of the next wor written without space will be capital and dont change the name in every response keep it constant";
    } else {
      return res
        .status(400)
        .json({ error: "Unsupported file type. Please upload Excel, PDF, or image files." });
    }

    console.log("Hello")

    // Process the file
    const extractedData = await processFile(filePath, mimeType, displayName, extractionPrompt);
    console.log("Hello")
    // Parse the extracted data into JSON
    // const jsonData = parseResponseToJson(extractedData);
    console.log("Hello")

    // Extract `Products` from the data field

    // console.log(extractedData.data)
// const products = extractSection(extractedData.data, "Products");
// console.log("Extracted Products:", products);
    // Return the parsed JSON data
    res.status(200).json({
      message: "File processed successfully.",
      data: extractedData
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process file.", details: error.message });
  }
});




// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
