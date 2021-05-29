const fetch = require('node-fetch')
const prompt = require('prompt-sync')();
// logger 
const winston = require('winston');
const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    transports: [
      new winston.transports.File({
        filename: 'combined.log',
        level: 'info'
      })
    ]
  })

async function run() {
    // get userinput - postcode    
    const postcode = prompt('Please input postcode');
    const timeStamp = new Date()
    try {
        // get lat/lon from postcode API
        const geoLocation = await fetch(`https://api.postcodes.io/postcodes/${postcode}`)
            .then(response => response.json())
            .catch(err => console.log(err));

        const lat = geoLocation.result.latitude;
        const lon = geoLocation.result.longitude;

        // get nearest busStops in radius 500m from Tfl API
        const nearestBusStops = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=500`)
            .then(response => response.json())
            .catch(err => console.log(err));
        
        if (nearestBusStops.stopPoints.length >= 2) {
            for (let i = 0; i < 2; i++) {
                const naptanId = nearestBusStops.stopPoints[i].naptanId;
                console.log('Bus stop name: ' + nearestBusStops.stopPoints[i].commonName + ' , ' + nearestBusStops.stopPoints[i].indicator)

                // get next arrival bus from the 2 closest stops using NaptanId
                const nextArrivalBusStop = await fetch(`https://api.tfl.gov.uk/StopPoint/${naptanId}/Arrivals`)
                    .then(response => response.json())
                    .catch(err => console.log(err));

                // sorting buses by arrival time
                if (nextArrivalBusStop.length > 0) {
                    const sortedByArrivalTimeStopPoint = nextArrivalBusStop.sort(function (busA, busB) {
                        return busA.timeToStation - busB.timeToStation
                    });

                    // Display details of the next 5 buses to arrive
                    for (let i = 0; i < 5; i++) {
                        if (sortedByArrivalTimeStopPoint[i]) {
                            console.log('Bus: ' + (i + 1));
                            console.log('route:' + sortedByArrivalTimeStopPoint[i].lineName);
                            console.log('destination: ' + sortedByArrivalTimeStopPoint[i].destinationName);
                            console.log('in ' + Math.ceil(sortedByArrivalTimeStopPoint[i].timeToStation / 60) + ' mins\n');
                        } 

                    }
                // log to console and logger that there are no buses arriving at the stop
                } else {
                    console.log('There are no buses coming at this stop.')
                    logger.log('info', `no buses arriving at this stop - Naptan ID: ${naptanId} at ${timeStamp}`)
                }
            }
        // log to console and logger that there are no nearby bus stops to a valid postcode
        } else {
            console.log('There are no nearby bus stops.')
            logger.log('info', `Valid postcode, no nearby bus stops, user input: ${postcode}`)
        }
    // catch an error if the postcode entered is invalid & invite user to give correct postcode
    } catch (error) {
        console.log( 'Invalid London postcode, please try again.');
        logger.log('error',`Invalid London postcode, user input: ${postcode}`);
        const rerun = prompt('Type 1 to try again ');
         if (rerun === "1") {
             run();
         }
    }
}
run()