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
async function run() {
     const stopPoint = prompt('Please input stopCode');


     const output = await fetch(`https://api.tfl.gov.uk/StopPoint/${stopPoint}/Arrivals`)
          .then(response => response.json())
          //  .then(body => console.log(body))
          .catch(err => console.log(err));
     // console.log(output);
     const sortedByArrivalTimeStopPoint = output.sort(function (busA, busB) {
          return busA.timeToStation - busB.timeToStation
     });

     for (let i = 0; i < 5; i++) {
          console.log('\nBus: ' + (i + 1));
          console.log('route:' + sortedByArrivalTimeStopPoint[i].lineName);
          console.log('destination: ' + sortedByArrivalTimeStopPoint[i].destinationName);
          console.log('in ' + Math.ceil(sortedByArrivalTimeStopPoint[i].timeToStation / 60) + ' mins');
          // console.log('in'+ Math.round(sortedByArrivalTimeStopPoint[i].timeToStation/60) + 'mins');
     }
}
run()










 //-----------------------------------
     //Oscar code
    //  function toJson(response) {
    //     return response.json()
    // }

    // async function run() {
    //     const input = prompt("What postcode would you like to search for?  ")

    //     const output = await fetch(`http://api.postcodes.io/postcodes/${input}`)
    //         .then(toJson)
    //         .catch(err => console.log(err))
    //         .finally(_ => console.log("Done"));

    //     console.log(output)
    // }

    // run()


