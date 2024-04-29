#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
//#include <WiFiClientSecure.h>
#include <DeepSleepScheduler.h>

const char* ssid = "Wind3 HUB - 22526F";
const char* password = "22st4ff9bsx3hefe";
const char* host_server = "https://alarm-server.onrender.com";

//const char* host_server = "http://192.168.1.2:5000";

const char* user_email = "riccardo@email.com";
const char* user_password = "password123";
String token;

String requestBody;
WiFiClientSecure client;
int statusCode;

//esp8266 input pin  -- id sensor in database
#define N_SENSORS 1

const int sensors_pins[1] = { 1 };
const int sensors_id[1] = { 7 };


String HttpReq(const char* type, const String& url, const String& requestBody, int& httpCode);
void getToken();
int getTriggeredValue(const char* json, char* key);
String getValueFromString_S(String data, String key);
bool getValueFromString(String data, String key);


void setup() {
  Serial.begin(115200);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  client.setInsecure();

  Serial.println("Connected to WiFi!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  getToken();

  for (int i = 0; i < N_SENSORS; i++) {
    pinMode(i, INPUT);
    delay(500);
  }
}

void loop() {

  if (WiFi.status() != WL_CONNECTED)
    for (int i = 0; i <= 3; i++) {
      ESP.deepSleep(5 * pow(10, 7));
      getToken();
    }

  if (token == "") {
    ESP.deepSleep(0);
    return;
  } else {
    Serial.println("TOKEN :" + token);
  }

  //digitalRead(sensors_pins[i] == HIGH) ;
  int sensorValue = 0;

  for (int i = 0; i < N_SENSORS; i++) {
    String payload = HttpReq("GET", "/api/v1/sensors/" + String(sensors_id[i]) + "?select=triggered,enabled,flag", "", statusCode);
    Serial.println(payload);



    if (statusCode != 200) {
      Serial.println("ID sensors not founded! ");
      return;
    }
    if (!getValueFromString(payload, "enabled")) break;

    String putResponse;
    delay(500);
    if (sensorValue == 1) {
      if (getValueFromString(payload, "triggered") || (!getValueFromString(payload, "triggered") && getValueFromString_S(payload, "flag") == "arduino")) {
        requestBody = "{\"triggered\": \"1\", \"flag\": \"arduino\"}";
        Serial.println("SENSORE: HIGH; TRIGGERED: 1 || SENSORE: HIGH; FLAG: ARDUINO");
      } else {
        Serial.println("SENSORE: HIGH; TRIGGERED: 0 || SENSORE: HIGH; FLAG: USER");
        requestBody = "{\"triggered\": \"0\", \"flag\": \"arduino\"}";
      }
    } else {
      if(getValueFromString_S(payload, "flag") == "user")
        requestBody = "{\"triggered\": \"0\", \"flag\": \"arduino\"}";
      else return;
    }
    Serial.println(requestBody);
    putResponse = HttpReq("PUT", "/api/v1/sensors/" + String(sensors_id[i]), requestBody, statusCode);
    Serial.println("PUT RESPONSE: " + putResponse);
    delay(500);
  }

  delay(5000);
}

//@visibility Private
//@desc Http request;
//HTTP REQUESTS SUPPORTED:
//GET, POST, PUT
String HttpReq(const char* type, const String& url, const String& requestBody, int& httpCode) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    httpCode = -1;
    return "{}";
  }

  HTTPClient http;
  http.begin(client, String(host_server) + url);

  if (token != "")
    http.addHeader("authorization", "Bearer " + String(token));


  Serial.println(type == "GET");
  Serial.println(type == "POST");
  Serial.println(type == "PUT");


  if (type == "GET") {

    Serial.print("GET" + String(host_server) + url);
    httpCode = http.GET();

  } else if (type == "POST") {
    http.addHeader("Content-Type", "application/json");  // Set content type for JSON
    Serial.print("POST" + String(host_server) + url);
    httpCode = http.POST(requestBody);

  } else if (type == "PUT") {
    http.addHeader("Content-Type", "application/json");  // Set content type for JSON
    Serial.print("PUT" + String(host_server) + url);
    httpCode = http.PUT(requestBody);
  } else {
    Serial.println("Invalid req selected");
    return "{}";
  }

  Serial.println(httpCode);
  String payload = http.getString();
  http.end();

  return payload;
}


//@desc Return authentication login
void getToken() {
  StaticJsonDocument<200> doc;
  doc["email"] = String(user_email);
  doc["password"] = String(user_password);
  serializeJson(doc, requestBody);
  Serial.println(requestBody);

  String postResponse = HttpReq("POST", "/login", requestBody, statusCode);

  Serial.println("POST RESPONSE: " + postResponse);
  if (statusCode == 200) {
    postResponse.replace("\"", "");
    token = postResponse;
    token.trim();
    Serial.println("TOKEN: " + token + "\n HTTP CODE: " + statusCode);

  } else {
    Serial.println("Error: connection failed!" + postResponse);
  }
}

//get string value from JSON data
String getValueFromString_S(String data, String key) {
  StaticJsonDocument<200> doc;

  DeserializationError error = deserializeJson(doc, data);

  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return "{}";
  }

  StaticJsonDocument<200> doc1;
  DeserializationError error1 = deserializeJson(doc1, String(doc["results"][0]));

  if (error1) {
    Serial.print(F("deserializeJson1() failed: "));
    Serial.println(error1.f_str());
    return "{}";
  }


  return (String(doc1[key]));
}



//get Value from Json
bool getValueFromString(String data, String key) {
  StaticJsonDocument<200> doc;

  DeserializationError error = deserializeJson(doc, data);

  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return false;
  }

  StaticJsonDocument<200> doc1;
  DeserializationError error1 = deserializeJson(doc1, String(doc["results"][0]));

  if (error1) {
    Serial.print(F("deserializeJson1() failed: "));
    Serial.println(error1.f_str());
    return false;
  }

  return (String(doc1[key]) == "1") ? true : false;
}
