const { mongo } = require('mongoose');
const request=require('supertest');
const app=require('../app')
const {mongoConnect, mongoDisconnect}=require('../services/mongo')

describe('Launches API', ()=>{
    beforeAll(async ()=>{
        await mongoConnect();
    })
    afterAll(async ()=>{
        await mongoDisconnect();
    })

    describe('Test GET /launches', ()=>{
        test('It should respond with 200 SUCCESS',async ()=>{
            const response=await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });
    
    describe('Test POST /launch', ()=>{
        const completeLaunchData={
            mission: 'TEST DATA',
            rocket: 'NCC Rand',
            target: 'Kepler-1652 b',
            launchDate: 'January 4,2029'
        }
        const launchDataWithoutDate={
            mission: 'TEST DATA',
            rocket: 'NCC Rand',
            target: 'Kepler-1652 b',
        }
        const launchDataWithWrongDate={
            ...completeLaunchData,
            launchDate: 'Hello'
        }
        test('It should respond with 201 SUCCESS',async ()=>{
            const response=await request(app)
                .post('/v1/launches')
                .send(completeLaunchData)
                .expect('Content-Type', /json/)
                .expect(201);
            const requestDate=new Date(completeLaunchData.launchDate).valueOf();
            const responseDate=new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate)
            expect(response.body).toMatchObject(launchDataWithoutDate)
        })
        test('It should catch missing required properties',async ()=>{
            const response=await request(app)
                .post('/v1/launches')
                .send(launchDataWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body).toStrictEqual({
                error: 'Missing Required Properties'
            })
    
        })
        test('It should catch inavlid launch date',async ()=>{
            const response=await request(app)
                .post('/v1/launches')
                .send(launchDataWithWrongDate)
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body).toStrictEqual({
                error: "Invalid Launch Date"
            })  
        })
    
    });
})
