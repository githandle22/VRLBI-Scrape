
const MongoClient = require('mongodb').MongoClient;
const Server = require('mongodb').Server;

// var Store_list = require('./VRLBI_Prop_list');       // this was used to initially populate the storeCollection
//var store_list = new Prop_list();              // this was used to initially populate the storeCollection
function Db_if(){      // constructor for database interfaces
    this.dbName = 'scrape_vrlbi';
    this.client = '';           
            // Create a new MongoClient
    this.connectToDB = async function(){
        server = new Server('127.0.0.1', 27017); //localhost
        this.client = new MongoClient(server);
        try {
            await this.client.connect() 
            console.log("DB_IF: Connected successfully to server");
            this.db = this.client.db("scrape_vrlbi"); 
        } catch(e) {
            console.error(e);
        }
        return ("DB_if.connectToDB: success");
    }
    this.close = async function(){
        await this.client.close();
        console.log("DB_IF: Successfully disconnected from server");
        return ("DB_if.disconnect: success");
    }
    this.writeWeekLookup = async function(arrayOfObjects){ // write week lookup data to weekLookup (once a year)
        result_db = await this.db.collection("weekLookup").insertMany(arrayOfObjects);
        return result_db.insertedCount;       
    }
    this.readWeekLookup = async function(){ // read week lookup data for most recent year. Return array of objects
        cursor = await this.db.collection("weekLookup").find().sort({year: -1}).limit(1);
        result_db = await cursor.toArray();
        yearMax = result_db[0].year;
        cursor = await this.db.collection("weekLookup").find({year: yearMax}).sort({weekID: 1});
        result_db = await cursor.toArray();
        return result_db;       
    }
    this.readScanStatus = async function(){
        cursor = await this.db.collection("scanStatus").find().sort({sampleNum: -1}).limit(1);
        result = await cursor.toArray();
        return (result);    // returns one document, the current scan status
    }
    this.writeNewScan = async function(newScan){   // used at the start of a new scan
        var newScan = {};
        cursor = await this.db.collection("scanStatus").find().project({ _id: 1}).sort({_id: -1}).limit(1);
        result = await cursor.toArray();
        console.log('DB_IF: previous scan number = ', result[0]._id);
        newScan._id = result[0]._id + 1;   // this takes the place of auto-increment
        console.log('DB_IF:newScan = ', newScan);
        await this.db.collection("scanStatus").insertOne(newScan);
        return (newScan._id);
    }
    this.updateScanStatus = async function(update){       // during a scan, keep track of progress
        var scanID = {}
        scanID._id = update._id;
        var propID = {};    // *** _id  ***
        propID._id = update.lastProp;   // *** _id  ***   
        let localUpdateObject = update;
        delete localUpdateObject._id;      // remove this property - can't overwrite the _id
        console.log('DB_IF: scanID = ', scanID._id);
        await this.db.collection("scanStatus").updateOne({_id: scanID._id}, { $set: localUpdateObject });
        update._id = scanID._id;        // put the scanID back in the object for next time
        return ('Db_if.updateScanStatus: success');
    } 
    // returns an array of active properties within limits from propCollection
    this.readPropertyList = async function(limitsObject){   
        var propIDMin = limitsObject.propIDMin;
        var propIDMax = limitsObject.propIDMax;
        cursor = await this.db.collection("propCollection").find({
                                activeProp: true, 
                                sampleNum: {$lt: this.sampleNumber}});
                                // .sort({sampleNum: -1}).limit(1);
        result = await cursor.toArray();
        return result;
    }
    this.readSingleProperty = async function(propIDTarget){
        cursor = await this.db.collection("propCollection").find({_id: propIDTarget});   // *** _id  ***
        result = await cursor.toArray();
        return result;
    }
    this.addSingleProperty = async function(propStaticObject, propDynamicObject){
        result_db = await this.db.collection("propDynamic").insertOne(propDynamicObject);
        result_db = await this.db.collection("propCollection").insertOne(propStaticObject);
        return result_db.insertedCount;
    }
    this.writePropertyList = async function(arrayOfObjects){  // write newly found properties to propCollection
        result_db = await this.db.collection("propCollection").insertMany(arrayOfObjects);
        return result_db.insertedCount;
    }
    this.updatePropInactive = async function(propertyID, sampleNum){   
    // flag property as not active in propCollection, add property to inactiveProp
        result_db = await this.db.collection("propCollection").updateOne({_id: propertyID},  // *** _id  ***
                                    { $set: {activeProp: false}});
        cursor = await this.db.collection("inactiveProps").find({_id: propertyID}); // test if prop is logged
        oneDocument = await cursor.toArray();
        if(oneDocument.length < 1){     // prop is not in inactiveProps, so add it
            result_db = await this.db.collection("inactiveProps")
                                            .insertOne({_id: propertyID, sampleNum: sampleNum})  // *** _id  ***
        }
        return true;
    }
    this.addToInactiveProp = async function(propertyID, sampleNum){
    // put in inactiveProps, but check to make sure that it isn't already there
        cursor = await this.db.collection("inactiveProps").find({_id: propertyID}); // test if prop is already in database
        oneDocument = await cursor.toArray();
        if(oneDocument.length < 1){     // prop is not in inactiveProps, so add it
            result_db = await this.db.collection("inactiveProps")
                                            .insertOne({_id: propertyID, sampleNum: sampleNum})  // *** _id  ***
        }
        return true;
    }
    this.removeFromPropInactive = async function(propertyID){
        cursor = await this.db.collection("inactiveProps").find({_id: propertyID}); // test if prop is already in database
        oneDocument = await cursor.toArray();
        if(oneDocument.length > 0){     // prop is in inactiveProps, delete it
            result_db = await this.db.collection("inactiveProps")
                                            .deleteOne({_id: propertyID})  // *** _id  ***
        }
        return true;        
    }
    this.removeActiveProps = async function(propIDArray){   
        let arrayLength = propIDArray.length;
        let newArray = [];
        let i=0;
        let j=0;
        for(i=0; i<arrayLength; i++){
            cursor = await this.db.collection("propCollection").find({_id: propIDArray[i], activeProp: true}); // test if prop is logged
            oneDocument = await cursor.toArray(); // length will be 0 if property is not in active list
            if(oneDocument.length < 1){     // prop is not in collection, add it to the output list  
                newArray[j] = propIDArray[i];
                j++;
            }
            else{       // make sure that since it is an active property, it is not in the inactive property list
                result_db = await this.db.collection("inactiveProps")
                                            .deleteOne({_id: propIDArray[i]});
            }
        }
        return(newArray);   // array of properties with id that are not marked active
    }
    this.removeInactiveProps = async function(propIDArray, sampleNum){ // if a property is specifcally marked inactive, remove it from the list
        let arrayLength = propIDArray.length;
        let newArray = [];
        let i=0;
        let j=0;
        for(i=0; i<arrayLength; i++){
            cursor = await this.db.collection("propCollection").find({_id: propIDArray[i], activeProp: false}); // test if prop is logged
            oneDocument = await cursor.toArray(); // length will be 0 if property is not in the collection of properties
            if(oneDocument.length == 0){     // prop is not in collection, add it to the output list  
                newArray[j] = propIDArray[i];
                j++;
            }
            else{
                cursor = await this.addToInactiveProp(propIDArray[i],sampleNum);
            }
        }
        return(newArray);        // this will contain all new ids not in propCollection
    }
    this.determine_sampNum = async function(){ // find highest used sampleNum; if any activeProps have sampleNum less than this,
                                                //   use this highest sampleNum, if no activeProps are less, 
                                                // add one to sampleNum and use this
        cursor = await this.db.collection("propCollection")
                                .find().sort({ sampleNum: -1 }).limit(1); //{activeProp: true}
        oneDocument = await cursor.toArray();          
        sampleNumber = oneDocument[0].sampleNum;    // this is highest used sampleNum
                // now look for the lowest sampleNum for an activeProp
        cursor = await this.db.collection("propCollection")
                                .find({activeProp: true, sampleNum: {$lt: sampleNumber}}).sort({ sampleNum: 1 }).limit(1);
        oneDocument = await cursor.toArray();
        if(oneDocument[0]){console.log("DB_IF.determine_sampNum: still need to complete sampNum: ", sampleNumber);}
        else{                           // all active properties are at the same sampleNumber, so begin the next sample number
            console.log("DB_IF.determine_sampNum: begin next sampNum");
            sampleNumber++;
        }
        console.log("DB_IF.determine_sampNum sampleNumber = ", sampleNumber);
        return(sampleNumber);
    }
     this.determine_scanNum = async function(){     // find highest used scanNum; return one higher
        cursor = await this.db.collection("scanStatus")
                                .find().sort({ _id: -1 }).limit(1);
        oneDocument = await cursor.toArray();          
        scanNumber = oneDocument[0]._id + 1;
        console.log("DB_IF.determine_sampNum scanNumber = ", scanNumber);
        return(scanNumber);
    }
    this.get_propList = async function(sampleNumber){ 
        arrayList = [];
        cursor = await this.db.collection("propCollection")
                        .find({ activeProp: true,   
                                sampleNum: {$lt: sampleNumber}}) 
                                .project({ _id:1 }); // *** _id  ***
        result = await cursor.toArray();
        lengthOfResult = result.length;
        for (i=0; i<lengthOfResult; i++){
            arrayList[i] = result[i]._id;    // *** _id  ***
        }
        return (arrayList);
    }
    this.writePropStaticData = async function(propStaticObject){  // for one property, write static data to propCollection
         console.log("DB_IF: writing Static Data", propStaticObject); 
        result_db = await this.db.collection("propCollection").updateOne({_id: propStaticObject._id}, // *** _id  ***
                                                                {$set: propStaticObject}, {upsert: true});
        console.log("DB_IF: Successfully wrote Static Data, result = ", result_db.result);
        return ('DB_IF: success');
        }
    this.writePropDynamicData = async function(propDynamicObject){  // for one property, write dynamic data to propDynamic
        result_db = await this.db.collection("propDynamic").updateOne({_id: propDynamicObject._id},   // *** _id  ***
                                                                {$set: propDynamicObject}, {upsert: true});
        console.log("DB_IF: Successfully wrote Dynamic Data, result = ", result_db.result);
        return ('DB_IF: success');
        }
    this.writeRates = async function(ratesObject){  // for one property, write dynamic data to propDynamic
         console.log("DB_IF: writing Rates Data", ratesObject); 
        result_db = await this.db.collection("rates").updateOne({_id: ratesObject._id},   // *** _id  ***
                                                                {$set: ratesObject}, {upsert: true});
        console.log("DB_IF: Successfully wrote Rates Data, result = ", result_db.result); 
        return ('DB_IF: success');
        }
    this.writePropBookedData = async function(bookedWeeksArray, propID){  // write the new booked data to bookedWeeks
        // if a booked week for a particular property is already in the database, don't rewrite it
        // so each week in bookedWeeksArray must be checked to see if it is already in the database
        // if it is, delete it from the array
        // after all are checked, go ahead and write the remaining booked weeks
        // doing this preserves the sample number so that it can be determined when the week was booked
        const bookedWeeksCount = bookedWeeksArray.length;
        var i=0;
        var j=0;
        var onlyNewBookedWeeks = [];
        for(i=0; i<bookedWeeksCount; i++){
            var weekID = bookedWeeksArray[i].weekID;
            cursor = await this.db.collection("bookedWeeks").find({propID: propID, weekID: weekID, sampleNum: {"$gt":19}});  
            result = await cursor.toArray();
            var weekIsPresent = result.length;
//    console.log("DB_IF.writePropBookedData: weekIsPresent = ", weekIsPresent, " weekID = ", weekID);
            if(weekIsPresent > 0){}    // the week is already in the database, don't save it as new
            else{           // the week is not in the database, copy it to the array to be written to the database
    console.log("DB_IF.writePropBookedData: this is a new booked week ****  weekID = ", weekID);
                onlyNewBookedWeeks[j] = bookedWeeksArray[i];
                j++;
            }
        }
        if(onlyNewBookedWeeks.length > 0){  // only write to the database if there is at least one new week
            result_db = await this.db.collection("bookedWeeks").insertMany(onlyNewBookedWeeks);
    console.log("DB_IF: writePropBookedData: Successfully wrote onlyNewBookedWeeks, result = ", result_db.result);   
        }
        else{
    console.log("DB_IFwritePropBookedData: no new booked weeks for propID = ", propID);        // *** _id  ***
        }
        return ('DB_IF: success');
        }

    this.create_Collection = async function(collectionName, initialDocument){
        cursor = await this.db.collection(collectionName).insertOne(initialDocument);
        console.log('DB_IF: created a new collection: ', collectionName, ' inserted: ',  cursor.insertedCount);
    }
    this.oneTimeBuildInactiveProps = async function(){
        let i=0;
        let count = 601;
        let oneDocument = [];
        for(i=1; i<count; i++){
            cursor = await this.db.collection("propCollection").find({_id: i})  // *** _id  ***
            oneDocument = await cursor.toArray();
            if(oneDocument.length < 1){     // prop is not in propCollection, so write it to inactiveProps
                result_db = await this.db.collection("inactiveProps")
                                            .insertOne({_id: propertyID, sampleNum: 0})  // *** _id  ***
            }            
        }
    }
 }      // end of Db_if module.exports = Db_if;

module.exports = Db_if;