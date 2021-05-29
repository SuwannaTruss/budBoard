const fetch = require('node-fetch')
const prompt = require('prompt-sync')();
// logger 
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const LEVEL = Symbol.for('level');

// Log only the messages the match 'level'
function filterOnly(level) {
    return format(function (info) {
        if (info[LEVEL] === level) {
            return info;
        }
    })();
}
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
const logger = createLogger({
    transports: [
      new transports.File({
        level: 'error',
        format: combine(
            timestamp(),
            logFormat
        ),
        filename: 'logs/errors.log',  
      }),
      new transports.File({
        level: 'info',
        format: filterOnly('info'),
        filename: 'logs/validPostcodeInput.log', 
      })
    ]
  })

async function run() {
    // get userinput - postcode    
    const postcode = prompt('Please input postcode: ');
    const timeStamp = new Date();

    try {
        // get lat/lon from postcode API
        const geoLocation = await fetch(`https://api.postcodes.io/postcodes/${postcode}`)
            .then(response => response.json())
            .catch(err => console.log(err));

        if (!geoLocation.length) {
            logger.log('info', {postcode: `${geoLocation.result.postcode}`, region: `${geoLocation.result.region}`, timestamp: `${timeStamp}`});
        }   
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
                    logger.log('error', `no buses arriving at this stop - Naptan ID: ${naptanId}`)
                }
            }
        // log to console and logger that there are no nearby bus stops to a valid postcode
        } else {
            if (geoLocation.result.region !== "London") {
                console.log(`TFL does not have a service in your area.`);
                logger.log('error',`Postcode is not in the London area, user input: ${postcode}`);
            } else {
                console.log('There are no nearby bus stops.')
                logger.log('error', `Valid postcode, no nearby bus stops, user input: ${postcode}`)
            }
        }
    // catch an error if the postcode entered is invalid & invite user to give correct postcode
    } catch (error) {
        console.log( 'Invalid postcode.');
        logger.log('error',`Invalid postcode, user input: ${postcode}`);
        const rerun = prompt('Type 1 to try again ');
         if (rerun === "1") {
             run();
         }
    }
}
run()