import time
import json
import random
import paho.mqtt.client as mqtt
import requests
import os

MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto")
BACKEND_URL = "http://backend:8000/simulator/status"

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

def connect_mqtt():
    while True:
        try:
            client.connect(MQTT_BROKER, 1883, 60)
            client.loop_start()
            print("Симулятор подключен к MQTT")
            break
        except:
            print("Ожидание MQTT брокера...")
            time.sleep(2)

def get_status():
    try:
        response = requests.get(BACKEND_URL)
        return response.json().get("enabled", False)
    except:
        return False

def simulate():
    connect_mqtt()
    lat, lon = 55.7558, 37.6173
    while True:
        if get_status():
            temp = round(random.uniform(15.0, 30.0), 1)
            client.publish("farm/sensors/t1/temperature", json.dumps({"value": temp}))
            hum = round(random.uniform(40.0, 80.0), 1)
            client.publish("farm/sensors/h1/humidity", json.dumps({"value": hum}))
            lat += random.uniform(-0.001, 0.001)
            lon += random.uniform(-0.001, 0.001)
            client.publish("farm/sensors/g1/gps", json.dumps({"lat": lat, "lon": lon}))
            print(f"Отправлены данные: T={temp}, H={hum}, GPS={lat},{lon}")
        time.sleep(5)

if __name__ == "__main__":
    simulate()
