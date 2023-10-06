const fs = require('fs');
const path = require('path');

// Configuration object

// Define source and output paths
const sourcePath = 'source';
const outputPath = 'output'

// Define anomyzing rules
// Replacments support string and numeric replacement option
// Replacements support to configure rando string suffix
// Replacements support nested value replacements
const config = [
    {
        fileName: 'test2.json',
        replacements: [
            { propertyName: 'testProperty1', replacementType: 'string', prefix: 'Test Prefix 1 ', suffix: true },
            { propertyName: 'testProperty2', replacementType: 'string', prefix: 'Test Prefix 2 ' },
        ]
    },
    {
        fileName: 'test2.json',
        replacements: [
            { propertyName: 'total', replacementType: 'numeric', min: 1, max: 1000000 },
            {
                propertyName: 'billingData', nested: true, nestedConfig: [
                    { propertyName: 'unitPrice', replacementType: 'numeric', min: 1, max: 10000 },
                    { propertyName: 'lineQty', replacementType: 'numeric', min: 1, max: 100 },
                ]
            },
        ]
    }
];

// Function to recursively process JSON data with replacements
function processJSON(data, replacements) {
    if (typeof data === 'object') {
        if (Array.isArray(data)) {
            // If data is an array, iterate through each element
            for (let i = 0; i < data.length; i++) {
                data[i] = processJSON(data[i], replacements); // Recurse into array elements
            }
        } else {
            // Iterate through object properties
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const replacement = replacements.find((item) => item.propertyName === key);
                    if (replacement) {
                        if (replacement.nested) {
                            // Handle nested properties
                            data[key] = processJSON(data[key], replacement.nestedConfig);
                        } else {
                            // Handle non-nested properties
                            if (typeof data[key] === 'object') {
                                // Recurse into nested objects
                                data[key] = processJSON(data[key], replacements);
                            } else {
                                // Replace the property value
                                if (replacement.replacementType === 'string') {
                                    // Replace the property value with a string prefix
                                    let newValue = replacement.prefix || '';
                                    if (replacement.suffix) {
                                        // Add the suffix if specified
                                        newValue += `${generateString()}`;
                                    }
                                    data[key] = newValue;
                                } else if (replacement.replacementType === 'numeric') {
                                    // Replace the property value with a random number within the specified range
                                    data[key] = generateRandomNumber(replacement.min || 0, replacement.max || 100);
                                }
                            }
                        }
                    } else {
                        // Handle non-replacement properties
                        if (typeof data[key] === 'object') {
                            // Recurse into nested objects
                            data[key] = processJSON(data[key], replacements);
                        }
                    }
                }
            }
        }
    }
    return data;
}

// Function to generate a random string
function generateString() {
    return Math.random().toString(36).substring(7);
}

// Function to generate a random number within a range
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to determine if a file should be copied
function shouldCopyFile(fileName, config) {
    return !config.some((item) => item.fileName === fileName);
}

// Function to update a JSON file based on config or copy if not in config
function processFile(filePath, config) {
    try {
        const fileName = path.basename(filePath);
        if (shouldCopyFile(fileName, config)) {
            // If the file is not in the config, copy it to the "masked" folder
            const outputFilePath = path.join(outputPath, fileName);
            fs.copyFileSync(filePath, outputFilePath);
            console.log(`Copied: ${outputFilePath}`);
        } else {
            // If the file is in the config, perform replacements and save
            let fileData = fs.readFileSync(filePath, 'utf8');
            fileData = JSON.parse(fileData);
            processJSON(fileData, config.find((item) => item.fileName === fileName).replacements);
            const outputFilePath = path.join('masked', fileName);
            fs.writeFileSync(outputFilePath, JSON.stringify(fileData, null, 2));
            console.log(`Updated and saved: ${outputFilePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}: ${error}`);
    }
}

// Get a list of all JSON files in the "original" folder
const sourceFiles = fs.readdirSync(sourcePath);

// Loop through all JSON files in the "original" folder
sourceFiles.forEach((fileName) => {
    const filePath = path.join(originalFolder, fileName);
    processFile(filePath, config);
});

