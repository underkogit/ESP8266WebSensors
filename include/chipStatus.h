#ifndef CHIPSTATUS_H
#define CHIPSTATUS_H

#include <ArduinoJson.h>
#include <ESP8266WiFi.h>

String chipStatusJson()
{
    StaticJsonDocument<200> doc;

    doc["chipModel"] = "ESP8266";

    uint32_t chipId = ESP.getChipId();
    String chipIdString = String(chipId, HEX);
    chipIdString.toUpperCase();
    doc["chipId"] = chipIdString;

    doc["sdkVersion"] = ESP.getSdkVersion();
    doc["chipCores"] = 1;
    doc["flashSize"] = ESP.getFlashChipSize();
    if (WiFi.status() == WL_CONNECTED)
    {
        doc["localIP"] = WiFi.localIP().toString();
    }
    String jsonOutput;
    serializeJson(doc, jsonOutput);

    return jsonOutput;
}
#endif