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
        if (geoLocation.status === 404) {
            console.log('Invalid London postcode , please try again.');
            logger.log('warning', `${geoLocation.error}, user input: ${postcode}`);
            const rerun = prompt('Type 1 to try again ');
            if (rerun === "1") {
                    run();
            }  
        } else {
        const lat = geoLocation.result.latitude;
        const lon = geoLocation.result.longitude;

        // get nearest busStops in radius 500m from Tfl API
        const nearestBusStops = await fetch(`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=500`)
            .then(response => response.json())
            .catch(err => console.log(err));

        const nearestTwoStops = [];
        const naptanIdTwoStops = [];
        // maybe change the 2 arrays to object 
        //aaaa: [
        //     {natanid: SVGPathSegLinetoVerticalRel,
        //     name: kkkk},
        //     {

        //     }
        // ]
        if (nearestBusStops.stopPoints.length >= 2) {
            for (let i = 0; i < 2; i++) {
                const naptanId = nearestBusStops.stopPoints[i].naptanId;
                naptanIdTwoStops.push(naptanId)
                nearestTwoStops.push(`${nearestBusStops.stopPoints[i].commonName}, ${nearestBusStops.stopPoints[i].indicator}`)
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
            console.log(`Type 1 to get directions to the ${nearestTwoStops[0]}\nType 2 to get directions to the ${nearestTwoStops[1]}: `)
            const directionsNeeded = prompt(`Type 1 or 2: `);
            if (directionsNeeded === "1") {
                naptanId = naptanIdTwoStops[0];
                walkingDirection(postcode, naptanId);
            } else if (directionsNeeded === '2') {
                naptanId = naptanIdTwoStops[1]
                walkingDirection(postcode, naptanId);
            } else {
                console.log('Thank you, have a good journey!');
            }

            // log to console and logger that there are no nearby bus stops to a valid postcode
        } else {
            console.log('There are no nearby bus stops.')
            logger.log('info', `Valid postcode, no nearby bus stops, user input: ${postcode}`)
        }
        // catch an error if the postcode entered is invalid & invite user to give correct postcode
    } 
} catch (error) {
        console.log(error);
        logger.log('error', error);
      
    }
}
run()

async function walkingDirection(postcode, naptanId) {
const directionsToBusStop = await fetch(`https://api.tfl.gov.uk/Journey/JourneyResults/${postcode}/to/${naptanId}?timeIs=Arriving&journeyPreference=LeastInterchange&mode=walking&accessibilityPreference=NoRequirements&walkingSpeed=Slow&cyclePreference=None&bikeProficiency=Easy
                `)
                .then(response => response.json())
                .catch(err => console.log(err));

            //journey summary
            console.log(`\nTime to bus stop: ${directionsToBusStop.journeys[0].duration} mins`)

            // walking to busstop:
            for (let i = 0; i < directionsToBusStop.journeys[0].legs[0].instruction.steps.length; i++) {
                console.log(directionsToBusStop.journeys[0].legs[0].instruction.steps[i].descriptionHeading + ' ' + directionsToBusStop.journeys[0].legs[0].instruction.steps[i].description)
            }
        }