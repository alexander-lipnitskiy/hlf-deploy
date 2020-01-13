/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const NodeRSA = require('node-rsa');
const ClientIdentity = require('fabric-shim');

const MEDICAL_RECORD = 'MR';
const PATIENT = 'PATIENT';
const PRACTITIONER = 'PRACTITIONER';

class HealthcareContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        const medicalRecords = [{
            version: '1',
            type: 'FHIR_Bundle',
            authorised: [{ pk: 'pkpr1', key: 'key' }],
            owner: 'me',
            author: 'hospital1',
            hash: 'filehash'
        }, {
            version: '1',
            type: 'FHIR_Bundle',
            metadata: {},
            authorised: [{ pk: 'pkpr2', key: 'key2' }],
            owner: 'me2',
            author: 'hospital1',
            hash: 'filehash2'
        }, {
            version: '1',
            type: 'FHIR_Bundle',
            authorised: [],
            owner: 'me3',
            author: 'hospital1',
            hash: 'filehash3'
        }, {
            version: '1',
            type: 'FHIR_Bundle',
            authorised: [],
            owner: 'me4',
            author: 'hospital1',
            hash: 'filehash4'
        }];

        for (let i = 0; i < medicalRecords.length; i++) {
            await ctx.stub.putState(`${MEDICAL_RECORD}_${[i]}`, JSON.stringify(medicalRecords[i]));
            console.info('Added <--> ', medicalRecords[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async medicalRecordExists(ctx, medicalRecordID) {
        const buffer = await ctx.stub.getState(`${MEDICAL_RECORD}_${medicalRecordID}`);
        return (!!buffer && buffer.length > 0);
    }
    //["6", "2","6","2","6", "2","6"]
    async createMedicalRecord(ctx, args) {
        const {
            medicalRecordID, type, version, authorised, ipfsHash, owner, author
        } = JSON.parse(args);

        const exists = await this.medicalRecordExists(ctx, medicalRecordID);
        if (exists) {
            throw new Error(`The medical record ${medicalRecordID} already exists`);
        }
        const asset = { medicalRecordID, version, type, authorised, ipfsHash, owner, author };

        const buffer = Buffer.from(JSON.stringify(asset));

        await ctx.stub.putState(`${MEDICAL_RECORD}_${medicalRecordID}`, buffer);

        return {
            txid: ctx.stub.getTxID()
        };
    }

    async updateMedicalRecord(ctx, prevIpfsHash, newIpfsHash, type, pk, role) {
        let assets = undefined;
        let iterator = undefined;

        if (role == 'patient') {
            //["me", "FHIR_Bundle","patient"]
            //return latest version of patients medical data
            const query = {
                selector: {
                    hash: prevIpfsHash,
                    type: typeOfMedicalRecord
                }
            }

            iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            let allResults = [];

            allResults = await this.getAllResults(iterator, false);

            return allResults;
        } else if (role == 'doctor') {
            //["pkpr2",  "doctor"]
            //return latest version of patients medical data shared
            const query = {
                selector: {
                    "authorised": {
                        "$elemMatch": { hash: prevIpfsHash }
                    },
                    type: typeOfMedicalRecord
                }
            }

            iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            let allResults = [];

            allResults = await this.getAllResults(iterator, false);

            return allResults;
        } else if (role == 'researcher') {
            //["pkpr2",  "researcher"]
            //return latest version of patients medical data shared
            const query = {
                selector: {
                    "authorised": {
                        "$elemMatch": { hash: prevIpfsHash }
                    },
                    type: typeOfMedicalRecord
                }
            }

            iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            let allResults = [];

            allResults = await this.getAllResults(iterator, false);

            return allResults;
        } else {
            throw new Error(`Not authorised`);
        }
    }

    // role /patient/doctor/researcher
    async readMedicalRecord(ctx, pk, typeOfMedicalRecord, role) {
        let assets = undefined;
        let iterator = undefined;

        if (role == 'patient') {
            //["me", "FHIR_Bundle","patient"]
            //return latest version of patients medical data
            const query = {
                selector: {
                    owner: pk,
                    type: typeOfMedicalRecord
                }
            }

            iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            let allResults = [];

            allResults = await this.getAllResults(iterator, false);

            return JSON.stringify(allResults);;
        } else if (role == 'doctor') {
            //["pkpr2",  "doctor"]
            //return latest version of patients medical data shared
            const query = {
                selector: {
                    "authorised": {
                        "$elemMatch": { pk: pk }
                    },
                    type: typeOfMedicalRecord
                }
            }

            iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            let allResults = [];

            allResults = await this.getAllResults(iterator, false);

            return JSON.stringify(allResults);
        } else if (role == 'researcher') {
            //["pkpr2",  "researcher"]
            //return latest version of patients medical data shared
            const query = {
                selector: {
                    "authorised": {
                        "$elemMatch": { pk: pk }
                    },
                    type: typeOfMedicalRecord
                }
            }

            iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
            let allResults = [];

            allResults = await this.getAllResults(iterator, false);

            return JSON.stringify(allResults);
        } else {
            throw new Error(`Not authorised`);
        }
    }

    async patientGrantAccess(ctx, type, senderPK, receipientPK, key) {
        // ["FHIR_Bundle", "me2", ""]
        const query = {
            selector: {
                type: type,
                owner: senderPK
            }
        }

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        let allResults = [];

        allResults = await this.getAllResults(iterator, false);

        // get latest version of medical record
        var medicalRecord = allResults.reduce(function (prev, current) {
            return (prev.version > current.version) ? prev : current
         });

        let index = medicalRecord.Record.authorised.findIndex(item => item.pk == receipientPK);

        if (index >= 0) {
            medicalRecord.Record.authorised[index].date = Date()
        } else {
            const permission = { pk: receipientPK, key: key, date: Date() };
            medicalRecord.Record.authorised.push(permission)
        }
            
        await ctx.stub.putState(`${medicalRecord.Key}`, Buffer.from(JSON.stringify(medicalRecord.Record)));
    }

    async revokeMedicalRecord(ctx, senderPK, receipientPK, type) {
        //[ "me2", "pk55", "FHIR_Bundle"]
        const query = {
            selector: {
                owner: senderPK,
                type: type
            }
        }

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        let allResults = [];

        allResults = await this.getAllResults(iterator, false);
        
        // get latest version of medical record
        var medicalRecord = allResults.reduce(function (prev, current) {
            return (prev.version > current.version) ? prev : current
         });

        const index = medicalRecord.Record.authorised.findIndex(item => item.pk == receipientPK);

        if (index >= 0) {
            medicalRecord.Record.authorised.splice(index, 1)
        } 

        await ctx.stub.putState(`${medicalRecord.Key}`, Buffer.from(JSON.stringify(medicalRecord.Record)));
    }

    async getAllResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.Timestamp = res.value.timestamp;
                    jsonRes.IsDelete = res.value.is_delete.toString();
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }
}



module.exports = HealthcareContract;
