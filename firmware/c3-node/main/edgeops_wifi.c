#include "edgeops_wifi.h"

#include <stdint.h>
#include <string.h>

#include "esp_check.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_timer.h"
#include "esp_wifi.h"
#include "sdkconfig.h"

#define EDGEOPS_WIFI_RETRY_MIN_MS 1000U
#define EDGEOPS_WIFI_RETRY_MAX_MS 30000U

static const char *TAG = "edgeops_wifi";
static edgeops_wifi_connected_callback_t on_connected;
static esp_timer_handle_t reconnect_timer;
static uint32_t retry_delay_ms = EDGEOPS_WIFI_RETRY_MIN_MS;

static const char *disconnect_reason_name(uint8_t reason)
{
    switch (reason) {
    case WIFI_REASON_AUTH_FAIL:
        return "authentication failed";
    case WIFI_REASON_HANDSHAKE_TIMEOUT:
        return "handshake timeout";
    case WIFI_REASON_NO_AP_FOUND:
        return "access point not found";
    case WIFI_REASON_NO_AP_FOUND_W_COMPATIBLE_SECURITY:
        return "no access point with compatible security";
    case WIFI_REASON_NO_AP_FOUND_IN_AUTHMODE_THRESHOLD:
        return "access point below configured auth mode";
    case WIFI_REASON_ASSOC_FAIL:
        return "association failed";
    case WIFI_REASON_CONNECTION_FAIL:
        return "connection failed";
    default:
        return "see ESP-IDF Wi-Fi reason codes";
    }
}

static void connect_timer_callback(void *argument)
{
    (void)argument;
    ESP_LOGI(TAG, "attempting Wi-Fi connection");
    esp_err_t error = esp_wifi_connect();
    if (error != ESP_OK) {
        ESP_LOGW(TAG, "esp_wifi_connect failed: %s", esp_err_to_name(error));
    }
}

static void schedule_reconnect(void)
{
    if (esp_timer_is_active(reconnect_timer)) {
        return;
    }

    ESP_LOGI(TAG, "Wi-Fi reconnect scheduled in %lu ms", (unsigned long)retry_delay_ms);
    ESP_ERROR_CHECK(esp_timer_start_once(reconnect_timer, retry_delay_ms * 1000ULL));
    if (retry_delay_ms < EDGEOPS_WIFI_RETRY_MAX_MS) {
        retry_delay_ms *= 2U;
        if (retry_delay_ms > EDGEOPS_WIFI_RETRY_MAX_MS) {
            retry_delay_ms = EDGEOPS_WIFI_RETRY_MAX_MS;
        }
    }
}

static void wifi_event_handler(void *argument, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    (void)argument;

    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        schedule_reconnect();
        return;
    }

    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        const wifi_event_sta_disconnected_t *event = event_data;
        ESP_LOGW(TAG, "Wi-Fi disconnected: reason=%u (%s), rssi=%d",
                 event->reason, disconnect_reason_name(event->reason), event->rssi);
        schedule_reconnect();
        return;
    }

    if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        const ip_event_got_ip_t *event = event_data;
        retry_delay_ms = EDGEOPS_WIFI_RETRY_MIN_MS;
        ESP_LOGI(TAG, "Wi-Fi connected, address=" IPSTR, IP2STR(&event->ip_info.ip));
        if (on_connected != NULL) {
            on_connected();
        }
    }
}

void edgeops_wifi_start(edgeops_wifi_connected_callback_t connected_callback)
{
    on_connected = connected_callback;

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    ESP_ERROR_CHECK(esp_netif_create_default_wifi_sta() == NULL ? ESP_FAIL : ESP_OK);

    wifi_init_config_t init_config = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&init_config));
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_event_handler, NULL));

    const esp_timer_create_args_t timer_config = {
        .callback = connect_timer_callback,
        .name = "wifi_reconnect",
    };
    ESP_ERROR_CHECK(esp_timer_create(&timer_config, &reconnect_timer));

    wifi_config_t wifi_config = {0};
    strlcpy((char *)wifi_config.sta.ssid, CONFIG_EDGEOPS_WIFI_SSID, sizeof(wifi_config.sta.ssid));
    strlcpy((char *)wifi_config.sta.password, CONFIG_EDGEOPS_WIFI_PASSWORD, sizeof(wifi_config.sta.password));
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    wifi_config.sta.pmf_cfg.capable = true;
    wifi_config.sta.pmf_cfg.required = false;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    ESP_LOGI(TAG, "Wi-Fi station started for SSID '%s'", CONFIG_EDGEOPS_WIFI_SSID);
}
