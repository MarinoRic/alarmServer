# Alarm Server

## Project Description

The "Alarm Server" project allows clients to securely log in and manage a database of alarm sensors. With a user-friendly interface, clients can perform the following actions:

- **Add Sensors**: Easily add new sensors to the system.
- **Update Sensors**: Change the status, triggered state, and names of existing sensors.
- **Delete Sensors**: Remove sensors from the system as required.
- **Get Sensors**: Retrieve information on all sensors currently registered in the system.
- **Get Sensor by ID**: Fetch details of a specific sensor using its unique ID.

Designed to enhance security and efficiency, this system ensures comprehensive management and monitoring of alarm sensors, providing peace of mind and ease of use for all users.

## Technologies Used

- Express
- JavaScript
- JWT (JSON Web Tokens)
- MySQL

## Installation

To install and start the server, follow these steps:

```bash
git clone https://github.com/MarinoRic/alarmServer
cd alarmServer
npm install
```

## Configuration

Edit the `config/config.env` file adding all necessary information like database connection credentials, `jwt_secret`, and the JWT expiration date.

## API Routes

### Authentication and Registration

- `POST /login`: Log in with `email` and `password`.
- `POST /registration`: Register a new user with `email`, `password`, `name`, `surname`.

### Sensor Management

- `GET /api/v1/sensors`: Retrieve all sensors.
- `GET /api/v1/sensors/{sensorID}`: Fetch details of a specific sensor.
- `POST /api/v1/sensors`: Add a new sensor with parameters `namesensor`, `zone`, `enabled` (optional, default = 1), `triggered` (optional, default = 0).
- `PUT /api/v1/sensors/{sensorID}`: Update the details of an existing sensor.
- `DELETE /api/v1/sensors/{sensorID}`: Delete a sensor.

### Additional API Details

The GET routes for sensors support pagination, ordering, and field selection via query parameters. For example, use `?conditions` to implement these features. This flexibility helps in customizing the retrieval of sensor data according to specific requirements.
# MIT License

Copyright (c) 2024 [Marino Riccardo]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
