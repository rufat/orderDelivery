const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const orderID = 'FBOifgGY8';

describe('Server', () => {
    it('Placing an order', (done) => {
        chai.request('http://localhost:8080/')
            .post('order')
            .send({
                origin: {
                    lat: 40.393326,
                    long: 49.841216
                },
                destination: {
                    lat: 40.394071,
                    long: 49.827668
                }
            })
            .end((err, res) => {
                if(err) return done(err);
                expect(res, res.body.error).to.have.status(200);
                assert.isObject(res.body);
                expect(res.body.success).to.be.true;
                expect(res.body.status).to.equal('UNASSIGN');
                return done();
            });
    });
    it('Taking order [Requires valid orderID @ (\\test\\index.js])', (done) => {
        chai.request('http://localhost:8080/')
            .put(`order/${orderID}`) // this ID should be available in database and equal to 'UNASSIGN'.
            .send({
                status: 'taken'
            })
            .end((err, res) => {
                if(err) return done(err);
                expect(res, res.body.error).to.have.status(200);
                assert.isObject(res.body);
                expect(res.body.success).to.be.true;
                return done();
            });
    });
    it('Listing orders', (done) => {
        chai.request('http://localhost:8080/')
            .get('orders')
            .end((err, res) => {
                if(err) return done(err);
                expect(res, res.body.error).to.have.status(200);
                assert.isObject(res.body);
                expect(res.body.success).to.be.true;
                return done();
            });
    });
});