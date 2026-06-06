import os
import json
import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session
from models import SessionLocal, SensorData
from datetime import datetime

MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
TOPIC = "farm/sensors/#"

def on_connect(client, userdata, flags, rc, properties=None):
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        db = SessionLocal()
        parts = msg.topic.split('/')
        device_id = parts[2]
        sensor_type = parts[3]
        new_data = SensorData(
            device_id=device_id,
            sensor_type=sensor_type,
            value=payload.get("value"),
            latitude=payload.get("lat"),
            longitude=payload.get("lon"),
            timestamp=datetime.utcnow()
        )
        db.add(new_data)
        db.commit()
        db.close()
    except Exception:
        pass

def start_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        return client
    except Exception:
        return None
