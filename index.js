// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const { GoogleAIFileManager } = require("@google/generative-ai/server");
// require("dotenv").config();
// const cors = require("cors")


// const app = express();
// const PORT = process.env.PORT || 3000;

// const corsOptions = {
//   origin: 'http://localhost:3001',
//   optionsSuccessStatus: 200,
// };

// app.use(cors(corsOptions));
// // Configure Multer for file uploads
// const upload = multer({
//   dest: "./uploads", // Directory to temporarily store uploaded files
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
// });

// // Function to process files with Google Generative AI
// async function processFile(filePath, mimeType, displayName, extractionPrompt) {
//   try {
//     // Initialize Google Generative AI and File Manager
//     const genAI = new GoogleGenerativeAI(process.env.API_KEY);
//     const fileManager = new GoogleAIFileManager(process.env.API_KEY);

//     // Upload the file
//     const uploadResponse = await fileManager.uploadFile(filePath, {
//       mimeType: mimeType,
//       displayName: displayName,
//     });
//     const fileUri = uploadResponse.file.uri;

//     console.log(`Uploaded file "${displayName}" as: ${fileUri}`);

//     // Select the generative model
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     // Generate structured content
//     const result = await model.generateContent([
//       { text: extractionPrompt }, // Text prompt as a separate part
//       {
//         fileData: {
//           mimeType: mimeType,
//           fileUri: fileUri,
//         },
//       },
//     ]);

//     // Return the extracted data
//     return result.response.text();
//   } catch (error) {
//     console.error("Error processing file:", error.message);
//     throw error;
//   }
// }


// // Endpoint to upload and process files
// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ error: "No file uploaded." });
//     }

//     // Determine file MIME type and prompt
//     const mimeType = file.mimetype;
//     const filePath = file.path;
//     const displayName = file.originalname;

//     let extractionPrompt;
//     if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
//       extractionPrompt =
//         "Invoice json(case sensitive, dont write Invoice in small letters): Extract and arrange into appropriate json data: Invoices (Serial Number, Customer Name, Product Name, Qty, Tax, Total Amount, Date), Products (Product Name, Qty, Tax), Customers (Customer Name, Total Amount)......Product json(case sensitive, dont write in small letters): Analyze this invoice file and arrange it into json data, in product, put product related information like(Name, Quantity, Unit Price,Tax, Price with Tax (all required). The Discount column, etc....Customer Json(case sensitive, dont write in small letters): Display json with the following required columns: Customer Name, Phone Number, and Total Purchase Amount. Additional fields can be added at your discretion for more comprehensive customer data.  dont generate any extra text, only the json data and tell me how to access the data like data.data then what"
//     } else if (mimeType === "application/pdf") {
//       extractionPrompt =
//          "Invoice json(case sensitive, dont write in small letters): Extract and arrange into appropriate json data: Invoices (Serial Number, Customer Name, Product Name, Qty, Tax, Total Amount, Date), Products (Product Name, Qty, Tax), Customers (Customer Name, Total Amount)......Product json(case sensitive, dont write in small letters): Analyze this invoice file and arrange it into json data, in product, put product related information like(Name, Quantity, Unit Price,Tax, Price with Tax (all required). The Discount column, etc....Customer Json(case sensitive, dont write in small letters): Display json with the following required columns: Customer Name, Phone Number, and Total Purchase Amount. Additional fields can be added at your discretion for more comprehensive customer data.  dont generate any extra text, only the json data and tell me how to access the data like data.data then what"
//     } else if (mimeType.startsWith("image/")) {
//       extractionPrompt =
//          "Invoice json(case sensitive, dont write in small letters): Extract and arrange into appropriate json data: Invoices (Serial Number, Customer Name, Product Name, Qty, Tax, Total Amount, Date), Products (Product Name, Qty, Tax), Customers (Customer Name, Total Amount)......Product json(case sensitive, dont write in small letters): Analyze this invoice file and arrange it into json data, in product, put product related information like(Name, Quantity, Unit Price,Tax, Price with Tax (all required). The Discount column, etc....Customer Json(case sensitive, dont write in small letters): Display json with the following required columns: Customer Name, Phone Number, and Total Purchase Amount. Additional fields can be added at your discretion for more comprehensive customer data.  dont generate any extra text, only the json data and tell me how to access the data like data.data then what"
//     } else {
//       return res
//         .status(400)
//         .json({ error: "Unsupported file type. Please upload Excel, PDF, or image files." });
//     }

//     // Process the file
//     const extractedData = await processFile(filePath, mimeType, displayName, extractionPrompt);

//     // Return the extracted data
//     res.status(200).json({ message: "File processed successfully.", data: extractedData });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to process file.", details: error.message });
//   }
//   // res.status(200).json({message: "hello"})
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });



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

const corsOptions = {
  origin: "http://localhost:3001",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

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

// Function to parse the raw response into JSON
function parseResponseToJson(responseText) {
  try {
    // Remove unnecessary characters like backticks (`) or stray newlines
    const cleanedResponse = responseText
      .trim() // Remove leading/trailing whitespace
      .replace(/`/g, "") // Remove backticks if they exist
      .replace(/'/g, '"') // Replace single quotes with double quotes (if keys/values use single quotes)
      .replace(/,\s*}/g, "}"); // Remove trailing commas inside objects

    // Parse the cleaned response into JSON
    const parsedData = JSON.parse(cleanedResponse);

    // Ensure the parsed data is valid JSON
    if (typeof parsedData === "object" && parsedData !== null) {
      return parsedData;
    } else {
      throw new Error("Parsed response is not a valid JSON object.");
    }
  } catch (error) {
    console.error("Error parsing response:", error.message);
    throw new Error("Failed to parse response into valid JSON.");
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
  "Extract and arrange the data into consistent JSON formats as follows: Invoices JSON (case-sensitive, do not write Invoice in lowercase): Create an array of invoices under the Invoices key, with each containing SerialNumber, CustomerName, ProductName, Quantity, Tax, TotalAmount, Date, and additional fields like Subtotal, BillingAddress, PhoneNumber, PaymentInformation (nested: Bank, AccountName, AccountNumber), and DueDate. For multiple invoices or serial numbers, use arrays, ensuring each invoice has a unique SerialNumber. Customers JSON (case-sensitive, do not write Invoice in lowercase): Create an array under the Customers key, with each customer containing CustomerName, PhoneNumber, Address, and TotalPurchaseAmount, with optional fields for comprehensive profiling. Products JSON (case-sensitive, do not write Invoice in lowercase): Create an array under the Products key, with each product containing Name, Quantity, UnitPrice, Tax, PriceWithTax, and Discount. Nest product details under the respective Invoices JSON where applicable. General Guidelines: Maintain a consistent JSON structure with camelCase keys (e.g., PhoneNumber). Group related data logically (e.g., payment details under PaymentInformation). Handle multiple invoices or serial numbers using arrays, ensuring uniformity across all categories. Note: Do not generate extra text; provide only the JSON.You dont have to do any calculations, just generate as it is";
} 


    // if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
     else if (mimeType === "application/pdf") {
      extractionPrompt =
        "(all the key name mentioned in the prompt will be same... and maintain one format of json, dont change it on each generation Invoice json(case sensitive, dont write Invoice in small letters): Extract and arrange into appropriate json data: Invoices  (Serial Number, Customer Name, product name, qty,tax, Total Amount and Date Unit Price, Tax, Price with Tax (all required), SerialNumber ( of the invoice number if present in case of multiple invoices).. (All required columns) -with extra information)...if there are multiple serial numbers or multiple invoices , make an array of serial numbers or invoices with its corresponding information in each array in the invoices json, it should not contain any duplicate keys, Customers json(case sensitive, dont write Invoice in small letters):(Customer Name,Phone Number,address  and Total Purchase Amount. Additional fields can be added at your discretion for more comprehensive customer data.. (All required columns) - with extra information ). Products json(case sensitive, dont write Invoice in small letters): Name, Quantity, Unit Price, Tax, Price with Tax (all required), SerialNumber ( of the invoice number if present in case of multiple invoices). The Discount is needed as well...nested product details in invoice will be the lats key...  (Subtotal: 500,Tax,Total Amount,Billing Address, Phone Number, Payment Information Bank,Account Name,Account Number,DueDate put these kind of data at first), keys should be without spaces (eg, PhoneNumber, first letter should be capital and first letter of the next wor written without space will be capitaland dont change the name in every response keep it constant";
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

function extractSection(dataString, sectionName) {
  const regex = new RegExp(`"${sectionName}"\\s*:\\s*(\\[.*?\\])`, 's'); // Match the section as JSON
  const match = dataString.match(regex);
  if (match && match[1]) {
      try {
          // Parse the matched string to JSON
          return JSON.parse(match[1]);
      } catch (err) {
          console.error(`Failed to parse section ${sectionName}:`, err);
          return null;
      }
  }
  return null; // Return null if the section is not found
}



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
