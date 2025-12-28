

#ifndef WIFI_CONNECTED_H
#define WIFI_CONNECTED_H

#include <ESP8266WiFi.h>
#include "wifiConfig.h"

void scanNetworks();
const char *content_type = "text/html; charset=utf-8";
const char *content_type_json = "application/json";

bool connectToWiFi()
{
    Serial.println("Connecting to Wi-Fi...");

    WiFi.begin(ssid, password);

   // scanNetworks();

    int attempts = 0;
    const int maxAttempts = 5;

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(1000); // Задержка перед следующей попыткой
        Serial.println("Attempting to connect...");
    }

    // Проверка статуса подключения
    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("Connected to Wi-Fi!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        return true; // Успешное подключение
    }
    else
    {
        Serial.println("Failed to connect to Wi-Fi. Please check your credentials.");
        return false; // Не удалось подключиться
    }
}

void scanNetworks()
{
    WiFi.disconnect();
    delay(100);

    Serial.println("Scanning for WiFi networks...");

    // Scan for networks
    int n = WiFi.scanNetworks();

    if (n == 0)
    {
        Serial.println("No networks found");
    }
    else
    {
        Serial.print(n);
        Serial.println(" networks found");
        Serial.println("-------------------");

        for (int i = 0; i < n; i++)
        {
            // Print SSID and RSSI for each network
            Serial.print(i + 1);
            Serial.print(": ");
            Serial.print(WiFi.SSID(i));
            Serial.print(" (");
            Serial.print(WiFi.RSSI(i));
            Serial.print(" dBm)");
            Serial.print(" Channel: ");
            Serial.print(WiFi.channel(i));

            // Print encryption type
            Serial.print(" Encryption: ");
            switch (WiFi.encryptionType(i))
            {
            case ENC_TYPE_NONE:
                Serial.println("Open");
                break;
            case ENC_TYPE_WEP:
                Serial.println("WEP");
                break;
            case ENC_TYPE_TKIP:
                Serial.println("WPA/PSK");
                break;
            case ENC_TYPE_CCMP:
                Serial.println("WPA2/PSK");
                break;
            case ENC_TYPE_AUTO:
                Serial.println("WPA/WPA2/PSK");
                break;
            default:
                Serial.println("Unknown");
            }

            // Print BSSID (MAC address)
            uint8_t *bssid = WiFi.BSSID(i);
            Serial.print("  BSSID: ");
            for (int j = 0; j < 6; j++)
            {
                Serial.print(bssid[j], HEX);
                if (j < 5)
                    Serial.print(":");
            }
            Serial.println();

            // Check if network is hidden
            Serial.print("  Hidden: ");
            Serial.println(WiFi.isHidden(i) ? "Yes" : "No");

            Serial.println();
        }
    }

    // Delete scan result to free memory
    WiFi.scanDelete();
}

#endif // WIFI_CONFIG_H
