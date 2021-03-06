/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { HealthcareContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('HealthcareContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new HealthcareContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"healthcare 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"healthcare 1002 value"}'));
    });

    describe('#healthcareExists', () => {

        it('should return true for a healthcare', async () => {
            await contract.healthcareExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a healthcare that does not exist', async () => {
            await contract.healthcareExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createHealthcare', () => {

        it('should create a healthcare', async () => {
            await contract.createHealthcare(ctx, '1003', 'healthcare 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"healthcare 1003 value"}'));
        });

        it('should throw an error for a healthcare that already exists', async () => {
            await contract.createHealthcare(ctx, '1001', 'myvalue').should.be.rejectedWith(/The healthcare 1001 already exists/);
        });

    });

    describe('#readHealthcare', () => {

        it('should return a healthcare', async () => {
            await contract.readHealthcare(ctx, '1001').should.eventually.deep.equal({ value: 'healthcare 1001 value' });
        });

        it('should throw an error for a healthcare that does not exist', async () => {
            await contract.readHealthcare(ctx, '1003').should.be.rejectedWith(/The healthcare 1003 does not exist/);
        });

    });

    describe('#updateHealthcare', () => {

        it('should update a healthcare', async () => {
            await contract.updateHealthcare(ctx, '1001', 'healthcare 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"healthcare 1001 new value"}'));
        });

        it('should throw an error for a healthcare that does not exist', async () => {
            await contract.updateHealthcare(ctx, '1003', 'healthcare 1003 new value').should.be.rejectedWith(/The healthcare 1003 does not exist/);
        });

    });

    describe('#deleteHealthcare', () => {

        it('should delete a healthcare', async () => {
            await contract.deleteHealthcare(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a healthcare that does not exist', async () => {
            await contract.deleteHealthcare(ctx, '1003').should.be.rejectedWith(/The healthcare 1003 does not exist/);
        });

    });

});