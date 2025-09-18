const baseUrl = 'http://localhost:3000'; // Replace with your actual base URL
const res = await fetch(`${baseUrl}/api/issues/3`);
console.log(res);
