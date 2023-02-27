const path=require("path");
const {parse} = require('csv-parse');
const fs=require('fs');
const planets=require('./planets.mongo');

function isHabitablePlanet(planet){
    if (planet.koi_disposition==='CONFIRMED'&& planet.koi_insol>0.36 && planet.koi_insol<1.11 && planet.koi_prad<1.6 ){
        return true;
    }
    return false;
}

function loadPlanetsData(){
    return new Promise((resolve, reject)=>{    
        fs.createReadStream(path.join(__dirname,'..', '..', 'data', 'kepler_data.csv'))
            .pipe(parse({
                comment: '#',
                columns: true
            }))
            .on('data', async (data)=>{
                if (isHabitablePlanet(data)){
                    savePlanets(data);
            }
            })
            .on('error', (err)=>{
                console.log(err);
                reject(err);
            })
            .on('end', async ()=>{
                const data=(await getAllPlanets()).length
                console.log(`Number of habitable planets are: ${data}`);
                resolve();
            });
        });
    }

async function getAllPlanets(){
    return await planets.find({},{
        '_id':0, '__v':0
    });
    //return habitablePlanets;
}
async function savePlanets(planet){
    try{
        await planets.updateOne({
            kepler_name: planet.kepler_name
        },{
            kepler_name: planet.kepler_name
        },
        {
            upsert: true
        });
    }
    catch(err){
        console.log(`Planets not saved: \n${err}`);
    }
}

module.exports={
    loadPlanetsData,
    getAllPlanets
};