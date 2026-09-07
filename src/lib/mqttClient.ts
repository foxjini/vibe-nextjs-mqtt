'use client';

import mqtt, { MqttClient } from 'mqtt';
import { BrokerConfig, ConnectionStatus, MQTTMessage } from '@/types/mqtt';

export const DEFAULT_BROKER_CONFIG: BrokerConfig = {
  name: 'EMQX Public Cloud (권장)',
  brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
  clientId: `vibe_agent_${Math.random().toString(16).substring(2, 8)}`,
  topic: 'iot/traffic',
  cleanSession: true,
  keepalive: 60,
};

export const BROKER_PRESETS: BrokerConfig[] = [
  {
    name: 'EMQX Public Cloud (권장, 보안 WSS)',
    brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
    clientId: '',
    topic: 'iot/traffic',
    cleanSession: true,
    keepalive: 60,
  },
  {
    name: 'HiveMQ Public Broker (WSS 8884)',
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
    clientId: '',
    topic: 'iot/traffic',
    cleanSession: true,
    keepalive: 60,
  },
  {
    name: 'Mosquitto Test Broker (WSS 8081)',
    brokerUrl: 'wss://test.mosquitto.org:8081',
    clientId: '',
    topic: 'iot/traffic',
    cleanSession: true,
    keepalive: 60,
  },
  {
    name: '원격 윈도 PC Mosquitto (WS 9001)',
    brokerUrl: 'ws://192.168.0.10:9001',
    clientId: '',
    topic: 'iot/traffic',
    cleanSession: true,
    keepalive: 60,
  },
  {
    name: '로컬 브로커 (Localhost WS 9001)',
    brokerUrl: 'ws://localhost:9001',
    clientId: '',
    topic: 'iot/traffic',
    cleanSession: true,
    keepalive: 60,
  },
];

export class MQTTService {
  private client: MqttClient | null = null;
  private status: ConnectionStatus = 'disconnected';
  private currentConfig: BrokerConfig = DEFAULT_BROKER_CONFIG;
  private statusListeners: Set<(status: ConnectionStatus, err?: string) => void> = new Set();
  private messageListeners: Set<(msg: MQTTMessage) => void> = new Set();

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getConfig(): BrokerConfig {
    return this.currentConfig;
  }

  public onStatusChange(listener: (status: ConnectionStatus, err?: string) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public onMessage(listener: (msg: MQTTMessage) => void) {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  private notifyStatus(status: ConnectionStatus, err?: string) {
    this.status = status;
    this.statusListeners.forEach(fn => fn(status, err));
  }

  public connect(config: BrokerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client) {
        try {
          this.client.end(true);
        } catch {
          // ignore
        }
      }

      this.currentConfig = config;
      this.notifyStatus('connecting');

      const clientId = config.clientId || `vibe_${Math.random().toString(16).substring(2, 8)}`;

      try {
        this.client = mqtt.connect(config.brokerUrl, {
          clientId,
          clean: config.cleanSession,
          keepalive: config.keepalive,
          username: config.username || undefined,
          password: config.password || undefined,
          connectTimeout: 10000,
          reconnectPeriod: 5000,
        });

        this.client.on('connect', () => {
          this.notifyStatus('connected');
          if (config.topic) {
            this.subscribe(config.topic);
          }
          resolve();
        });

        this.client.on('error', (err) => {
          console.error('MQTT Error:', err);
          this.notifyStatus('error', err.message);
        });

        this.client.on('offline', () => {
          this.notifyStatus('disconnected');
        });

        this.client.on('close', () => {
          if (this.status !== 'disconnected') {
            this.notifyStatus('disconnected');
          }
        });

        this.client.on('message', (topic, payloadBuffer, packet) => {
          const payload = payloadBuffer.toString();
          const message: MQTTMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            topic,
            payload,
            timestamp: Date.now(),
            qos: packet.qos,
            retain: packet.retain || false,
          };
          this.messageListeners.forEach(fn => fn(message));
        });
      } catch (err: unknown) {
        this.notifyStatus('error', (err as Error).message);
        reject(err);
      }
    });
  }

  public disconnect() {
    if (this.client) {
      try {
        this.client.end(true);
      } catch {
        // ignore
      }
      this.client = null;
    }
    this.notifyStatus('disconnected');
  }

  public subscribe(topic: string, qos: 0 | 1 | 2 = 0) {
    if (!this.client || this.status !== 'connected') return;
    this.client.subscribe(topic, { qos }, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });
  }

  public unsubscribe(topic: string) {
    if (!this.client || this.status !== 'connected') return;
    this.client.unsubscribe(topic);
  }

  public publish(topic: string, message: string, qos: 0 | 1 | 2 = 0, retain: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || this.status !== 'connected') {
        reject(new Error('MQTT Client is not connected'));
        return;
      }

      this.client.publish(topic, message, { qos, retain }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const mqttService = typeof window !== 'undefined' ? new MQTTService() : ({} as MQTTService);
