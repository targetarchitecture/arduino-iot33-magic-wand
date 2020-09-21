The project uses ML5JS (ml5js.org) and an Arduino Nano IoT 33 to create a neural network that takes real time motion from the IMU on the Arduino which is transmitted over BLE to a computer. The computer is running Chrome browser with the experimental BLE API enabled. 

IMU X,Y,Z measurements are captured at 100Hz, batched into sets of 10 messages to be sent over Bluetooth at 10Hz and below the 251 byte limit. 

HTML5, P5JS and ML5JS  are used to receive the wand motions, these are added to a ring buffer capable of holding 2 seconds of motion - which is estimated size for each spell. The ring buffer is constantly updated with the wand motion, which is then sent to the neural network for classification. 

Classification takes around 5ms, with the confidence levels displayed on the page in the P5 canvas. The last spell cast is shown,  which has a confidence of more than 0.8 (80%).

Considering the training sets are only 10 repetitions of each of the two spells "Circle" and "Zoro" and only 20 sets of the wand resting and being held. The accuracy seems remarkably high with only a small amount of training data for an object moving around in free space.

I still have much to learn, as this was a time-boxed project of 30 days. 

You can read more at my website [Scratching the surface of AI](https://www.targetarchitecture.info/scratching-the-surface-of-ai)
