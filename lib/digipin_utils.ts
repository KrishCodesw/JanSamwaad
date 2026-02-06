import { encode, decode, Location } from "@pranamphd/digipin";
const location: Location = { latitude: 28.6139, longitude: 77.209 }; // Example coordinates for Kartavya Path, New Delhi

const digipin = encode(location); // Encode coordinates to DIGIPIN
console.log(digipin); // Example output: "39J438TJC7"

const decodedLocation = decode(digipin); // Decode DIGIPIN back to coordinates
console.log(decodedLocation); // Example output: { latitude: 28.6139, longitude: 77.209 }