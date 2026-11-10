#include "edgeops_mqtt.h"

#include <stdbool.h>

#include "edgeops_device.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"
#include "mqtt_client.h"
#include "sdkconfig.h"

#define MQTT_CONNECTED_BIT BIT0
#define TOPIC_BUFFER_SIZE 128
#define PAYLOAD_BUFFER_SIZE 256

static const char *TAG = "edgeops_mqtt";
static esp_mqtt_client_handle_t mqtt_client;
static EventGroupHandle_t mqtt_events;
static bool client_started;
static char will_topic[TOPIC_BUFFER_SIZE];
static char will_payload[PAYLOAD_BUFFER_SIZE];

static void publish_online_presence(void)
{
    char topic[TOPIC_BUFFER_SIZE];
    char payload[PAYLOAD_BUFFER_SIZE];
    edgeops_device_presence_topic(topic, sizeof(topic));
    edgeops_device_online_payload(payload, sizeof(payload));
    int message_id = esp_mqtt_client_publish(mqtt_client, topic, payload, 0, 1, true);
    ESP_LOGI(TAG, "online presence queued, message_id=%d topic=%s", message_id, topic);
}

static void mqtt_event_handler(void *arguments, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    (void)arguments;
    (void)event_base;
    (void)event_data;

    switch ((esp_mqtt_event_id_t)event_id) {
    case MQTT_EVENT_CONNECTED:
        ESP_LOGI(TAG, "MQTT connected");
        xEventGroupSetBits(mqtt_events, MQTT_CONNECTED_BIT);
        publish_online_presence();
        break;
    case MQTT_EVENT_DISCONNECTED:
        xEventGroupClearBits(mqtt_events, MQTT_CONNECTED_BIT);
        ESP_LOGW(TAG, "MQTT disconnected; ESP-IDF reconnect is enabled");
        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGE(TAG, "MQTT transport error");
        break;
    default:
        break;
    }
}

static void heartbeat_task(void *argument)
{
    (void)argument;
    char topic[TOPIC_BUFFER_SIZE];
    char payload[PAYLOAD_BUFFER_SIZE];
    edgeops_device_state_topic(topic, sizeof(topic));

    while (true) {
        vTaskDelay(pdMS_TO_TICKS(CONFIG_EDGEOPS_HEARTBEAT_PERIOD_SECONDS * 1000));
        EventBits_t bits = xEventGroupGetBits(mqtt_events);
        if ((bits & MQTT_CONNECTED_BIT) == 0) {
            continue;
        }

        uint64_t uptime_seconds = (uint64_t)(esp_timer_get_time() / 1000000LL);
        edgeops_device_state_payload(payload, sizeof(payload), uptime_seconds);
        int message_id = esp_mqtt_client_publish(mqtt_client, topic, payload, 0, 0, false);
        ESP_LOGI(TAG, "state heartbeat queued, message_id=%d uptime=%llu",
                 message_id, (unsigned long long)uptime_seconds);
    }
}

void edgeops_mqtt_start(void)
{
    if (client_started) {
        return;
    }
    client_started = true;

    edgeops_device_presence_topic(will_topic, sizeof(will_topic));
    edgeops_device_offline_payload(will_payload, sizeof(will_payload));

    const esp_mqtt_client_config_t mqtt_config = {
        .broker.address.uri = edgeops_mqtt_broker_uri(),
        .credentials.client_id = edgeops_device_id(),
        .session.last_will = {
            .topic = will_topic,
            .msg = will_payload,
            .msg_len = 0,
            .qos = 1,
            .retain = true,
        },
        .network = {
            .reconnect_timeout_ms = 5000,
            .disable_auto_reconnect = false,
        },
    };

    mqtt_events = xEventGroupCreate();
    mqtt_client = esp_mqtt_client_init(&mqtt_config);
    ESP_ERROR_CHECK(mqtt_client == NULL ? ESP_FAIL : ESP_OK);
    ESP_ERROR_CHECK(esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID,
                                                   mqtt_event_handler, NULL));
    ESP_ERROR_CHECK(esp_mqtt_client_start(mqtt_client));
    xTaskCreate(heartbeat_task, "edgeops_heartbeat", 4096, NULL, 5, NULL);
    ESP_LOGI(TAG, "MQTT client started, broker=%s device_id=%s",
             edgeops_mqtt_broker_uri(), edgeops_device_id());
}
