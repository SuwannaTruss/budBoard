const fetch = require('node-fetch')
const prompt = require('prompt-sync')();

async function run() {
    // get userinput - postcode    
    const postcode = prompt('Please input postcode');

    try {
        // get lat/lon from postcode API
        const geoLocation = await fetch(`https://api.postcodes.io/postcodes/${postcode}`)
            .then(response => response.json())
            //  .then(body => console.log(body))
            .catch(err => console.log(err));

        const lat = geoLocation.result.latitude;
        const lon = geoLocation.result.longitude;

        // get nearest busStops in radius 500m from Tfl API
        const nearestBusStops = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=100`)
            .then(response => response.json())
            // .then(body => console.log(body))
            .catch(err => console.log(err));
        
            console.log(nearestBusStops.stopPoints)

        if (nearestBusStops.stopPoints.length >= 2) {
            for (let i = 0; i < 2; i++) {
                const naptanId = nearestBusStops.stopPoints[i].naptanId;
                console.log('Bus stop name: ' + nearestBusStops.stopPoints[i].commonName + ' , ' + nearestBusStops.stopPoints[i].indicator)

                // get next arrival bus from 
                const nextArrivalBusStop = await fetch(`https://api.tfl.gov.uk/StopPoint/${naptanId}/Arrivals`)
                    .then(response => response.json())
                    //  .then(body => console.log(body))
                    .catch(err => console.log(err));
                // console.log(output);
                //console.log(nextArrivalBusStop)

                if (nextArrivalBusStop) {
                    const sortedByArrivalTimeStopPoint = nextArrivalBusStop.sort(function (busA, busB) {
                        return busA.timeToStation - busB.timeToStation
                    });

                    for (let i = 0; i < 5; i++) {
                        if (sortedByArrivalTimeStopPoint[i]) {
                            console.log('Bus: ' + (i + 1));
                            console.log('route:' + sortedByArrivalTimeStopPoint[i].lineName);
                            console.log('destination: ' + sortedByArrivalTimeStopPoint[i].destinationName);
                            console.log('in ' + Math.ceil(sortedByArrivalTimeStopPoint[i].timeToStation / 60) + ' mins\n');
                        } 

                    }
                } else {
                    console.log('There are no buses coming at this stop.')
                }
            }
        } else {
            console.log('There are no nearby bus stops.')
        }

    } catch (error) {
        console.log('Invalid London postcode, please try again.');
        const rerun = prompt('Type 1 to try again ');
         if (rerun === "1") {
             run();
         }
    }
}
run()