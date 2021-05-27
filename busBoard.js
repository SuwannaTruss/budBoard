const fetch = require('node-fetch')
const prompt = require('prompt-sync')();

//get user input from console
// fetch(`https://api.tfl.gov.uk/StopPoint/${x}/Arrivals`)

// this one, cannot use outside loop
// const readline = require('readline').createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });
   
//   readline.question('Which bus stop?', stopPoint => {
//     return `${stopPoint}`);
//     readline.close();
//   });

const stopPoint = prompt('Please input stopCode');

 

fetch(`https://api.tfl.gov.uk/StopPoint/${stopPoint}/Arrivals`)
     .then(response => response.json())
     .then(body => console.log(body));


