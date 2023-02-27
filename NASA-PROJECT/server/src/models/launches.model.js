const launchesDB=require('./launches.mongo');
const planets=require('./planets.mongo');
const axios=require('axios');
const launches=new Map();

const SPACEX_API_URL='https://api.spacexdata.com/v4/launches/query'
const DEFAULT_FLIGHT_NUMBER=100;

async function populateLaunches(){
    console.log('Loading launches data!');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
            {
                path: 'rocket',
                select: {
                    name: 1
                }
            },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });
    const stat=response.staus;
    if (stat != 200){
        console.log("Problem in SpaceX API");
        console.log(response.status);
        //throw new Error('Launch Data Download Failed');
    }
    const launchDocs=response.data.docs;
    for (const launchDoc of launchDocs ){
        const payloads=launchDoc['payloads'];
        const customers=payloads.flatMap((payload)=>{
            return payload['customers']
        });
        const launchSpace={
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers
        };
        console.log(`${launchSpace.flightNumber} ${launchSpace.mission}`);
        await saveLaunch(launchSpace);
    }
} 
async function loadLaunchesData(){
    const firstLaunch=await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    });
    if(firstLaunch){
        console.log('Data was already loaded');
    }else{
        await populateLaunches();
    }
}
async function getAllLaunches(skip, limit){
    return await launchesDB
        .find({},{'_id': 0, '__v':0})
        .sort({flightNumber: 1})
        .skip(skip)
        .limit(limit)   
}
async function saveLaunch(launch1){
    await launchesDB.findOneAndUpdate({
        flightNumber: launch1.flightNumber
    },launch1,{ 
        upsert: true
    })
} 
async function scheduleNewLaunch(launch2){
    const planet=await planets.findOne({
        kepler_name: launch1.target
    })
    if(!planet){
        throw new Error('No Matching Planet Found!');
    }
    const newFlightNumber=await getLatestFlightNumber()+1;
    const newLaunch=Object.assign(launch2, {
        success: true,
        upcoming: true,
        customer: ['Dev', 'Private'],
        flightNumber: newFlightNumber
    });
    await saveLaunch(newLaunch);
}
async function existsLaunchWithID(launchId){
    return await findLaunch({
        flightNumber: launchId
    });
}
async function abortLaunchById(launchId){
    const aborted= await launchesDB.updateOne({
        flightNumber: launchId
    },{
        upcoming: false,
        success: false
    });
    return aborted.acknowledged===true && aborted.modifiedCount===1;
}
async function getLatestFlightNumber(){
    const latestLaunch=await launchesDB.findOne({}).sort('-flightNumber') //adding the minus because you want it to be descending
    if(!latestLaunch){
        return DEFAULT_FLIGHT_NUMBER;
    }
    else{
        return latestLaunch.flightNumber;
    }
}
async function findLaunch(filter){
    return await launchesDB.findOne(filter);
}

module.exports={
    loadLaunchesData,
    getAllLaunches,
    scheduleNewLaunch,
    existsLaunchWithID,
    abortLaunchById 
};