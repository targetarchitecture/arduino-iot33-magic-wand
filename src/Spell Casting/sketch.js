
let wandTime = 600; //Number of readings (100 IMU measurements, 3 measures (X,Y,Z), for 2 seconds)  
let numberOfSpells = 3; //Number of spells for the model
let model;
let testSpells = {};
const serviceUuid = "2A5A20B9-0000-4B9C-9C69-4975713E0FF2"; // The serviceUuid must match the serviceUuid of the device you would like to connect
let accelerationCharacteristic;
let ax = 0, ay = 0, az = 0;
let myBLE = new p5ble();
let wait = ms => new Promise((r, j) => setTimeout(r, ms));
let confidences = {};
let spells = {};
const factor = 0.0000152590218966964;
let motionBuffer = new CircularBuffer(wandTime); //create ring buffer (100 IMU measurements, 3 measures (X,Y,Z), for 2 seconds)
let lastSpell = "";

function preload() {

  let url = 'http://127.0.0.1:8080/spells/spells.json';
  spells = loadJSON(url);
  console.log(spells);

  url = 'http://127.0.0.1:8080/spells/test spells.json';
  testSpells = loadJSON(url);
  console.log(testSpells);
}

function setup() {

  select('#connectButton').mousePressed(connectAndStartNotify);

  createCanvas(400, 400);
  background(200);
  textSize(15);
  textAlign(CENTER, CENTER);

  let options = {
    inputs: wandTime,
    outputs: numberOfSpells,
    task: 'classification',
    debug: true
  }
  model = ml5.neuralNetwork(options);

  loadAndTrainModel();

  // const modelInfo = {
  //   model: 'model/model.json',
  //   metadata: 'model/model_meta.json',
  //   weights: 'model/model.weights.bin'
  // };

  // console.log("model.load");
  // model.load(modelInfo, modelLoaded());

}

function modelLoaded() {
  console.log("modelLoaded");
}

function loadAndTrainModel() {
  // Get keys.
  let spellNames = Object.keys(spells);

  // ... Write the keys in a loop.
  for (let i = 0; i < spellNames.length; i++) {

    let spellName = spellNames[i];

    console.log("spellName: " + spellName);

    let spellTraining = spells[spellName];

    for (let j = 0; j < spellTraining.length; j++) {

      let spellAttempt = spellTraining[j];

      console.log(spellAttempt.wandMovements);

      let target = [spellName];

      model.addData(spellAttempt.wandMovements, target);
    }
  }

  console.log(model);

  //train the model
  console.log('starting normalizeData');
  model.normalizeData();

  state = 'training';
  console.log('starting training');

  let trainingOptions = {
    epochs: 200
  }
  model.train(trainingOptions, whileTraining, finishedTraining);
}

function whileTraining(epoch, loss) {
  console.log(epoch);
}

function finishedTraining() {
  console.log('finished training.');

  model.save();
  console.log('finished saving.');

  state = 'prediction';

  //run the test spells to check accuracy
  console.log('wandClassifyTest');

  // ... Write the keys in a loop.
  let spellTesting = testSpells["Circle"];

  //console.log(spellTesting);

  for (let j = 0; j < spellTesting.length; j++) {

    //let j = 5;
    //console.log(j);

    let spellTest = spellTesting[j];

    console.log(spellTest);

    let t0 = performance.now();
    model.classify(spellTest.wandMovements, gotTestResults);
    let t1 = performance.now();
    console.log("model.classify " + (t1 - t0) + " milliseconds.");
  }
}

function gotTestResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  console.log(results);
}

// BLUETOOTH LOW ENERGY FUNCTIONS 
function connectAndStartNotify() {
  // Connect to a device by passing the service UUID
  myBLE.connect(serviceUuid, gotCharacteristics);
}

// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
  if (error) {
    console.log('error: ', error);
    return;
  }

  console.log(characteristics);

  accelerationCharacteristic = characteristics[0];
  myBLE.startNotifications(accelerationCharacteristic, handleAcceleration, 'string');
}

// WAND MOVEMENT CLASSIFICATION FUNCTIONS
function handleAcceleration(data) {

  //console.log(data);

  let lines = data.trim().split("\n");
  let ax = 0;
  let ay = 0;
  let az = 0;

  lines.forEach(element => {
    let measurements = element.split(",");

    ax = measurements[0];
    ay = measurements[1];
    az = measurements[2];

    //https://stats.stackexchange.com/questions/70801/how-to-normalize-data-to-0-1-range
    let normalizedAx = (ax - (-32768)) * factor;
    let normalizedAy = (ay - (-32768)) * factor;
    let normalizedAz = (az - (-32768)) * factor;

    //console.log('Acceleration X: %s\tAcceleration Y: %s\tAcceleration Z: %s', normalizedAx, normalizedAy, normalizedAz);

    motionBuffer.push(normalizedAx);
    motionBuffer.push(normalizedAy);
    motionBuffer.push(normalizedAz);
  });

  //check to see if ring buffer is full
  if (motionBuffer.length() == wandTime) {

    //let t0 = performance.now();

    //let wandMovements = motionBuffer.toArray();
    //model.classify(wandMovements, gotResults);

    model.classify(motionBuffer.toArray(), gotResults);

    //let t1 = performance.now();
    //console.log("model.classify " + (t1 - t0) + " milliseconds.");
  }
}

function gotResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }

  //console.log(results);
  let txt = "";

  for (let j = 0; j < results.length; j++) {
    let result = results[j];
    let label = result.label;
    let confidence = result.confidence;

    txt = txt + label + " : " + confidence + "\n";

    //review top 1
    if (j == 0) {

      //create an array of confidence levels for each spell found
      if (confidences[label] == undefined) {
        confidences[label] = [];
      }

      //add the top classification confidence to the array
      confidences[label].push(confidence);

      //sort numerically
      confidences[label].sort(function (a, b) { return b - a });

      //truncate to top 10 results
      let top = confidences[label].slice(0, 9);

      confidences[label] = top;

      if (label != "Resting") {
        console.log(label);
        console.log(confidences[label]);
      }

      if (confidence > 0.7 && label != "Resting") {
        lastSpell = label;
      }
    }
  }

  txt = "Last Spell: " + lastSpell + "\n" + txt;

  //if (label != "Resting") {
  clear();

  text(txt, width / 2, height / 2);
  //}

  // wandClassify();
}



