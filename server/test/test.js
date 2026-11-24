import { expect } from "chai";
import { it } from "mocha";
import supertest from "supertest";
import app from '../app.js';

describe('Test user api', () => {
    it('Calling user creation', async () => {
        const response = await supertest(app).post(`/user`).send({
            "u_first_name": "Test",
            "u_last_name": "API",
            "u_email": "narif@odu.com",
            "u_password": "12345678",
            "u_is_verified": 0
        });

        expect(response.status).to.equal(200);
    })
})


describe('Test get user by id api', () => {
    it('User should return status code 200', async () => {
        const u_id = "6";
        const response = await supertest(app).get(`/user/${u_id}`).send({
        });
        expect(response.status).to.equal(200);
    })
})
