#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DeepSleepScheduler.h>

#define CHECK_INTERVAL 15000  // Intervallo di controllo per i sensori disattivi, in millisecondi
#define N_SENSORS 1           // Number of sensors connected

// Sensor configuration
const int sensors_pins[N_SENSORS] = { D1 };  // GPIO pins where sensors are connected
const int sensors_id[N_SENSORS] = { 7 };     // IDs for sensors for API usage

unsigned long lastCheckTime[N_SENSORS];  // Array per tenere traccia dell'ultimo controllo per ogni sensore


// WiFi network credentials
const char* ssid = "Wind3 HUB - 22526F";
const char* password = "22st4ff9bsx3hefe";

// Server base URL for API requests
const char* host_server = "https://alarm-server.onrender.com";

// User credentials for API authentication
const char* user_email = "riccardo@email.com";
const char* user_password = "password123";

String token;  // Auth token used in HTTP requests

// Function prototypes
String HttpReq(const char* type, const String& url, const String& requestBody, int& httpCode);
void getToken();
String getValueFromString_S(String data, String key);
bool getValueFromString(String data, String key);
void connectToWiFi();
void checkSensorStatus(int index);
void initializeSensors();
void handleSensorData();


String requestBody;
WiFiClientSecure client;
int statusCode;

void setup() {
  Serial.begin(115200);  // Initialize serial communication for debugging
  delay(1000);
  //Serial.println("Setup started...");
  client.setInsecure();  // Allow insecure connections - not recommended for production
  connectToWiFi();       // Connect to the specified Wi-Fi network
  getToken();            // Authenticate with server to get a token
  initializeSensors();   // Setup sensor pins
  Serial.println("Setup completed.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();  // Reconnect to WiFi if connection is lost
    getToken();       // Re-authenticate if needed
  }

  if (token.isEmpty()) {
    int counter = 0;
    while (token.isEmpty() && counter < 3) {
      ESP.deepSleep(30 * pow(10, 7));
      getToken();
      counter++;
    }
    if (token.isEmpty()) {
      Serial.println("Server not founded!");
      ESP.deepSleep(0);  // Sleep indefinitely if no token is obtained
    }
  }

  handleSensorData();  // Check and update sensor data based on the server and sensor inputs
}

void connectToWiFi() {

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void initializeSensors() {
  for (int i = 0; i < N_SENSORS; i++) {
    pinMode(sensors_pins[i], INPUT);  // Set sensor pin as input
    lastCheckTime[i] = 0;             // Inizializza il tempo dell'ultimo controllo a 0
    delay(500);                       // Stabilization delay
  }
}

void handleSensorData() {
  for (int i = 0; i < N_SENSORS; i++) {
    int sensorValue = digitalRead(sensors_pins[i]);

    if (sensorValue == HIGH) {
      // Sensore attivo, controllo immediato
      Serial.println("SENSORE " + i);
      checkSensorStatus(i);
    } else if (currentTime - lastCheckTime[i] >= CHECK_INTERVAL) {
      // Sensore disattivo, controlla solo ogni 15 secondi
      checkSensorStatus(i);
      Serial.println("SENSORE " + i);
    }
  }
}

void checkSensorStatus(int index) {
  int statusCode;
  String requestBody;
  String url = "/api/v1/sensors/" + String(sensors_id[index]) + "?select=triggered,enabled,flag";

  unsigned long currentTime = millis();
  String payload = HttpReq("GET", url, "", statusCode);

  if (statusCode != 200 || !getValueFromString(payload, "enabled")) {
    return;  // Errore di connessione o sensore non abilitato, termina la funzione
  }
  lastCheckTime[i] = currentTime;  // Aggiorna il tempo dell'ultimo controllo

  bool dbTriggered = getValueFromString(payload, "triggered");
  if (dbTriggered != (digitalRead(sensors_pins[index]) == HIGH)) {
    requestBody = "{\"triggered\": " + String(digitalRead(sensors_pins[index]) == HIGH ? "1" : "0") + ", \"flag\": \"arduino\"}";
    HttpReq("PUT", "/api/v1/sensors/" + String(sensors_id[index]), requestBody, statusCode);
  }
}


String HttpReq(const char* type, const String& url, const String& requestBody, int& httpCode) {
  if (WiFi.status() != WL_CONNECTED) {
    httpCode = -1;
    return "{}";
  }

  HTTPClient http;
  bool started = http.begin(client, String(host_server) + url);
  if (!started) {
    // Serial.println("HTTP client failed to start.");
    httpCode = -1;
    return "{}";
  }

  if (!token.isEmpty()) {
    http.addHeader("Authorization", "Bearer " + token);
  } else if (url != "/login") {
    Serial.println("Not authorized to this route!");
    return "{}";
  }

  if (strcmp(type, "POST") == 0 || strcmp(type, "PUT") == 0) {
    http.addHeader("Content-Type", "application/json");
  }


  if (strcmp(type, "GET") == 0) {
    httpCode = http.GET();
  } else if (strcmp(type, "POST") == 0) {
    httpCode = http.POST(requestBody);
  } else if (strcmp(type, "PUT") == 0) {
    httpCode = http.PUT(requestBody);
  }
  Serial.println("HTTP CODE: " + httpCode);

  if (httpCode > 0) {  // Check if HTTP request was successful
    String payload = http.getString();
    http.end();
    Serial.println(payload);
    return payload;
  } else {
    String errorMessage = http.errorToString(httpCode);
    Serial.print("HTTP request failed: ");
    Serial.println(errorMessage);
    http.end();
    return "{}";
  }
}



void getToken() {
  StaticJsonDocument<200> doc;
  doc["email"] = user_email;
  doc["password"] = user_password;
  serializeJson(doc, requestBody);
  String postResponse = HttpReq("POST", "/login", requestBody, statusCode);
  if (statusCode == 200) {
    token = postResponse;
    token.replace("\"", "");
    token.trim();
    Serial.println("TOKEN: " + token);
  } else {
    Serial.println("Failed to receive token.");
  }
}

String getValueFromString_S(String data, String key) {
  StaticJsonDocument<200> doc;
  deserializeJson(doc, data);
  return (String(doc[key]));  // Extract a string value from JSON data
}

bool getValueFromString(String data, String key) {
  StaticJsonDocument<200> doc;
  deserializeJson(doc, data);
  return (String(doc[key]) == "1");  // Convert "1"/"0" to boolean
}
