const crypto = require("crypto");
const fs = require("fs");

const MODEL_INPUT_FILE = "character.glb";
const MODEL_OUTPUT_FILE = "character.enc";
const MODEL_PASSWORD = "Character3D#@";

const encryptFile = (inputFile, outputFile, password) => {
  const key = crypto.createHash("sha256").update(password).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);

  output.write(iv);
  input.pipe(cipher).pipe(output);
};

encryptFile(MODEL_INPUT_FILE, MODEL_OUTPUT_FILE, MODEL_PASSWORD);
