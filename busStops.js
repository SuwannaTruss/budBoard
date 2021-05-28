const fetch = require('node-fetch')
const prompt = require('prompt-sync')();

async function run() {
    // get userinput - postcode    
    const postcode = prompt('Please input postcode');

    // get lat/lon from postcode API
    const geoLocation = await fetch(`https://api.postcodes.io/postcodes/${postcode}`)
        .then(response => response.json())
        //  .then(body => console.log(body))
        .catch(err => console.log(err));

    const lat = geoLocation.result.latitude;
    const lon = geoLocation.result.longitude;

    // get nearest busStops in radius 500m from Tfl API
    const nearestBusStops = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=500`)
        .then(response => response.json())
        // .then(body => console.log(body))
        .catch(err => console.log(err));
        https://api.tfl.gov.uk/StopPoint/?lat=51.5843&lon=-0.145149&stopTypes=NaptanPublicBusCoachTram&radius=500
        //
  

    for (let i = 0; i < 2; i++) {
        const naptanId = nearestBusStops.stopPoints[i].naptanId;
        // const naptanId = '490008660N'  
        console.log('Bus stop name: '+nearestBusStops.stopPoints[i].commonName+ ' , '+nearestBusStops.stopPoints[i].indicator)

        // get next arrival bus from 
        const nextArrivalBusStop1 = await fetch(`https://api.tfl.gov.uk/StopPoint/${naptanId}/Arrivals`)
            .then(response => response.json())
            //  .then(body => console.log(body))
            .catch(err => console.log(err));
        // console.log(output);
        //console.log(nextArrivalBusStop1)
        const sortedByArrivalTimeStopPoint = nextArrivalBusStop1.sort(function (busA, busB) {
            return busA.timeToStation - busB.timeToStation
        });

        for (let i = 0; i < 5; i++) {
            console.log('\nBus: ' + (i + 1));
            console.log('route:' + sortedByArrivalTimeStopPoint[i].lineName);
            console.log('destination: ' + sortedByArrivalTimeStopPoint[i].destinationName);
            console.log('in ' + Math.ceil(sortedByArrivalTimeStopPoint[i].timeToStation / 60) + ' mins');
        }

    }
}
run()