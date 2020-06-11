/*
  ArduinoBLE IMU
  This example creates a BLE peripheral with service that contains two
  characteristics(acceleration, gyroscope)
  The circuit:
  No extra circuit setup is required. You can use -
  - Arduino Nano 33 BLE
  - or Nano 33 IoT
  - or Uno WiFi Rev 2
  This example code is made by Sandeep Mistry(@sandeepmistry)
*/
#include <Arduino.h>
#include <ArduinoBLE.h>
#include <Arduino_LSM6DS3.h>

void flashLED(int delayms);
int16_t totalMessageCounter = 0;
unsigned long prevMillis = 0;
unsigned long prevCounter = 0;
const int numberOfMessagesBeforeBLE = 10; // 20; // 10; // 26; // 52; //Accelerometer running at 104Hz
int MessageCounter = 0;

BLEService imuService("2A5A20B9-0000-4B9C-9C69-4975713E0FF2");
BLECharacteristic accelerationCharacteristic("2A5A20B9-0001-4B9C-9C69-4975713E0FF2", BLENotify, 500);
//BLECharacteristic accelerationCharacteristic("2A5A20B9-0003-4B9C-9C69-4975713E0FF2", BLENotify, sizeof(int16_t) * numberOfMessagesBeforeBLE * 4);

void setup()
{
  Serial.begin(9600);

  delay(5000);

  Serial.println("Welcome to the wand");

  if (!IMU.begin())
  {
    Serial.println("Failed to initialize IMU!");

    flashLED(250);
  }

  if (!BLE.begin())
  {
    Serial.println("Failed to initialize BLE!");
    flashLED(500);
  }

  BLE.setLocalName("Magic Wand");
  BLE.setDeviceName("Magic Wand");
  BLE.setAdvertisedService(imuService);

  imuService.addCharacteristic(accelerationCharacteristic);

  BLE.addService(imuService);

  BLE.advertise();
}

void loop()
{
  String s = "";
  int MessageCounter = 0;

  while (true)
  {
    delay(1);

    if (IMU.accelerationAvailable())
    {
      int16_t ax, ay, az;

      // x, y, z
      IMU.readAccelerationAsInt16(ax, ay, az);

      // s.concat(totalMessageCounter);
      // s.concat(":");
      s.concat(ax);
      s.concat(",");
      s.concat(ay);
      s.concat(",");
      s.concat(az);
      s.concat("\n");

      //Serial.print(s);

      totalMessageCounter = totalMessageCounter + 1;
      MessageCounter = MessageCounter + 1;

      if (MessageCounter == numberOfMessagesBeforeBLE)
      {
        break;
      }
    }
  }

  if (BLE.connected())
  {
    if (accelerationCharacteristic.subscribed())
    {
      // Serial.print("Send BLE message (length: ");
      // Serial.print(s.length());
      // Serial.println(")");
      Serial.print(s);

      int retVal;

      retVal = accelerationCharacteristic.writeValue(s.c_str());

      //Serial.println(retVal);
      Serial.println("----------------------------------");

      //delay(1000);
    }
  }

  if ((millis() - prevMillis) > 1000)
  {
    Serial.print(totalMessageCounter - prevCounter);
    Serial.println(" messages per second");

    prevMillis = millis();
    prevCounter = totalMessageCounter;
  }
}

void flashLED(int delayms)
{
  pinMode(LED_BUILTIN, OUTPUT);

  while (1)
  {
    digitalWrite(LED_BUILTIN, HIGH); // turn the LED on (HIGH is the voltage level)
    delay(delayms);                  // wait
    digitalWrite(LED_BUILTIN, LOW);  // turn the LED off by making the voltage LOW
    delay(delayms);                  // wait
  }
}