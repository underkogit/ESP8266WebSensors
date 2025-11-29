

#ifndef WIFI_CONNECTED_H
#define WIFI_CONNECTED_H

#include <ESP8266WiFi.h>
#include "wifiConfig.h"

const char *content_type = "text/html; charset=utf-8";
const char *content_type_json = "application/json";

bool connectToWiFi()
{
    Serial.println("Connecting to Wi-Fi...");

    WiFi.begin(ssid, password);

    int attempts = 0;          // Счетчик попыток подключения
    const int maxAttempts = 5; // Максимальное количество попыток

    // Пытаемся подключиться, пока не установлено соединение или не исчерпаны все попытки
    while (WiFi.status() != WL_CONNECTED  )
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

#endif // WIFI_CONFIG_H
