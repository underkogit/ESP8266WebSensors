#include "wifiConnected.h"
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include "Adafruit_SHT31.h"
#include "webui.h"
#include <chipStatus.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <ArduinoJson.h>

#define LED_PIN 2

ESP8266WebServer server(80);
Adafruit_SHT31 sht31 = Adafruit_SHT31();
Adafruit_AHTX0 aht;
Adafruit_BMP280 bmp280;

void setupRoutes()
{
    server.on("/", []()
              { server.send(200, "text/html", htmlContent); });

    server.on("/api/ping", []()
              {
                server.sendHeader("Access-Control-Allow-Origin", "*");  
                server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
                StaticJsonDocument<500> doc;   

          
                    doc["status"] = true;
             
                String jsonOutput;
                serializeJsonPretty(doc, jsonOutput);

                server.send(200, "application/json", jsonOutput); });

    server.on("/api/restart", []()
              { ESP.restart(); });

    server.on("/api/chip", []()
              { server.send(200, "application/json", chipStatusJson()); });

    server.on("/api/sensors", []()
              {
                server.sendHeader("Access-Control-Allow-Origin", "*");  
                server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
                StaticJsonDocument<500> doc;   

                // SHT31
                float sht_temperature, sht_humidity;
                if (sht31.readBoth(&sht_temperature, &sht_humidity)) {
                    doc["sht31"]["temperature"]["value"] = sht_temperature;
                    doc["sht31"]["temperature"]["unit"] = "°C";
                    
                    doc["sht31"]["humidity"]["value"] = sht_humidity;
                    doc["sht31"]["humidity"]["unit"] = "%";
                } else {
                    doc["sht31"]["error"] = "SHT31 read failed";
                }

                // AHT20
                sensors_event_t aht_humidity, aht_temp;
                if (aht.getEvent(&aht_humidity, &aht_temp)) {
                    doc["aht20"]["temperature"]["value"] = aht_temp.temperature;
                    doc["aht20"]["temperature"]["unit"] = "°C";
                    
                    doc["aht20"]["humidity"]["value"] = aht_humidity.relative_humidity;
                    doc["aht20"]["humidity"]["unit"] = "%";
                } else {
                    doc["aht20"]["error"] = "AHT20 read failed";
                }

                // BMP280
                float bmp_temperature = bmp280.readTemperature();
                float pressure = bmp280.readPressure() / 100.0;
                if (!isnan(bmp_temperature)) {
                    doc["bmp280"]["temperature"]["value"] = bmp_temperature;
                    doc["bmp280"]["temperature"]["unit"] = "°C";
                    
                    doc["bmp280"]["pressure"]["value"] = pressure;
                    doc["bmp280"]["pressure"]["unit"] = "гПа";
                } else {
                    doc["bmp280"]["error"] = "BMP280 read failed";
                }

                String jsonOutput;
                serializeJsonPretty(doc, jsonOutput);

                server.send(200, "application/json", jsonOutput); });
}

void setupSensors()
{
    Wire.begin(4, 5); // SDA, SCL

    if (!sht31.begin(0x44))
    {
        Serial.println("SHT31 не найден");
    }

    if (!aht.begin())
    {
        Serial.println("AHT20 не найден");
    }

    if (!bmp280.begin(0x77)) // Возможен адрес 0x77
    {
        Serial.println("BMP280 не найден");
    }

    bmp280.setSampling(
        Adafruit_BMP280::MODE_NORMAL,   // Режим работы
        Adafruit_BMP280::SAMPLING_X2,   // Температура
        Adafruit_BMP280::SAMPLING_X16,  // Давление
        Adafruit_BMP280::FILTER_X16,    // Фильтр
        Adafruit_BMP280::STANDBY_MS_500 // Время простоя
    );
}
void setup()
{
    pinMode(LED_PIN, OUTPUT);
    Serial.begin(115200);
    WiFi.mode(WIFI_STA);
    Wire.begin(4, 5);

    setupSensors();

    Serial.println("Connecting to Wi-Fi...");
    connectToWiFi();
    setupRoutes();

    server.begin();
}

void loop()
{

    server.handleClient();
}
